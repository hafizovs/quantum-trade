import { describe, expect, it } from 'vitest';
import { CandleAggregator, bucketStart } from './candle-aggregator';
import type { PriceTick } from '../../models/trading.types';

describe('candle-aggregator', () => {
  it('computes aligned bucket start', () => {
    expect(bucketStart(10_002, 5)).toBe(10_000);
    expect(bucketStart(14_999, 5)).toBe(10_000);
    expect(bucketStart(15_000, 5)).toBe(15_000);
  });

  it('updates OHLC inside the same bucket', () => {
    const agg = new CandleAggregator();
    const t0 = 1_000_000;
    const ticks: PriceTick[] = [
      { assetId: 'BTCUSD', time: t0, price: 100, volume: 1 },
      { assetId: 'BTCUSD', time: t0 + 1000, price: 110, volume: 2 },
      { assetId: 'BTCUSD', time: t0 + 2000, price: 95, volume: 3 },
      { assetId: 'BTCUSD', time: t0 + 3000, price: 105, volume: 4 },
    ];
    for (const tick of ticks) {
      agg.onTick(tick);
    }
    const candles = agg.getCandles('BTCUSD', 5);
    expect(candles.length).toBe(1);
    const c = candles[0];
    expect(c.open).toBe(100);
    expect(c.high).toBe(110);
    expect(c.low).toBe(95);
    expect(c.close).toBe(105);
    expect(c.volume).toBe(10);
    expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
    expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
  });

  it('opens a new bucket on interval boundary', () => {
    const agg = new CandleAggregator();
    const t0 = 0;
    agg.onTick({ assetId: 'ETHUSD', time: t0, price: 10, volume: 1 });
    agg.onTick({ assetId: 'ETHUSD', time: t0 + 5000, price: 12, volume: 2 });
    const candles = agg.getCandles('ETHUSD', 5);
    expect(candles.length).toBe(2);
    expect(candles[0].close).toBe(10);
    expect(candles[1].open).toBe(12);
    expect(candles[1].volume).toBe(2);
  });

  it('maintains both 5s and 15s buffers', () => {
    const agg = new CandleAggregator();
    for (let i = 0; i < 15; i++) {
      agg.onTick({
        assetId: 'COREAI',
        time: i * 1000,
        price: 100 + i,
        volume: 1,
      });
    }
    expect(agg.getCandles('COREAI', 5).length).toBe(3);
    expect(agg.getCandles('COREAI', 15).length).toBe(1);
    const c15 = agg.getCandles('COREAI', 15)[0];
    expect(c15.open).toBe(100);
    expect(c15.close).toBe(114);
    expect(c15.volume).toBe(15);
  });
});
