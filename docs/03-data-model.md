# 03 — Data Model & Units

Все интерфейсы ниже реализуй **буквально**. Числовые диапазоны и дефолты — в [appendix-a-defaults.md](appendix-a-defaults.md); скопируй значения в `*.constants.ts` без «примерно».

Канонический файл агрегата типов: `src/app/models/trading.types.ts` (обязан существовать и экспортировать публичные торговые типы).

---

## 3.1 Единицы

| Величина | Единица | Пояснение |
|----------|---------|-----------|
| Price | USD quote | `number`, > 0; display precision per asset (Appendix A) |
| Size / qty | base asset units | BTC/ETH/COREAI amount |
| Notional | USD | `qty * price` |
| Cash / balance | USD | ≥ 0 после операций (кроме временных rounding eps) |
| Leverage | multiplier | integer 1…20 |
| Margin | USD | изолированная маржа позиции |
| PnL | USD | realized / unrealized |
| Drift μ | per-year or per-tick rate | см. Appendix B (канон: per-second μ в тиковой формуле) |
| Volatility σ | per-second | см. Appendix B |
| Time | ms epoch (`Date.now`) + sim tick index | |
| Candle interval | seconds | `5` \| `15` |
| Depth size | base qty at price level | |

---

## 3.2 Идентификаторы и enum/union типы

```ts
export type AssetId = 'BTCUSD' | 'ETHUSD' | 'COREAI';

export type OrderType = 'market' | 'limit';

export type OrderSide = 'buy' | 'sell';

/** Направление позиции / намерение открытия */
export type PositionSide = 'long' | 'short';

export type OrderStatus =
  | 'open'
  | 'filled'
  | 'partiallyFilled'
  | 'cancelled'
  | 'rejected';

export type PositionStatus = 'open' | 'closed' | 'liquidated';

export type CandleIntervalSec = 5 | 15;

export type NewsSentiment = 'bullish' | 'bearish' | 'neutral';

export type ToastKind = 'info' | 'success' | 'warning' | 'danger';

export type BalanceLedgerKind =
  | 'depositSeed'
  | 'openPositionMargin'
  | 'closePositionPnl'
  | 'liquidation'
  | 'fee'
  | 'reset';
```

---

## 3.3 MarketAsset

```ts
export interface MarketAsset {
  id: AssetId;
  symbol: string;          // 'BTC/USD', 'ETH/USD', 'CORE-AI'
  base: string;            // 'BTC' | 'ETH' | 'CORE'
  quote: string;           // 'USD'
  pricePrecision: number;  // decimals for display
  qtyPrecision: number;
  tickSize: number;        // min price increment for book/limits
  lotSize: number;         // min qty increment
  basePrice: number;       // seed mid
  drift: number;           // current μ (mutable in runtime state)
  volatility: number;      // current σ
  baseDrift: number;       // mean-revert target after shock decay
  baseVolatility: number;
}
```

Runtime цена **не** обязана жить только внутри `MarketAsset` — допустим отдельный `prices: Record<AssetId, number>` + params map. Но тип актива из брифа обязан существовать.

---

## 3.4 Candle

```ts
export interface Candle {
  assetId: AssetId;
  intervalSec: CandleIntervalSec;
  openTime: number;   // ms, aligned bucket start
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;     // sum of traded qty in bucket (synthetic + user fills)
}
```

---

## 3.5 Tick (внутренний)

```ts
export interface PriceTick {
  assetId: AssetId;
  time: number;
  price: number;
  volume: number;     // synthetic tick volume > 0
}
```

Тики можно не хранить бесконечно: ring buffer `MAX_TICK_HISTORY` (Appendix A); свечи — отдельный буфер `MAX_CANDLES`.

---

## 3.6 OrderBookItem & snapshot

```ts
export interface OrderBookItem {
  price: number;
  size: number;           // qty at level
  cumulativeSize: number; // running sum from best toward worse
  side: 'bid' | 'ask';
}

export interface OrderBookSnapshot {
  assetId: AssetId;
  bids: OrderBookItem[];  // sorted price DESC (best bid first)
  asks: OrderBookItem[];  // sorted price ASC (best ask first)
  mid: number;
  spread: number;
  updatedAt: number;
}
```

---

## 3.7 Order

