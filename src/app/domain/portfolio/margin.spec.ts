import { describe, expect, it } from 'vitest';
import {
  liquidationPrice,
  requiredMargin,
  shouldLiquidate,
  unrealizedPnl,
} from './margin';

describe('margin / PnL', () => {
  it('computes long unrealized PnL', () => {
    expect(unrealizedPnl('long', 100, 110, 2)).toBe(20);
  });

  it('computes short unrealized PnL', () => {
    expect(unrealizedPnl('short', 100, 90, 2)).toBe(20);
  });

  it('computes required margin', () => {
    expect(requiredMargin(1000, 5)).toBe(200);
  });

  it('computes long liquidation price oracle', () => {
    expect(liquidationPrice('long', 100, 10, 0.005)).toBeCloseTo(90.5, 10);
  });

  it('computes short liquidation price oracle', () => {
    expect(liquidationPrice('short', 100, 10, 0.005)).toBeCloseTo(109.5, 10);
  });

  it('long liq rises toward entry as leverage increases', () => {
    const low = liquidationPrice('long', 100, 2, 0.005);
    const high = liquidationPrice('long', 100, 20, 0.005);
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThan(100);
  });

  it('short liq falls toward entry as leverage increases', () => {
    const lowLev = liquidationPrice('short', 100, 2, 0.005);
    const highLev = liquidationPrice('short', 100, 20, 0.005);
    expect(highLev).toBeLessThan(lowLev);
    expect(highLev).toBeGreaterThan(100);
  });

  it('L=1 long liq is E * m', () => {
    expect(liquidationPrice('long', 100, 1, 0.005)).toBeCloseTo(0.5, 10);
  });

  it('triggers long liquidation when mark <= liq', () => {
    const liq = liquidationPrice('long', 100, 10, 0.005);
    expect(shouldLiquidate('long', liq, liq)).toBe(true);
    expect(shouldLiquidate('long', liq - 0.01, liq)).toBe(true);
    expect(shouldLiquidate('long', liq + 1, liq)).toBe(false);
  });

  it('triggers short liquidation when mark >= liq', () => {
    const liq = liquidationPrice('short', 100, 10, 0.005);
    expect(shouldLiquidate('short', liq, liq)).toBe(true);
    expect(shouldLiquidate('short', liq + 0.01, liq)).toBe(true);
    expect(shouldLiquidate('short', liq - 1, liq)).toBe(false);
  });
});
