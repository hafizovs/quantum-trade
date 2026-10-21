import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { INITIAL_CASH_USD } from '../../core/constants/portfolio.constants';
import { TradingEngineService } from './trading-engine.service';
import { MarketMathService } from './market-math.service';
import { ToastService } from '../../core/toast.service';
import { MarketStore } from './market.store';
import { PortfolioStore } from '../portfolio/portfolio.store';
import { UiStore } from '../../core/ui/ui.store';

describe('TradingEngineService', () => {
  let engine: TradingEngineService;
  let portfolio: PortfolioStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TradingEngineService,
        MarketMathService,
        ToastService,
        MarketStore,
        PortfolioStore,
        UiStore,
      ],
    });
    engine = TestBed.inject(TradingEngineService);
    portfolio = TestBed.inject(PortfolioStore);
  });

  it('places market long: opens position and reduces cash', () => {
    const cashBefore = portfolio.cashUsd();
    const result = engine.placeOrder({
      assetId: 'BTCUSD',
      type: 'market',
      positionSide: 'long',
      notionalUsd: 1000,
      leverage: 5,
    });
    expect(result.ok).toBe(true);
    expect(portfolio.cashUsd()).toBeLessThan(cashBefore);
    expect(engine.positions().length).toBe(1);
    expect(engine.positions()[0].side).toBe('long');
    expect(engine.positions()[0].marginUsd).toBeCloseTo(cashBefore - portfolio.cashUsd(), 5);
  });

  it('marks unrealized pnl on tick', () => {
    engine.placeOrder({
      assetId: 'BTCUSD',
      type: 'market',
      positionSide: 'long',
      notionalUsd: 1000,
      leverage: 5,
    });
    const entry = engine.positions()[0].entryPrice;
    engine.onTick(Date.now());
    const pos = engine.positions()[0];
    expect(pos).toBeTruthy();
    const mark = engine.prices().BTCUSD;
    const expected = (mark - entry) * pos.qty;
    expect(pos.unrealizedPnl).toBeCloseTo(expected, 6);
  });

  it('liquidates long when mark breaches liq price', () => {
    const result = engine.placeOrder({
      assetId: 'BTCUSD',
      type: 'market',
      positionSide: 'long',
      notionalUsd: 5000,
      leverage: 20,
    });
    expect(result.ok).toBe(true);
    const pos = engine.positions()[0];
    const liq = pos.liquidationPrice;

    // Force mark to liquidation by directly mutating market state then checking
    const market = TestBed.inject(MarketStore);
    market.marketStates.update((s) => ({
      ...s,
      BTCUSD: { ...s.BTCUSD, price: liq },
    }));

    // Use private path via onTick after setting price below liq via repeated adverse ticks
    // Force check by calling place and then manually invoking liquidation via close path:
    // Simulate by setting price and calling onTick enough — instead force via portfolio mark:
    const forcedMark = liq - 1;
    market.marketStates.update((s) => ({
      ...s,
      BTCUSD: { ...s.BTCUSD, price: forcedMark },
    }));

    // Re-run liquidation check by placing a no-op tick cycle: call onTick which marks and liquidates
    // But onTick will overwrite price with GBM. So call close path by temporarily monkey-patching:
    // Direct approach: use engine['checkLiquidations'] via bracket
    (engine as unknown as {
      checkLiquidations: (a: string, m: number, n: number) => void;
      markPositions: (a: string, m: number) => void;
    }).markPositions('BTCUSD', forcedMark);
    (engine as unknown as {
      checkLiquidations: (a: string, m: number, n: number) => void;
    }).checkLiquidations('BTCUSD', forcedMark, Date.now());

    expect(engine.positions().length).toBe(0);
    const closed = portfolio.positions().find((p) => p.id === pos.id);
    expect(closed?.status).toBe('liquidated');
  });

  it('reset restores initial cash and clears positions', () => {
    engine.placeOrder({
      assetId: 'ETHUSD',
      type: 'market',
      positionSide: 'short',
      notionalUsd: 500,
      leverage: 3,
    });
    expect(engine.positions().length).toBe(1);
    engine.resetSimulation();
    expect(portfolio.cashUsd()).toBe(INITIAL_CASH_USD);
    expect(engine.positions().length).toBe(0);
    expect(engine.openOrders().length).toBe(0);
  });
});
