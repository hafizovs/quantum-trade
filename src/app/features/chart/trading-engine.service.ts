import { Injectable, computed, inject } from '@angular/core';
import { ASSET_IDS, TICK_VOLUME_RANGES, getAssetSeed } from '../../core/constants/assets.constants';
import {
  DEFAULT_RNG_SEED,
  MAX_TICK_HISTORY,
  MIN_PRICE,
  TICK_DT_SEC,
} from '../../core/constants/market.constants';
import {
  NEWS_MAX_MS,
  NEWS_MIN_MS,
} from '../../core/constants/news.constants';
import {
  DEFAULT_LEVERAGE,
  MAX_LEVERAGE,
  MIN_LEVERAGE,
  MIN_NOTIONAL_USD,
} from '../../core/constants/portfolio.constants';
import type { AssetId } from '../../core/models/asset-id.model';
import type { CandleIntervalSec } from '../../core/models/candle-interval.model';
import { CandleAggregator } from '../../domain/market/candle-aggregator';
import { buildOrderBook } from '../../domain/market/order-book-builder';
import {
  applyNewsShock,
  createNewsItem,
  expireShocks,
  pickNewsTemplate,
  scheduleNextShock,
} from '../../domain/market/news-shock';
import { createId } from '../../domain/math/id-factory';
import { createMulberry32, uniform, type RandomSource } from '../../domain/math/rng';
import {
  cancelOpenOrder,
  isLimitMarketable,
  marketFillPrice,
  marketableLimitFillPrice,
  remainingQty,
  shouldTriggerLimit,
} from '../../domain/orders/matching-engine';
import {
  averageEntry,
  shouldLiquidate,
} from '../../domain/portfolio/margin';
import type {
  AssetMarketState,
  Order,
  PlaceOrderInput,
  PlaceOrderResult,
  Position,
  PriceTick,
  UserLimitOverlay,
} from '../../core/models/trading.types';
import { MarketStore } from './market.store';
import { PortfolioStore } from '../portfolio/portfolio.store';
import { UiStore } from '../../core/ui/ui.store';
import { MarketMathService } from './market-math.service';
import { ToastService } from '../../core/toast.service';

@Injectable({ providedIn: 'root' })
export class TradingEngineService {
  private readonly market = inject(MarketStore);
  private readonly portfolio = inject(PortfolioStore);
  private readonly ui = inject(UiStore);
  private readonly math = inject(MarketMathService);
  private readonly toast = inject(ToastService);

  private rng: RandomSource = createMulberry32(DEFAULT_RNG_SEED);
  private readonly candleAgg = new CandleAggregator();
  private readonly tickHistory: PriceTick[] = [];
  private nextShockAt = 0;

  readonly assets = this.market.assets.asReadonly();
  readonly selectedAssetId = this.market.selectedAssetId;
  readonly prices = this.market.prices;
  readonly candles = this.market.candles;
  readonly orderBooks = this.market.orderBooks.asReadonly();
  readonly news = this.market.news.asReadonly();
  readonly timeAndSales = this.market.timeAndSales.asReadonly();
  readonly candleIntervalSec = this.market.candleIntervalSec;
  readonly simRunning = this.market.simRunning.asReadonly();

  readonly cashUsd = this.portfolio.cashUsd.asReadonly();
  readonly positions = this.portfolio.openPositions;
  readonly allPositions = this.portfolio.positions.asReadonly();
  readonly openOrders = this.portfolio.openOrders;
  readonly allOrders = this.portfolio.orders.asReadonly();
  readonly balanceHistory = this.portfolio.balanceHistory.asReadonly();
  readonly netWorth = this.portfolio.netWorth;
  readonly totalUnrealizedPnl = this.portfolio.totalUnrealizedPnl;
  readonly tickCount = this.market.tickCount.asReadonly();
  readonly lastTickAt = this.market.lastTickAt.asReadonly();

  readonly selectedPrice = computed(() => {
    const id = this.selectedAssetId();
    return this.prices()[id];
  });

  readonly selectedAsset = computed(() => {
    const id = this.selectedAssetId();
    return this.assets().find((a) => a.id === id) ?? this.assets()[0];
  });

  readonly activeCandles = computed(() => {
    const id = this.selectedAssetId();
    return this.candles()[id] ?? [];
  });

  readonly selectedBook = computed(() => {
    const id = this.selectedAssetId();
    return this.orderBooks()[id];
  });

