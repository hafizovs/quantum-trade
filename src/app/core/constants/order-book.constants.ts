import type { AssetId } from '../models/asset-id.model';

export const ORDER_BOOK_LEVELS = 12;
export const BASE_SPREAD_TICKS = 2;
export const LEVEL_STEP_TICKS = 2;
export const BASE_LEVEL_SIZE_BTC = 0.35;
export const BASE_LEVEL_SIZE_ETH = 4.2;
export const BASE_LEVEL_SIZE_CORE = 85;
export const LEVEL_SIZE_GROWTH = 1.08;
export const LEVEL_SIZE_NOISE = 0.15;

export const BASE_LEVEL_SIZES: Record<AssetId, number> = {
  BTCUSD: BASE_LEVEL_SIZE_BTC,
  ETHUSD: BASE_LEVEL_SIZE_ETH,
  COREAI: BASE_LEVEL_SIZE_CORE,
};
