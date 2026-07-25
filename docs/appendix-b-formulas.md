# Appendix B — Formulas & Algorithms

Справочник формул. Реализации — в `domain/market/**`, `domain/orders/**`, `domain/portfolio/**` согласно [04-trading-engine.md](04-trading-engine.md).

---

## B.1 Обозначения

| Symbol | Meaning |
|--------|---------|
| \(S\) | spot / mid / last price |
| \(\mu\) | drift (per second) |
| \(\sigma\) | volatility (per second) |
| \(\Delta t\) | tick length in seconds (`TICK_DT_SEC = 1`) |
| \(Z\) | standard normal sample |
| \(q\) | position quantity (base units, > 0) |
| \(E\) | entry price |
| \(M\) | mark / last price |
| \(L\) | leverage (1…20) |
| \(m\) | maintenance margin rate (`MAINTENANCE_MARGIN_RATE`) |
| \(N\) | notional USD |
| \(B\) | cash USD balance |

---

## B.2 Geometric Brownian Motion step

\[
S_{t+\Delta t} = S_t \cdot \exp\left(\left(\mu - \frac{1}{2}\sigma^2\right)\Delta t + \sigma\sqrt{\Delta t}\, Z\right)
\]

TypeScript-канон:

```ts
export function gbmStep(
  price: number,
  mu: number,
  sigma: number,
  dt: number,
  z: number,
): number {
  const driftTerm = (mu - 0.5 * sigma * sigma) * dt;
  const diffusionTerm = sigma * Math.sqrt(dt) * z;
  return price * Math.exp(driftTerm + diffusionTerm);
}
```

Пост-обработка в engine/math service:

```ts
next = gbmStep(price, mu, sigma, dt, z)
next = Math.max(next, MIN_PRICE)
next = roundToTick(next, tickSize)
```

### Sample \(Z \sim \mathcal{N}(0,1)\)

Box-Muller:

```ts
export function sampleNormal(next: () => number): number {
  // next() → Uniform(0,1)
  let u = 0;
  let v = 0;
  while (u === 0) u = next();
  while (v === 0) v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
```

---

## B.3 Round helpers

```ts
roundToTick(price, tickSize) = Math.round(price / tickSize) * tickSize

floorToLot(qty, lotSize) = Math.floor(qty / lotSize + 1e-12) * lotSize

qtyFromNotional(notionalUsd, price, lotSize) =
  floorToLot(notionalUsd / price, lotSize)
```

---

## B.4 Margin & notional

\[
N = q \cdot P_{\mathrm{ref}}
\]

\[
\mathrm{margin} = \frac{N}{L}
\]

```ts
requiredMargin(notionalUsd, leverage) = notionalUsd / leverage

positionNotional(qty, price) = qty * price

positionMargin(qty, entry, leverage) = (qty * entry) / leverage
```

Fee (если `TAKER_FEE_BPS > 0`):

\[
\mathrm{fee} = N \cdot \frac{\mathrm{bps}}{10000}
\]

Канон Appendix A: bps = 0 → fee = 0.

---

## B.5 Unrealized / realized PnL

### Long
\[
\mathrm{uPnL} = (M - E) \cdot q
\]

### Short
\[
\mathrm{uPnL} = (E - M) \cdot q
\]

```ts
export function unrealizedPnl(
  side: 'long' | 'short',
  entry: number,
  mark: number,
  qty: number,
): number {
  if (side === 'long') return (mark - entry) * qty;
  return (entry - mark) * qty;
}
```

При закрытии / ликвидации: `realizedPnl = unrealizedPnl(...)` на цене исполнения.

---

## B.6 Liquidation price (isolated margin)

Пусть \(m =\) `MAINTENANCE_MARGIN_RATE`.

### Long
Ликвидация, когда equity позиции падает до maintenance от notional.

Канон пакета (простая isolated модель):

\[
P_{\mathrm{liq}}^{\mathrm{long}} = E \cdot \left(1 - \frac{1}{L} + m\right)
\]

Триггер: \(M \le P_{\mathrm{liq}}^{\mathrm{long}}\).

### Short

\[
P_{\mathrm{liq}}^{\mathrm{short}} = E \cdot \left(1 + \frac{1}{L} - m\right)
\]

Триггер: \(M \ge P_{\mathrm{liq}}^{\mathrm{short}}\).

```ts
export function liquidationPrice(
  side: 'long' | 'short',
  entry: number,
  leverage: number,
  maintenanceRate = MAINTENANCE_MARGIN_RATE,
): number {
  if (side === 'long') {
    return entry * (1 - 1 / leverage + maintenanceRate);
  }
  return entry * (1 + 1 / leverage - maintenanceRate);
}
```

Инварианты для тестов:
- При росте \(L\) long liq **растёт** к entry (ближе к рынку).
- При росте \(L\) short liq **падает** к entry.
- При \(L=1\), \(m=0.005\): long liq \(= E \cdot 0.005\); short liq \(= E \cdot 1.995\).

Clamp: `P_liq = max(P_liq, MIN_PRICE)`.

---

## B.7 Net worth

\[
\mathrm{NetWorth} = B + \sum_{i \in open}\left(\mathrm{margin}_i + \mathrm{uPnL}_i\right)
\]

Эквивалентная проверка: после mark-to-market equity не должна «создавать» деньги сверх PnL формул.

---