  constructor() {
    const now = Date.now();
    this.portfolio.seedLedger(now);
    this.nextShockAt = scheduleNextShock(now, this.rng, NEWS_MIN_MS, NEWS_MAX_MS);
    this.rebuildAllBooks(now);
  }

  markRunning(running: boolean): void {
    this.market.simRunning.set(running);
  }

  start(): void {
    this.market.simRunning.set(true);
  }

  stop(): void {
    this.market.simRunning.set(false);
  }

  selectAsset(id: AssetId): void {
    this.market.selectedAssetId.set(id);
    const price = this.market.prices()[id];
    if (this.ui.limitPrice() === null) {
      this.ui.limitPrice.set(this.math.roundToTick(price, getAssetSeed(id).tickSize));
    }
  }

  setCandleInterval(sec: CandleIntervalSec): void {
    this.market.candleIntervalSec.set(sec);
  }

  onTick(now: number): void {
    const states = { ...this.market.marketStates() };
    const cloned: Record<AssetId, AssetMarketState> = {
      BTCUSD: { ...states.BTCUSD },
      ETHUSD: { ...states.ETHUSD },
      COREAI: { ...states.COREAI },
    };

    const baseDrift: Record<AssetId, number> = {
      BTCUSD: getAssetSeed('BTCUSD').baseDrift,
      ETHUSD: getAssetSeed('ETHUSD').baseDrift,
      COREAI: getAssetSeed('COREAI').baseDrift,
    };
    const baseVol: Record<AssetId, number> = {
      BTCUSD: getAssetSeed('BTCUSD').baseVolatility,
      ETHUSD: getAssetSeed('ETHUSD').baseVolatility,
      COREAI: getAssetSeed('COREAI').baseVolatility,
    };

    expireShocks(cloned, baseDrift, baseVol, now);

    for (const assetId of ASSET_IDS) {
      const asset = getAssetSeed(assetId);
      const state = cloned[assetId];
      const z = this.math.sampleNormal(this.rng);
      const nextPrice = this.math.nextPrice(
        state.price,
        state.drift,
        state.volatility,
        TICK_DT_SEC,
        z,
        asset.tickSize,
      );
      state.price = nextPrice;
      state.lastTickAt = now;

      const volRange = TICK_VOLUME_RANGES[assetId];
      const synthVol = uniform(this.rng, volRange.min, volRange.max);
      const tick: PriceTick = {
        assetId,
        time: now,
        price: nextPrice,
        volume: synthVol,
      };
      this.tickHistory.push(tick);
      while (this.tickHistory.length > MAX_TICK_HISTORY) {
        this.tickHistory.shift();
      }
      this.candleAgg.onTick(tick);

      const book = this.buildBookForAsset(assetId, nextPrice, now);
      this.market.orderBooks.update((books) => ({
        ...books,
        [assetId]: book,
      }));

      this.matchUserLimitOrders(assetId, nextPrice, book, now);
      this.markPositions(assetId, nextPrice);
      this.checkLiquidations(assetId, nextPrice, now);

      const aggressor: 'buy' | 'sell' = z >= 0 ? 'buy' : 'sell';
      this.market.pushTape({
        id: createId('trd'),
        assetId,
        time: now,
        price: nextPrice,
        qty: synthVol,
        side: aggressor,
        isUser: false,
      });
    }

    this.market.marketStates.set(cloned);
    this.market.setCandlesSnapshot(this.candleAgg.snapshot());
    this.market.lastTickAt.set(now);
    this.market.tickCount.update((n) => n + 1);

    this.maybeEmitNewsShock(now);
  }

