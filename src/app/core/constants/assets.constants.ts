import type { AssetId } from '../models/asset-id.model';
import type { MarketAsset } from '../../models/trading.types';

export const ASSET_SEEDS: readonly MarketAsset[] = [
  {
    id: 'BTCUSD',
    symbol: 'BTC/USD',
    base: 'BTC',
    quote: 'USD',
    pricePrecision: 2,
    qtyPrecision: 6,
    tickSize: 0.5,
    lotSize: 0.000001,
    basePrice: 67500,
    drift: 0.000002,
    volatility: 0.0018,
    baseDrift: 0.000002,
    baseVolatility: 0.0018,
  },
  {
    id: 'ETHUSD',
    symbol: 'ETH/USD',
    base: 'ETH',
    quote: 'USD',
    pricePrecision: 2,
    qtyPrecision: 5,
    tickSize: 0.05,
    lotSize: 0.00001,
    basePrice: 3450,
    drift: 0.0000025,
    volatility: 0.0022,
    baseDrift: 0.0000025,
    baseVolatility: 0.0022,
  },
  {
    id: 'COREAI',
    symbol: 'CORE-AI',
    base: 'CORE',
    quote: 'USD',
    pricePrecision: 2,
    qtyPrecision: 4,
    tickSize: 0.01,
    lotSize: 0.0001,
    basePrice: 128.5,
    drift: 0.000004,
    volatility: 0.0035,
    baseDrift: 0.000004,
    baseVolatility: 0.0035,
  },
];

export const ASSET_IDS: readonly AssetId[] = ['BTCUSD', 'ETHUSD', 'COREAI'];

export const TICK_VOLUME_RANGES: Record<AssetId, { min: number; max: number }> = {
  BTCUSD: { min: 0.01, max: 0.8 },
  ETHUSD: { min: 0.2, max: 12 },
  COREAI: { min: 5, max: 220 },
};

export function getAssetSeed(id: AssetId): MarketAsset {
  const found = ASSET_SEEDS.find((a) => a.id === id);
  if (!found) {
    throw new Error(`Unknown asset: ${id}`);
  }
  return { ...found };
}