```ts
export interface Order {
  id: string;
  assetId: AssetId;
  type: OrderType;
  side: OrderSide;                 // buy → long intent; sell → short intent
  positionSide: PositionSide;      // explicit long/short
  status: OrderStatus;
  qty: number;                     // base qty
  notionalUsd: number;             // requested USD size at submit
  limitPrice: number | null;       // null for market
  leverage: number;                // 1..20
  filledQty: number;
  avgFillPrice: number | null;
  createdAt: number;
  updatedAt: number;
  filledAt: number | null;
}
```

```ts
export interface PlaceOrderInput {
  assetId: AssetId;
  type: OrderType;
  positionSide: PositionSide;      // long | short
  notionalUsd: number;             // user enters USD
  limitPrice?: number | null;
  leverage: number;
}
```

Маппинг UI кнопок:
- **BUY / LONG** → `positionSide: 'long'`, `side: 'buy'`
- **SELL / SHORT** → `positionSide: 'short'`, `side: 'sell'`

---

## 3.8 Position

```ts
export interface Position {
  id: string;
  assetId: AssetId;
  side: PositionSide;
  qty: number;                 // base size > 0
  entryPrice: number;
  leverage: number;
  marginUsd: number;           // locked margin
  liquidationPrice: number;
  unrealizedPnl: number;       // marked each tick
  realizedPnl: number;         // 0 while open
  status: PositionStatus;
  openedAt: number;
  closedAt: number | null;
  orderId: string | null;      // originating order
}
```

Канон: **одна агрегированная позиция на (assetId, side)** — при доливе в ту же сторону усредняй entry и пересчитывай margin/liq (см. 04 / Appendix B). Противоположная сторона — отдельная позиция; хедж допускается (long и short одновременно на одном активе).

---

## 3.9 NewsItem

```ts
export interface NewsItem {
  id: string;
  time: number;
  headlineRu: string;
  headlineEn: string;
  sentiment: NewsSentiment;
  assetId: AssetId | 'ALL';
  driftDelta: number;          // added to μ
  volatilityDelta: number;     // added to σ (usually ≥ 0)
  durationMs: number;          // shock lifetime before mean-revert toward base
}
```

В UI показывай headline по текущей locale.

---

## 3.10 Time & Sales / tape

```ts
export interface TradeTapeItem {
  id: string;
  assetId: AssetId;
  time: number;
  price: number;
  qty: number;
  side: 'buy' | 'sell';       // aggressor side (synthetic or user)
  isUser: boolean;
}
```

---

## 3.11 Portfolio / ledger / toast

```ts
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
  messageKey: string;          // i18n key
  params?: Record<string, string | number>;
  createdAt: number;
  ttlMs: number;
}

export interface PlaceOrderResult {
  ok: boolean;
  orderId?: string;
  positionId?: string;
  reasonKey?: string;          // i18n error key if !ok
}
```

---

## 3.12 Chart view state (UI)

```ts
export interface ChartViewState {
  offsetCandles: number;   // pan: how many candles scrolled back from tip
  candlesVisible: number;  // zoom: viewport width in candles
}
```

Храни в chart component signals или `UiStore` — **канон:** локальные signals в `TradingChartComponent`, чтобы не загрязнять market store UI-жестами.

---

## 3.13 Runtime market params (per asset)

```ts
export interface AssetMarketState {
  assetId: AssetId;
  price: number;
  drift: number;
  volatility: number;
  shockEndsAt: number | null;
  lastTickAt: number;
}
```

---

## 3.14 Инварианты

1. `price > 0` всегда; GBM шаг не даёт `≤ 0` (clamp `MIN_PRICE`).
2. `leverage ∈ [1, 20]`, integer.
3. `bids[0].price < asks[0].price` (положительный spread); если синтетика сломалась — почини перед publish snapshot.
4. `position.qty > 0` для `status === 'open'`.
5. `cashUsd >= 0` после успешного `placeOrder`; reject если маржи не хватает.
6. `filledQty <= qty` для ордеров.
7. Candle: `low <= min(open, close)` и `high >= max(open, close)`.

---

## 3.15 Id factory

```ts
createId(prefix: 'ord' | 'pos' | 'news' | 'trd' | 'led' | 'toast'): string
```

Реализация: `prefix_${Date.now().toString(36)}_${random}` или инкремент + seed — главное уникальность в сессии.