  placeOrder(input: PlaceOrderInput): PlaceOrderResult {
    const now = Date.now();
    const asset = getAssetSeed(input.assetId);
    const leverage = Math.round(
      Math.min(MAX_LEVERAGE, Math.max(MIN_LEVERAGE, input.leverage || DEFAULT_LEVERAGE)),
    );

    if (!Number.isFinite(input.notionalUsd) || input.notionalUsd < MIN_NOTIONAL_USD) {
      this.ui.lastTradeError.set('trade.error.invalidNotional');
      this.toast.show('warning', 'trade.error.invalidNotional');
      return { ok: false, reasonKey: 'trade.error.invalidNotional' };
    }

    if (leverage < MIN_LEVERAGE || leverage > MAX_LEVERAGE) {
      this.ui.lastTradeError.set('trade.error.invalidLeverage');
      this.toast.show('warning', 'trade.error.invalidLeverage');
      return { ok: false, reasonKey: 'trade.error.invalidLeverage' };
    }

    const book = this.market.orderBooks()[input.assetId];
    const mid = this.market.prices()[input.assetId];
    const side = input.positionSide === 'long' ? 'buy' : 'sell';

    let refPrice = mid;
    if (input.type === 'market') {
      refPrice = marketFillPrice(input.positionSide, book, mid).fillPrice;
    } else {
      const lp = input.limitPrice ?? null;
      if (lp === null || lp <= 0 || !Number.isFinite(lp)) {
        this.ui.lastTradeError.set('trade.error.invalidLimitPrice');
        this.toast.show('warning', 'trade.error.invalidLimitPrice');
        return { ok: false, reasonKey: 'trade.error.invalidLimitPrice' };
      }
      const rounded = this.math.roundToTick(lp, asset.tickSize);
      if (Math.abs(rounded - lp) > asset.tickSize * 0.01 && rounded !== lp) {
        // allow near-tick values after round
      }
      if (rounded <= 0) {
        this.ui.lastTradeError.set('trade.error.invalidLimitPrice');
        this.toast.show('warning', 'trade.error.invalidLimitPrice');
        return { ok: false, reasonKey: 'trade.error.invalidLimitPrice' };
      }
      refPrice = rounded;
    }

    const qty = this.math.qtyFromNotional(input.notionalUsd, refPrice, asset.lotSize);
    if (qty <= 0) {
      this.ui.lastTradeError.set('trade.error.invalidNotional');
      this.toast.show('warning', 'trade.error.invalidNotional');
      return { ok: false, reasonKey: 'trade.error.invalidNotional' };
    }

    const notional = qty * refPrice;
    const margin = this.math.requiredMargin(notional, leverage);
    if (this.portfolio.cashUsd() < margin) {
      this.ui.lastTradeError.set('trade.error.insufficientMargin');
      this.toast.show('warning', 'trade.error.insufficientMargin');
      return { ok: false, reasonKey: 'trade.error.insufficientMargin' };
    }

    const order: Order = {
      id: createId('ord'),
      assetId: input.assetId,
      type: input.type,
      side,
      positionSide: input.positionSide,
      status: 'open',
      qty,
      notionalUsd: input.notionalUsd,
      limitPrice: input.type === 'limit' ? refPrice : null,
      leverage,
      filledQty: 0,
      avgFillPrice: null,
      createdAt: now,
      updatedAt: now,
      filledAt: null,
    };

    this.ui.lastTradeError.set(null);

    if (input.type === 'market') {
      const fill = marketFillPrice(input.positionSide, book, mid).fillPrice;
      const result = this.fillOrder(order, fill, now);
      this.toast.show('success', 'toast.positionOpened', {
        side: input.positionSide,
        asset: asset.symbol,
      });
      return result;
    }

    // Limit: check marketable immediately
    if (isLimitMarketable(input.positionSide, refPrice, book)) {
      const fill = marketableLimitFillPrice(input.positionSide, book);
      const result = this.fillOrder(order, fill, now);
      this.toast.show('success', 'toast.orderFilled', { asset: asset.symbol });
      return result;
    }

    this.portfolio.upsertOrder(order);
    this.rebuildBook(input.assetId, now);
    this.toast.show('info', 'toast.limitPlaced', { asset: asset.symbol });
    this.ui.setPositionsTab('orders');
    return { ok: true, orderId: order.id };
  }

  cancelOrder(orderId: string): void {
    const now = Date.now();
    const order = this.portfolio.orders().find((o) => o.id === orderId);
    if (!order || order.status !== 'open') {
      this.toast.show('warning', 'trade.error.orderNotFound');
      return;
    }
    const cancelled = cancelOpenOrder(order, now);
    this.portfolio.upsertOrder(cancelled);
    this.rebuildBook(order.assetId, now);
    this.toast.show('info', 'toast.limitCancelled');
  }

  closePosition(positionId: string): void {
    const now = Date.now();
    const pos = this.portfolio.positions().find((p) => p.id === positionId);
    if (!pos || pos.status !== 'open') {
      this.toast.show('warning', 'trade.error.positionNotFound');
      return;
    }
    const mark = this.market.prices()[pos.assetId];
    this.closePositionAt(pos, mark, now, 'closed');
    this.toast.show('success', 'toast.positionClosed');
  }

