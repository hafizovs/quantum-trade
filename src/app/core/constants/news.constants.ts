import type { AssetId } from '../models/asset-id.model';
import type { NewsSentiment } from '../../models/trading.types';

export const NEWS_MIN_MS = 30000;
export const NEWS_MAX_MS = 45000;
export const DEFAULT_SHOCK_DURATION_MS = 20000;
export const BULLISH_DRIFT_DELTA = 0.00035;
export const BEARISH_DRIFT_DELTA = -0.00035;
export const SHOCK_VOL_DELTA = 0.0012;

export interface NewsTemplate {
  id: string;
  sentiment: NewsSentiment;
  assetId: AssetId | 'ALL';
  headlineRu: string;
  headlineEn: string;
  driftDelta: number;
  volatilityDelta: number;
  durationMs: number;
}

export const NEWS_POOL: readonly NewsTemplate[] = [
  {
    id: 'n1',
    sentiment: 'bullish',
    assetId: 'COREAI',
    headlineRu: 'Регулятор одобрил AI-протокол',
    headlineEn: 'Regulator approved AI protocol',
    driftDelta: 0.00045,
    volatilityDelta: 0.0015,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
  {
    id: 'n2',
    sentiment: 'bearish',
    assetId: 'ALL',
    headlineRu: 'Крупный взлом моста',
    headlineEn: 'Major bridge exploit',
    driftDelta: -0.0004,
    volatilityDelta: 0.0018,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
  {
    id: 'n3',
    sentiment: 'bullish',
    assetId: 'BTCUSD',
    headlineRu: 'ETF зафиксировал приток капитала',
    headlineEn: 'ETF recorded capital inflows',
    driftDelta: 0.0003,
    volatilityDelta: 0.001,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
  {
    id: 'n4',
    sentiment: 'bearish',
    assetId: 'BTCUSD',
    headlineRu: 'Киты начали разгрузку на споте',
    headlineEn: 'Whales dumping on spot',
    driftDelta: -0.00032,
    volatilityDelta: 0.0012,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
  {
    id: 'n5',
    sentiment: 'bullish',
    assetId: 'ETHUSD',
    headlineRu: 'Успешный апгрейд сети',
    headlineEn: 'Successful network upgrade',
    driftDelta: 0.00034,
    volatilityDelta: 0.0011,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
  {
    id: 'n6',
    sentiment: 'bearish',
    assetId: 'ETHUSD',
    headlineRu: 'Газ вырос до экстремума',
    headlineEn: 'Gas fees spiked to extremes',
    driftDelta: -0.00028,
    volatilityDelta: 0.001,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
  {
    id: 'n7',
    sentiment: 'bullish',
    assetId: 'ALL',
    headlineRu: 'ФРС сигнализирует мягкую политику',
    headlineEn: 'Fed signals dovish policy',
    driftDelta: 0.00025,
    volatilityDelta: 0.0009,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
  {
    id: 'n8',
    sentiment: 'bearish',
    assetId: 'COREAI',
    headlineRu: 'Утечка модели CORE-AI',
    headlineEn: 'CORE-AI model leak reported',
    driftDelta: -0.0005,
    volatilityDelta: 0.002,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
  {
    id: 'n9',
    sentiment: 'neutral',
    assetId: 'ALL',
    headlineRu: 'Волатильность ожидается повышенной',
    headlineEn: 'Elevated volatility expected',
    driftDelta: 0,
    volatilityDelta: 0.0016,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
  {
    id: 'n10',
    sentiment: 'bullish',
    assetId: 'ALL',
    headlineRu: 'Институционалы увеличили экспозицию',
    headlineEn: 'Institutions increased exposure',
    driftDelta: 0.00022,
    volatilityDelta: 0.0008,
    durationMs: DEFAULT_SHOCK_DURATION_MS,
  },
];
