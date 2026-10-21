import {
  MAX_VOLATILITY,
  MIN_VOLATILITY,
} from '../../core/constants/market.constants';
import {
  NEWS_POOL,
  type NewsTemplate,
} from '../../core/constants/news.constants';
import type { AssetId } from '../../core/models/asset-id.model';
import type { AssetMarketState, NewsItem } from '../../core/models/trading.types';
import { clamp } from '../math/clamp';
import { createId } from '../math/id-factory';
import type { RandomSource } from '../math/rng';
import { uniform } from '../math/rng';

export function pickNewsTemplate(rng: RandomSource): NewsTemplate {
  const idx = Math.floor(rng.next() * NEWS_POOL.length) % NEWS_POOL.length;
  return NEWS_POOL[idx];
}

export function createNewsItem(template: NewsTemplate, now: number): NewsItem {
  return {
    id: createId('news'),
    time: now,
    headlineRu: template.headlineRu,
    headlineEn: template.headlineEn,
    sentiment: template.sentiment,
    assetId: template.assetId,
    driftDelta: template.driftDelta,
    volatilityDelta: template.volatilityDelta,
    durationMs: template.durationMs,
  };
}

export function applyNewsShock(
  news: NewsItem,
  states: Record<AssetId, AssetMarketState>,
  now: number,
): AssetId[] {
  const targets: AssetId[] =
    news.assetId === 'ALL'
      ? (Object.keys(states) as AssetId[])
      : [news.assetId];

  for (const id of targets) {
    const state = states[id];
    state.drift += news.driftDelta;
    state.volatility = clamp(
      state.volatility + news.volatilityDelta,
      MIN_VOLATILITY,
      MAX_VOLATILITY,
    );
    state.shockEndsAt = now + news.durationMs;
  }
  return targets;
}

/**
 * Instant snap to baseDrift/baseVolatility when shockEndsAt is reached.
 */
export function expireShocks(
  states: Record<AssetId, AssetMarketState>,
  baseDrift: Record<AssetId, number>,
  baseVol: Record<AssetId, number>,
  now: number,
): AssetId[] {
  const expired: AssetId[] = [];
  for (const id of Object.keys(states) as AssetId[]) {
    const state = states[id];
    if (state.shockEndsAt !== null && now >= state.shockEndsAt) {
      state.drift = baseDrift[id];
      state.volatility = baseVol[id];
      state.shockEndsAt = null;
      expired.push(id);
    }
  }
  return expired;
}

export function scheduleNextShock(
  now: number,
  rng: RandomSource,
  minMs: number,
  maxMs: number,
): number {
  return now + uniform(rng, minMs, maxMs);
}
