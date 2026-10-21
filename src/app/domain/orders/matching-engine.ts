import type { Order, OrderBookSnapshot, PositionSide } from '../../core/models/trading.types';

export interface MarketFillQuote {
  fillPrice: number;
  ok: boolean;
}

export function marketFillPrice(
  positionSide: PositionSide,
  book: OrderBookSnapshot | null,
  fallbackMid: number,
): MarketFillQuote {
  if (!book || book.asks.length === 0 || book.bids.length === 0) {
    return { fillPrice: fallbackMid, ok: true };
  }
  if (positionSide === 'long') {
    return { fillPrice: book.asks[0].price, ok: true };
  }
  return { fillPrice: book.bids[0].price, ok: true };
}

export function isLimitMarketable(
  positionSide: PositionSide,
  limitPrice: number,
  book: OrderBookSnapshot | null,
): boolean {
  if (!book || book.asks.length === 0 || book.bids.length === 0) {
    return false;
  }
  if (positionSide === 'long') {
    return limitPrice >= book.asks[0].price;
  }
  return limitPrice <= book.bids[0].price;
}

export function marketableLimitFillPrice(
  positionSide: PositionSide,
  book: OrderBookSnapshot,
): number {
  if (positionSide === 'long') {
    return book.asks[0].price;
  }
  return book.bids[0].price;
}

/** Buy/Long limit fills when marketPrice <= limitPrice. Sell/Short when marketPrice >= limitPrice. */
export function shouldTriggerLimit(
  positionSide: PositionSide,
  marketPrice: number,
  limitPrice: number,
): boolean {
  if (positionSide === 'long') {
    return marketPrice <= limitPrice;
  }
  return marketPrice >= limitPrice;
}

export function remainingQty(order: Order): number {
  return Math.max(0, order.qty - order.filledQty);
}

export function cancelOpenOrder(order: Order, now: number): Order {
  if (order.status !== 'open') {
    return order;
  }
  return {
    ...order,
    status: 'cancelled',
    updatedAt: now,
  };
}