  resetSimulation(): void {
    const now = Date.now();
    this.rng = createMulberry32(DEFAULT_RNG_SEED);
    this.candleAgg.reset();
    this.tickHistory.length = 0;
    this.market.resetMarket();
    this.portfolio.resetPortfolio(now);
    this.nextShockAt = scheduleNextShock(now, this.rng, NEWS_MIN_MS, NEWS_MAX_MS);
    this.rebuildAllBooks(now);
    this.ui.clearToasts();
    this.ui.lastTradeError.set(null);
    this.toast.show('info', 'toast.reset');
  }

  private fillOrder(order: Order, fillPrice: number, now: number): PlaceOrderResult {
    const asset = getAssetSeed(order.assetId);
    const fillQty = remainingQty(order);
    const notional = fillQty * fillPrice;
    const addMargin = this.math.requiredMargin(notional, order.leverage);

    if (this.portfolio.cashUsd() < addMargin) {
      this.ui.lastTradeError.set('trade.error.insufficientMargin');
      this.toast.show('warning', 'trade.error.insufficientMargin');
      return { ok: false, reasonKey: 'trade.error.insufficientMargin' };
    }

    this.portfolio.cashUsd.update((c) => c - addMargin);
    this.portfolio.pushLedger({
      time: now,
      kind: 'openPositionMargin',
      deltaUsd: -addMargin,
      balanceAfter: this.portfolio.cashUsd(),
      noteRu: `Маржа открытой позиции ${asset.symbol}`,
      noteEn: `Margin for open position ${asset.symbol}`,
      relatedOrderId: order.id,
    });

    const filled: Order = {
      ...order,
      status: 'filled',
      filledQty: order.qty,
      avgFillPrice: fillPrice,
      updatedAt: now,
      filledAt: now,
    };
    this.portfolio.upsertOrder(filled);

    const position = this.openOrAveragePosition(filled, fillPrice, fillQty, addMargin, now);
    this.candleAgg.addVolume(order.assetId, now, fillQty);
    this.market.setCandlesSnapshot(this.candleAgg.snapshot());

    this.market.pushTape({
      id: createId('trd'),
      assetId: order.assetId,
      time: now,
      price: fillPrice,
      qty: fillQty,
      side: order.side,
      isUser: true,
    });

    this.rebuildBook(order.assetId, now);
    this.ui.setPositionsTab('positions');

    return { ok: true, orderId: filled.id, positionId: position.id };
  }

  private openOrAveragePosition(
    order: Order,
    fillPrice: number,
    fillQty: number,
    addMargin: number,
    now: number,
  ): Position {
    const existing = this.portfolio
      .positions()
      .find(
        (p) =>
          p.status === 'open' &&
          p.assetId === order.assetId &&
          p.side === order.positionSide,
      );

    if (!existing) {
      const pos: Position = {
        id: createId('pos'),
        assetId: order.assetId,
        side: order.positionSide,
        qty: fillQty,
        entryPrice: fillPrice,
        leverage: order.leverage,
        marginUsd: addMargin,
        liquidationPrice: this.math.liquidationPrice(
          order.positionSide,
          fillPrice,
          order.leverage,
        ),
        unrealizedPnl: 0,
        realizedPnl: 0,
        status: 'open',
        openedAt: now,
        closedAt: null,
        orderId: order.id,
      };
      this.portfolio.upsertPosition(pos);
      return pos;
    }

    const newQty = existing.qty + fillQty;
    const newEntry = averageEntry(existing.entryPrice, existing.qty, fillPrice, fillQty);
    const updated: Position = {
      ...existing,
      qty: newQty,
      entryPrice: newEntry,
      leverage: order.leverage,
      marginUsd: existing.marginUsd + addMargin,
      liquidationPrice: this.math.liquidationPrice(
        existing.side,
        newEntry,
        order.leverage,
      ),
      unrealizedPnl: this.math.unrealizedPnl(
        existing.side,
        newEntry,
        this.market.prices()[existing.assetId],
        newQty,
      ),
      orderId: order.id,
    };
    this.portfolio.upsertPosition(updated);
    return updated;
  }

  private matchUserLimitOrders(
    assetId: AssetId,
    marketPrice: number,
    _book: ReturnType<typeof buildOrderBook>,
    now: number,
  ): void {
    const open = this.portfolio
      .orders()
      .filter((o) => o.status === 'open' && o.type === 'limit' && o.assetId === assetId);

    for (const order of open) {
      const limitPrice = order.limitPrice;
      if (limitPrice === null) {
        continue;
      }
      if (!shouldTriggerLimit(order.positionSide, marketPrice, limitPrice)) {
        continue;
      }
      this.fillOrder(order, limitPrice, now);
      this.toast.show('success', 'toast.orderFilled', {
        asset: getAssetSeed(assetId).symbol,
      });
    }
  }

