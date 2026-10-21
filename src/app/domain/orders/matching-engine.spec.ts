import { describe, expect, it } from 'vitest';
import type { Order, OrderBookSnapshot } from '../../core/models/trading.types';
import {
  cancelOpenOrder,
  isLimitMarketable,
  marketFillPrice,
  shouldTriggerLimit,
} from './matching-engine';

function book(mid: number, bid: number, ask: number): OrderBookSnapshot {
  return {
    assetId: 'BTCUSD',
    mid,
    spread: ask - bid,
    updatedAt: 0,
    bids: [{ price: bid, size: 1, cumulativeSize: 1, side: 'bid' }],
    asks: [{ price: ask, size: 1, cumulativeSize: 1, side: 'ask' }],
  };
}

describe('matching-engine', () => {
  it('fills market long at best ask', () => {
    const b = book(100, 99.5, 100.5);
    expect(marketFillPrice('long', b, 100).fillPrice).toBe(100.5);
  });

  it('fills market short at best bid', () => {
    const b = book(100, 99.5, 100.5);
    expect(marketFillPrice('short', b, 100).fillPrice).toBe(99.5);
  });

  it('triggers buy limit when price <= limit', () => {
    expect(shouldTriggerLimit('long', 99, 100)).toBe(true);
    expect(shouldTriggerLimit('long', 100, 100)).toBe(true);
    expect(shouldTriggerLimit('long', 101, 100)).toBe(false);
  });

  it('triggers sell limit when price >= limit', () => {
    expect(shouldTriggerLimit('short', 101, 100)).toBe(true);
    expect(shouldTriggerLimit('short', 100, 100)).toBe(true);
    expect(shouldTriggerLimit('short', 99, 100)).toBe(false);
  });

  it('detects marketable long limit', () => {
    const b = book(100, 99.5, 100.5);
    expect(isLimitMarketable('long', 100.5, b)).toBe(true);
    expect(isLimitMarketable('long', 100.4, b)).toBe(false);
  });

  it('cancels only open orders', () => {
    const open: Order = {
      id: 'ord_1',
      assetId: 'BTCUSD',
      type: 'limit',
      side: 'buy',
      positionSide: 'long',
      status: 'open',
      qty: 1,
      notionalUsd: 100,
      limitPrice: 90,
      leverage: 5,
      filledQty: 0,
      avgFillPrice: null,
      createdAt: 1,
      updatedAt: 1,
      filledAt: null,
    };
    const cancelled = cancelOpenOrder(open, 2);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.updatedAt).toBe(2);

    const filled = { ...open, status: 'filled' as const };
    expect(cancelOpenOrder(filled, 3).status).toBe('filled');
  });
});
