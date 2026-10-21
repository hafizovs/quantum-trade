import {
  BASE_LEVEL_SIZES,
  BASE_SPREAD_TICKS,
  LEVEL_SIZE_GROWTH,
  LEVEL_SIZE_NOISE,
  LEVEL_STEP_TICKS,
  ORDER_BOOK_LEVELS,
} from '../../core/constants/order-book.constants';
import type { AssetId } from '../../core/models/asset-id.model';
import type {
  OrderBookItem,
  OrderBookSnapshot,
  UserLimitOverlay,
} from '../../core/models/trading.types';
import { roundToTick } from './gbm';
import type { RandomSource } from '../math/rng';
import { uniform } from '../math/rng';

export interface BuildOrderBookParams {
  assetId: AssetId;
  mid: number;
  tickSize: number;
  now: number;
  rng: RandomSource;
  userLimits?: UserLimitOverlay[];
  levels?: number;
}

export function buildOrderBook(params: BuildOrderBookParams): OrderBookSnapshot {
  const {
    assetId,
    mid,
    tickSize,
    now,
    rng,
    userLimits = [],
    levels = ORDER_BOOK_LEVELS,
  } = params;

  const halfSpread = (BASE_SPREAD_TICKS * tickSize) / 2;
  let bestBid = roundToTick(mid - halfSpread, tickSize);
  let bestAsk = roundToTick(mid + halfSpread, tickSize);
  if (bestBid >= bestAsk) {
    bestAsk = bestBid + tickSize;
  }

  const baseSize = BASE_LEVEL_SIZES[assetId];
  const bids: OrderBookItem[] = [];
  const asks: OrderBookItem[] = [];

  for (let i = 0; i < levels; i++) {
    const bidPrice = roundToTick(
      bestBid - i * LEVEL_STEP_TICKS * tickSize,
      tickSize,
    );
    const askPrice = roundToTick(
      bestAsk + i * LEVEL_STEP_TICKS * tickSize,
      tickSize,
    );
    const noise = uniform(rng, -LEVEL_SIZE_NOISE, LEVEL_SIZE_NOISE);
    const size = Math.max(
      0.000001,
      baseSize * Math.pow(LEVEL_SIZE_GROWTH, i) * (1 + noise),
    );
    bids.push({
      price: bidPrice,
      size,
      cumulativeSize: 0,
      side: 'bid',
    });
    asks.push({
      price: askPrice,
      size,
      cumulativeSize: 0,
      side: 'ask',
    });
  }

  mergeUserLimits(bids, asks, userLimits, tickSize);
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);
  assignCumulative(bids);
  assignCumulative(asks);

  const topBid = bids[0]?.price ?? bestBid;
  const topAsk = asks[0]?.price ?? bestAsk;
  const spread = Math.max(0, topAsk - topBid);

  return {
    assetId,
    bids,
    asks,
    mid,
    spread,
    updatedAt: now,
  };
}

function mergeUserLimits(
  bids: OrderBookItem[],
  asks: OrderBookItem[],
  userLimits: UserLimitOverlay[],
  tickSize: number,
): void {
  for (const lim of userLimits) {
    const price = roundToTick(lim.price, tickSize);
    const list = lim.side === 'bid' ? bids : asks;
    const existing = list.find((l) => Math.abs(l.price - price) < tickSize * 0.25);
    if (existing) {
      existing.size += lim.qty;
    } else {
      list.push({
        price,
        size: lim.qty,
        cumulativeSize: 0,
        side: lim.side,
      });
    }
  }
}

function assignCumulative(levels: OrderBookItem[]): void {
  let cum = 0;
  for (const level of levels) {
    cum += level.size;
    level.cumulativeSize = cum;
  }
}