  private markPositions(assetId: AssetId, mark: number): void {
    const next = this.portfolio.positions().map((p) => {
      if (p.status !== 'open' || p.assetId !== assetId) {
        return p;
      }
      return {
        ...p,
        unrealizedPnl: this.math.unrealizedPnl(p.side, p.entryPrice, mark, p.qty),
      };
    });
    this.portfolio.replacePositions(next);
  }

  private checkLiquidations(assetId: AssetId, mark: number, now: number): void {
    const open = this.portfolio
      .positions()
      .filter((p) => p.status === 'open' && p.assetId === assetId);

    for (const pos of open) {
      if (shouldLiquidate(pos.side, mark, pos.liquidationPrice)) {
        this.closePositionAt(pos, mark, now, 'liquidated');
        this.toast.show('danger', 'toast.liquidated', {
          asset: getAssetSeed(assetId).symbol,
        });
      }
    }
  }

  private closePositionAt(
    pos: Position,
    mark: number,
    now: number,
    status: 'closed' | 'liquidated',
  ): void {
    const pnl = this.math.unrealizedPnl(pos.side, pos.entryPrice, mark, pos.qty);
    let credit = pos.marginUsd + pnl;
    if (status === 'liquidated') {
      credit = Math.max(0, credit);
    }
    this.portfolio.cashUsd.update((c) => Math.max(0, c + credit));

    const closed: Position = {
      ...pos,
      status,
      unrealizedPnl: 0,
      realizedPnl: pnl,
      closedAt: now,
    };
    this.portfolio.upsertPosition(closed);

    this.portfolio.pushLedger({
      time: now,
      kind: status === 'liquidated' ? 'liquidation' : 'closePositionPnl',
      deltaUsd: credit,
      balanceAfter: this.portfolio.cashUsd(),
      noteRu:
        status === 'liquidated'
          ? `Ликвидация ${getAssetSeed(pos.assetId).symbol}`
          : `Закрытие позиции ${getAssetSeed(pos.assetId).symbol}`,
      noteEn:
        status === 'liquidated'
          ? `Liquidation ${getAssetSeed(pos.assetId).symbol}`
          : `Close position ${getAssetSeed(pos.assetId).symbol}`,
      relatedPositionId: pos.id,
    });
  }

  private maybeEmitNewsShock(now: number): void {
    if (now < this.nextShockAt) {
      return;
    }
    const template = pickNewsTemplate(this.rng);
    const news = createNewsItem(template, now);
    const states = {
      BTCUSD: { ...this.market.marketStates().BTCUSD },
      ETHUSD: { ...this.market.marketStates().ETHUSD },
      COREAI: { ...this.market.marketStates().COREAI },
    };
    applyNewsShock(news, states, now);
    this.market.marketStates.set(states);
    this.market.pushNews(news);
    this.toast.show('info', 'toast.news');
    this.ui.setRightPaneTab('news');
    this.nextShockAt = scheduleNextShock(now, this.rng, NEWS_MIN_MS, NEWS_MAX_MS);
  }

  private userLimitOverlays(assetId: AssetId): UserLimitOverlay[] {
    return this.portfolio
      .orders()
      .filter(
        (o) =>
          o.status === 'open' &&
          o.type === 'limit' &&
          o.assetId === assetId &&
          o.limitPrice !== null,
      )
      .map((o) => ({
        price: o.limitPrice as number,
        qty: remainingQty(o),
        side: o.positionSide === 'long' ? 'bid' : 'ask',
      }));
  }

  private buildBookForAsset(assetId: AssetId, mid: number, now: number) {
    const asset = getAssetSeed(assetId);
    return buildOrderBook({
      assetId,
      mid: Math.max(mid, MIN_PRICE),
      tickSize: asset.tickSize,
      now,
      rng: this.rng,
      userLimits: this.userLimitOverlays(assetId),
    });
  }

  private rebuildBook(assetId: AssetId, now: number): void {
    const mid = this.market.prices()[assetId];
    const book = this.buildBookForAsset(assetId, mid, now);
    this.market.orderBooks.update((books) => ({ ...books, [assetId]: book }));
  }

  private rebuildAllBooks(now: number): void {
    for (const id of ASSET_IDS) {
      this.rebuildBook(id, now);
    }
  }
}
