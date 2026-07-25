import { describe, expect, it } from 'vitest';
import { gbmStep } from './gbm';

describe('gbmStep', () => {
  it('returns positive price for typical inputs', () => {
    const next = gbmStep(100, 0.000002, 0.002, 1, 0.5);
    expect(next).toBeGreaterThan(0);
  });

  it('matches oracle when z=0, mu=0, sigma=0.002, S=100', () => {
    const next = gbmStep(100, 0, 0.002, 1, 0);
    const expected = 100 * Math.exp(-0.5 * 0.002 * 0.002);
    expect(next).toBeCloseTo(expected, 10);
    expect(next).toBeCloseTo(99.9998, 4);
  });

  it('increases with positive z when mu=0', () => {
    const up = gbmStep(100, 0, 0.002, 1, 1);
    const down = gbmStep(100, 0, 0.002, 1, -1);
    expect(up).toBeGreaterThan(100);
    expect(down).toBeLessThan(100);
    expect(up).toBeGreaterThan(down);
  });

  it('never returns NaN or Infinity for finite inputs', () => {
    const next = gbmStep(67500, 0.000002, 0.0018, 1, -2.5);
    expect(Number.isFinite(next)).toBe(true);
    expect(next).toBeGreaterThan(0);
  });
});
