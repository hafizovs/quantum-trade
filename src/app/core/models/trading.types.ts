import type { AssetId } from './asset-id.model';
import type { CandleIntervalSec } from './candle-interval.model';
import type { OrderSide } from './order-side.model';
import type { OrderType } from './order-type.model';
import type { PositionSide } from './position-side.model';

export type { AssetId } from './asset-id.model';
export type { CandleIntervalSec } from './candle-interval.model';
export type { OrderSide } from './order-side.model';
export type { OrderType } from './order-type.model';
export type { PositionSide } from './position-side.model';
export type { ThemeId } from './theme.model';
export type { LocaleId } from './locale.model';

export type OrderStatus =
  | 'open'
  | 'filled'
  | 'partiallyFilled'
  | 'cancelled'
  | 'rejected';

export type PositionStatus = 'open' | 'closed' | 'liquidated';

export type NewsSentiment = 'bullish' | 'bearish' | 'neutral';

export type ToastKind = 'info' | 'success' | 'warning' | 'danger';

export type BalanceLedgerKind =
  | 'depositSeed'
  | 'openPositionMargin'
  | 'closePositionPnl'
  | 'liquidation'
  | 'fee'
  | 'reset';

export interface MarketAsset {
  id: AssetId;
  symbol: string;
  base: string;
  quote: string;
  pricePrecision: number;
  qtyPrecision: number;
  tickSize: number;
  lotSize: number;
  basePrice: number;
  drift: number;
  volatility: number;
  baseDrift: number;
  baseVolatility: number;
}

export interface Candle {
  assetId: AssetId;
  intervalSec: CandleIntervalSec;
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceTick {
  assetId: AssetId;
  time: number;
  price: number;
  volume: number;
}

export interface OrderBookItem {
  price: number;
  size: number;
  cumulativeSize: number;
  side: 'bid' | 'ask';
}

export interface OrderBookSnapshot {
  assetId: AssetId;
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  mid: number;
  spread: number;
  updatedAt: number;
}

export interface Order {
  id: string;
  assetId: AssetId;
  type: OrderType;
  side: OrderSide;
  positionSide: PositionSide;
  status: OrderStatus;
  qty: number;
  notionalUsd: number;
  limitPrice: number | null;
  leverage: number;
  filledQty: number;
  avgFillPrice: number | null;
  createdAt: number;
  updatedAt: number;
  filledAt: number | null;
}

export interface PlaceOrderInput {
  assetId: AssetId;
  type: OrderType;
  positionSide: PositionSide;
  notionalUsd: number;
  limitPrice?: number | null;
  leverage: number;
}

export interface Position {
  id: string;
  assetId: AssetId;
  side: PositionSide;
  qty: number;
  entryPrice: number;
  leverage: number;
  marginUsd: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  status: PositionStatus;
  openedAt: number;
  closedAt: number | null;
  orderId: string | null;
}

export interface NewsItem {
  id: string;
  time: number;
  headlineRu: string;
  headlineEn: string;
  sentiment: NewsSentiment;
  assetId: AssetId | 'ALL';
  driftDelta: number;
  volatilityDelta: number;
  durationMs: number;
}

export interface TradeTapeItem {
  id: string;
  assetId: AssetId;
  time: number;
  price: number;
  qty: number;
  side: 'buy' | 'sell';
  isUser: boolean;
}

export interface BalanceLedgerEntry {
  id: string;
  time: number;
  kind: BalanceLedgerKind;
  deltaUsd: number;
  balanceAfter: number;
  noteRu: string;
  noteEn: string;
  relatedPositionId?: string;
  relatedOrderId?: string;
}

export interface ToastItem {
  id: string;
  kind: ToastKind;
  messageKey: string;
  params?: Record<string, string | number>;
  createdAt: number;
  ttlMs: number;
}

export interface PlaceOrderResult {
  ok: boolean;
  orderId?: string;
  positionId?: string;
  reasonKey?: string;
}

export interface ChartViewState {
  offsetCandles: number;
  candlesVisible: number;
}

export interface AssetMarketState {
  assetId: AssetId;
  price: number;
  drift: number;
  volatility: number;
  shockEndsAt: number | null;
  lastTickAt: number;
}

export interface UserLimitOverlay {
  price: number;
  qty: number;
  side: 'bid' | 'ask';
}