## B.8 Average entry (add to position)

\[
E' = \frac{E \cdot q + P_{\mathrm{fill}} \cdot q_{\mathrm{fill}}}{q + q_{\mathrm{fill}}}
\]

\[
q' = q + q_{\mathrm{fill}}
\]

\[
\mathrm{margin}' = \mathrm{margin} + \frac{q_{\mathrm{fill}} \cdot P_{\mathrm{fill}}}{L}
\]

Затем пересчитать \(P_{\mathrm{liq}}\) от \(E', L\).

---

## B.9 Order matching rules

### Market
- Long fill price = `bestAsk`
- Short fill price = `bestBid`
- Immediate full fill (симулятор не моделирует partial market shortage; size всегда доступен).

### Limit resting
- Long/Buy limit opens when placed if `limitPrice >= bestAsk` (marketable) → fill at `bestAsk`.
- Else rests.

### Limit trigger on tick (resting)
- Long: fill when `marketPrice <= limitPrice`, fillPrice = `limitPrice`
- Short: fill when `marketPrice >= limitPrice`, fillPrice = `limitPrice`

### Cancel
Только `status === 'open'` → `cancelled`.

---

## B.10 Synthetic order book

```ts
mid = price
halfSpread = (BASE_SPREAD_TICKS * tickSize) / 2
bestBid = roundToTick(mid - halfSpread, tickSize)
bestAsk = roundToTick(mid + halfSpread, tickSize)
// ensure bestBid < bestAsk; if equal, ask += tickSize

for i in 0..LEVELS-1:
  bidPrice = bestBid - i * LEVEL_STEP_TICKS * tickSize
  askPrice = bestAsk + i * LEVEL_STEP_TICKS * tickSize
  size = baseSize * (LEVEL_SIZE_GROWTH ** i) * (1 + uniform(-noise, +noise))
```

Cumulative:
```ts
// bids: from best to worse
cum = 0
for level in bids:
  cum += level.size
  level.cumulativeSize = cum
// asks: analogous
```

Merge user open limits: add `remainingQty` into matching price bucket (create bucket if absent), then re-sort and recompute cumulative.

---

## B.11 Candle aggregation

```ts
bucketStart(time, intervalSec) =
  Math.floor(time / (intervalSec * 1000)) * intervalSec * 1000

onTick(tick):
  key = bucketStart(tick.time, intervalSec)
  if no current or current.openTime !== key:
    push { openTime: key, open:high:low:close: tick.price, volume: tick.volume }
  else:
    high = max(high, price)
    low = min(low, price)
    close = price
    volume += tick.volume
```

Инварианты:
- `low <= open, close, high`
- `high >= open, close, low`
- `volume >= 0`

---

## B.12 News shock apply / expire

```ts
apply(news):
  targets = news.assetId === 'ALL' ? allAssets : [news.assetId]
  for asset in targets:
    asset.drift += news.driftDelta
    asset.volatility = clamp(asset.volatility + news.volatilityDelta, MIN_VOL, MAX_VOL)
    asset.shockEndsAt = now + news.durationMs

expire(asset, now):
  if asset.shockEndsAt !== null and now >= asset.shockEndsAt:
    asset.drift = asset.baseDrift
    asset.volatility = asset.baseVolatility
    asset.shockEndsAt = null
```

---

## B.13 Chart mapping

```ts
y(price) = top + (maxHigh - price) / (maxHigh - minLow) * height
xCenter(i) = left + i * slotW + slotW / 2
bodyTop = y(max(open, close))
bodyBottom = y(min(open, close))
bodyH = max(1, bodyBottom - bodyTop)
```

Volume bar height:
```ts
h = (volume / maxVolume) * volumeAreaHeight
```

---

## B.14 Cash accounting on open / close / liquidation

### Open
```ts
cash -= margin (+ fee)
```

Reject if `cash < requiredMargin (+ fee)`.

### Close (manual)
```ts
pnl = unrealizedPnl(side, entry, mark, qty)
cash += margin + pnl
```

### Liquidation
```ts
pnl = unrealizedPnl(side, entry, mark, qty)   // mark at trigger
cash += max(0, margin + pnl)
// if margin + pnl < 0, loss capped at margin (cash floor 0 on that transfer)
```

Не допускай `NaN`/`Infinity` в balances; после операций `cash = max(0, cash)` только если модель явно банкротит — **канон:** при ликвидации перенос `max(0, margin+pnl)`, иначе обычный close может временно требовать проверки (не открывай ордер без маржи).

---

## B.15 Oracle examples (for unit tests)

### GBM z=0
`mu=0`, `sigma=0.002`, `dt=1`, `S=100`, `z=0`:
\[
S' = 100 \cdot \exp(-0.5 \cdot 0.002^2) \approx 99.9998
\]

### Long PnL
`E=100`, `M=110`, `q=2` → uPnL = `20`.

### Short PnL
`E=100`, `M=90`, `q=2` → uPnL = `20`.

### Margin
`N=1000`, `L=5` → margin = `200`.

### Long liq
`E=100`, `L=10`, `m=0.005` → \(P_{\mathrm{liq}} = 100 \cdot (1 - 0.1 + 0.005) = 90.5\).

### Short liq
`E=100`, `L=10`, `m=0.005` → \(P_{\mathrm{liq}} = 100 \cdot (1 + 0.1 - 0.005) = 109.5\).
