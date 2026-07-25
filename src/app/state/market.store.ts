import { Injectable, computed, signal } from '@angular/core';
import { ASSET_SEEDS } from '../core/constants/assets.constants';
import { DEFAULT_CANDLE_INTERVAL_SEC } from '../core/constants/chart.constants';
import {
  MAX_NEWS,
  MAX_TAPE,
} from '../core/constants/market.constants';
import type { AssetId } from '../core/models/asset-id.model';
import type { CandleIntervalSec } from '../core/models/candle-interval.model';
import type {
  AssetMarketState,
  Candle,
  MarketAsset,
  NewsItem,
  OrderBookSnapshot,
  TradeTapeItem,
} from '../models/trading.types';

function emptyBooks(): Record<AssetId, OrderBookSnapshot> {
  const now = Date.now();
  return {
    BTCUSD: { assetId: 'BTCUSD', bids: [], asks: [], mid: 0, spread: 0, updatedAt: now },
    ETHUSD: { assetId: 'ETHUSD', bids: [], asks: [], mid: 0, spread: 0, updatedAt: now },
    COREAI: { assetId: 'COREAI', bids: [], asks: [], mid: 0, spread: 0, updatedAt: now },
  };
}

function emptyCandles(): Record<AssetId, Record<CandleIntervalSec, Candle[]>> {
  return {
    BTCUSD: { 5: [], 15: [] },
    ETHUSD: { 5: [], 15: [] },
    COREAI: { 5: [], 15: [] },
  };
}

function seedStates(): Record<AssetId, AssetMarketState> {
  const now = Date.now();
  const out = {} as Record<AssetId, AssetMarketState>;
  for (const a of ASSET_SEEDS) {
    out[a.id] = {
      assetId: a.id,
      price: a.basePrice,
      drift: a.baseDrift,
      volatility: a.baseVolatility,
      shockEndsAt: null,
      lastTickAt: now,
    };
  }
  return out;
}

function seedAssets(): MarketAsset[] {
  return ASSET_SEEDS.map((a) => ({ ...a }));
}

@Injectable({ providedIn: 'root' })
export class MarketStore {
  readonly assets = signal<MarketAsset[]>(seedAssets());
  readonly selectedAssetId = signal<AssetId>('BTCUSD');
  readonly candleIntervalSec = signal<CandleIntervalSec>(DEFAULT_CANDLE_INTERVAL_SEC);
  readonly marketStates = signal<Record<AssetId, AssetMarketState>>(seedStates());
  readonly candlesByInterval = signal<
    Record<AssetId, Record<CandleIntervalSec, Candle[]>>
  >(emptyCandles());
  readonly orderBooks = signal<Record<AssetId, OrderBookSnapshot>>(emptyBooks());
  readonly news = signal<NewsItem[]>([]);
  readonly timeAndSales = signal<TradeTapeItem[]>([]);
  readonly simRunning = signal(false);
  readonly lastTickAt = signal(Date.now());
  readonly tickCount = signal(0);

  readonly prices = computed(() => {
    const states = this.marketStates();
    return {
      BTCUSD: states.BTCUSD.price,
      ETHUSD: states.ETHUSD.price,
      COREAI: states.COREAI.price,
    } as Record<AssetId, number>;
  });

  readonly candles = computed(() => {
    const interval = this.candleIntervalSec();
    const all = this.candlesByInterval();
    return {
      BTCUSD: all.BTCUSD[interval],
      ETHUSD: all.ETHUSD[interval],
      COREAI: all.COREAI[interval],
    } as Record<AssetId, Candle[]>;
  });

  resetMarket(): void {
    this.assets.set(seedAssets());
    this.marketStates.set(seedStates());
    this.candlesByInterval.set(emptyCandles());
    this.orderBooks.set(emptyBooks());
    this.news.set([]);
    this.timeAndSales.set([]);
    this.tickCount.set(0);
    this.lastTickAt.set(Date.now());
    this.selectedAssetId.set('BTCUSD');
    this.candleIntervalSec.set(DEFAULT_CANDLE_INTERVAL_SEC);
  }

  setCandlesSnapshot(
    snap: Record<AssetId, Record<CandleIntervalSec, Candle[]>>,
  ): void {
    this.candlesByInterval.set(snap);
  }

  pushNews(item: NewsItem): void {
    this.news.update((list) => [item, ...list].slice(0, MAX_NEWS));
  }

  pushTape(item: TradeTapeItem): void {
    this.timeAndSales.update((list) => [item, ...list].slice(0, MAX_TAPE));
  }
}
