# 04 — Trading Engine

Реализуй биржевой движок **точно** по этому документу и [appendix-b-formulas.md](appendix-b-formulas.md). Не заменяй GBM случайным `±const`. Не пропускай matching, news shocks или liquidation.

Главный оркестратор: `src/app/services/trading-engine.service.ts`.  
Формульный фасад: `src/app/services/market-math.service.ts`.

---

## 4.1 Файлы

| Файл | Назначение |
|------|------------|
| `domain/market/gbm.ts` | Шаг Geometric Brownian Motion |
| `domain/market/gbm.spec.ts` | Тесты GBM (положительность, зависимость от z) |
| `domain/market/news-shock.ts` | Выбор новости, применение Δμ/Δσ, decay |
| `domain/market/candle-aggregator.ts` | Тики → OHLC 5s/15s |
| `domain/market/candle-aggregator.spec.ts` | OHLC инварианты |
| `domain/market/order-book-builder.ts` | Синтетический стакан вокруг mid |
| `domain/orders/matching-engine.ts` | Market fill + limit trigger |
| `domain/orders/matching-engine.spec.ts` | Fill / trigger cases |
| `domain/portfolio/margin.ts` | Margin, liq price, PnL |
| `domain/portfolio/margin.spec.ts` | Long/short PnL + liquidation |
| `domain/math/normal.ts` | Sample N(0,1) |
| `domain/math/rng.ts` | Seeded RNG |
| `services/market-math.service.ts` | DI-фасад формул |
| `services/trading-engine.service.ts` | Тик, команды, оркестрация |
| `services/market-clock.service.ts` | rAF / 1s tick pacing |

---

## 4.2 Жизненный цикл симуляции

### Bootstrap
1. Загрузи 3 актива из Appendix A (prices, drift, vol, precisions).
2. `cashUsd = INITIAL_CASH_USD`; ledger entry `depositSeed`.
3. Построй начальные order books; candles пустые или warm-up 1 synthetic tick.
4. `start()` → MarketClock запускает loop; `simRunning = true`.

### `onTick(now: number)` — атомарный тик (~1 с)
Для каждого `assetId`:

```
dt = TICK_DT_SEC                          // 1.0
z = sampleNormal()
price' = gbmStep(price, drift, vol, dt, z)
price' = max(price', MIN_PRICE)
price' = roundToTick(price', tickSize)

syntheticVolume = sampleTickVolume(asset)

push PriceTick
candleAggregator.onTick(tick, intervalSec)  // обновляет оба интервала ИЛИ только активный + lazy — канон: веди ОБА буфера 5s и 15s

book = buildOrderBook(price', assetParams)
publish book + price

matchUserLimitOrders(assetId, price', book)
markPositions(assetId, price')
checkLiquidations(assetId, price')
append synthetic TradeTapeItem (throttled: 1 per tick per asset)
```

Затем глобально:

```
maybeEmitNewsShock(now)                   // каждые 30–45с
decayExpiredShocks(now)                   // вернуть drift/vol к base*
trimRingBuffers()
```

### `stop()` / destroy
Отмени clock; не теряй состояние (pause). `resetSimulation()` — полный reseed Appendix A.

---

## 4.3 Geometric Brownian Motion

Дискретный шаг (канон пакета):

\[
S_{t+\Delta t} = S_t \cdot \exp\left(\left(\mu - \frac{1}{2}\sigma^2\right)\Delta t + \sigma\sqrt{\Delta t}\, Z\right), \quad Z \sim \mathcal{N}(0,1)
\]

- `μ = drift`, `σ = volatility`, `Δt = 1` секунда (см. масштабы в Appendix A/B).
- Реализация в `gbm.ts` как чистая функция `gbmStep(price, mu, sigma, dt, z): number`.
- `MarketMathService.nextPrice(...)` вызывает `gbmStep` + clamp/round.

Не используй аддитивный `price += random()` как основную модель.

---

## 4.4 News shocks

### Планировщик
- `nextShockAt = now + uniform(NEWS_MIN_MS, NEWS_MAX_MS)` (30_000…45_000).
- При `now >= nextShockAt`:
  1. Выбери шаблон новости из пула Appendix A (равномерно или взвешенно).
  2. Создай `NewsItem` с `driftDelta`, `volatilityDelta`, `durationMs`, `assetId` (`ALL` или один актив).
  3. Примени: `drift += driftDelta`, `vol += volatilityDelta` (clamp vol ≥ `MIN_VOL`).
  4. `shockEndsAt = now + durationMs` на затронутых активах.
  5. Unshift в `news` (cap `MAX_NEWS`).
  6. Toast `toast.news` (info).
  7. Запланируй следующий шок.

### Decay
Когда `now >= shockEndsAt`: экспоненциально или мгновенно верни `drift/vol` к `baseDrift/baseVolatility`.  
**Канон:** линейная интерполяция к base за `SHOCK_DECAY_MS` (Appendix A) **или** мгновенный snap к base в момент окончания — выбери **мгновенный snap** (проще, тестируемо). Документируй в коде одной строкой JSDoc, не TODO.

Пул заголовков (минимум 8, RU+EN) — в `news.constants.ts` / Appendix A. Примеры из брифа обязательны:
- «Регулятор одобрил AI-протокол» (bullish, COREAI или ALL)
- «Крупный взлом моста» (bearish, BTC/ETH)

---

## 4.5 Synthetic Order Book

На каждый тик пересобирай стакан вокруг mid/`price`:

1. `bestBid = price - spread/2`, `bestAsk = price + spread/2` (round to tick).
2. `LEVELS` уровней (Appendix A, default 12) в каждую сторону.
3. Шаг цены между уровнями: `tickSize * levelStepMultiplier` (или растущий step).
4. Size на уровне: `baseSize * (1 + noise)` с лёгким ростом глубины дальше от mid.
5. Посчитай `cumulativeSize` от best к worse.
6. User **resting limit orders** должны быть **видны** в книге: добавь их size на соответствующий level price (merge), не ломая сортировку.

---

## 4.6 Place order

### Валидация `placeOrder(input)`
1. `notionalUsd >= MIN_NOTIONAL_USD`.
2. `leverage` integer clamp 1…20.
3. Для limit: `limitPrice > 0` и кратен `tickSize`.
4. Рассчитай `qty = notionalUsd / refPrice`:
   - Market long → ref = bestAsk (или mid, если book пуст — **канон: bestAsk**)
   - Market short → ref = bestBid
   - Limit → ref = limitPrice
5. `qty = floorToLot(qty, lotSize)`; если qty ≤ 0 → reject.
6. `requiredMargin = notionalUsd / leverage` (+ optional fee; **канон fee = 0** или `TAKER_FEE_BPS` из Appendix A если > 0).
7. Если `cashUsd < requiredMargin` → reject `trade.error.insufficientMargin`.

### Market execution (сразу)
1. Fill price = bestAsk (long) / bestBid (short).
2. Создай/обнови `Position` (см. 4.8).
3. `cashUsd -= marginUsd` (и fee).
4. Order status `filled`; tape item `isUser: true`.
5. Toast `toast.orderFilled` / `toast.positionOpened`.
6. Добавь volume в текущую свечу.

### Limit placement
1. Order status `open`; храни в `openOrders`.
2. Внеси в book overlay.
3. **Немедленный** fill, если уже marketable:
   - Long limit: `limitPrice >= bestAsk` → fill as marketable limit at ask (или limitPrice — **канон: min(limitPrice, bestAsk) для buy?** → для buy лимит: fill at `bestAsk` если `limitPrice >= bestAsk`).
   - Short limit: `limitPrice <= bestBid` → fill at `bestBid` если `limitPrice <= bestBid`.
4. Иначе жди тиков.

### Limit trigger each tick (`matchUserLimitOrders`)
Для каждого `open` limit на активе:
- Long: если `lastPrice <= limitPrice` **или** `bestAsk <= limitPrice` — **канон триггера:** исполняй long limit когда `lastPrice <= limitPrice` (цена пересекла/коснулась лимита снизу/равна — классика buy-limit: цена дошла до лимита или ниже).  
  Уточнение канона пакета:
  - **Buy/Long limit** fills when `marketPrice <= limitPrice`
  - **Sell/Short limit** fills when `marketPrice >= limitPrice`
- Fill price = `limitPrice` (канон симулятора).
- Далее как market open position path; toast; status `filled`.

`cancelOrder`: только `open` → `cancelled`; освободи book overlay; toast optional.

---

## 4.7 Portfolio: open / average / close

### Open new position
Если нет open position с тем же `(assetId, side)`:
- Создай Position с `entryPrice = fillPrice`, `qty`, `leverage`, `marginUsd = (qty * entryPrice) / leverage`, `liquidationPrice = computeLiq(...)`.

### Add to same side
- Новый qty total = old + fillQty.
- `entryPrice = (oldEntry * oldQty + fillPrice * fillQty) / totalQty`.
- Дополнительная маржа `= (fillQty * fillPrice) / leverage` списывается с cash.
- Пересчитай `liquidationPrice`.

### Close position (market)
1. PnL = unrealized at mark (формула Appendix B).
2. `cashUsd += marginUsd + pnl` (pnl может быть отрицательным; clamp итоговый cash логикой: при банкротстве → 0 + liquidated path).
3. status `closed`; ledger `closePositionPnl`.
4. Удали из open positions (или пометь closed и фильтруй в UI).

---

## 4.8 Margin, PnL, Liquidation

Все формулы — Appendix B. Кратко:

### Unrealized PnL
- Long: `(mark - entry) * qty`
- Short: `(entry - mark) * qty`

### Liquidation price (isolated)
- Long: `entry * (1 - 1/leverage + MAINTENANCE_MARGIN_RATE)`
- Short: `entry * (1 + 1/leverage - MAINTENANCE_MARGIN_RATE)`  
(точные знаки и maintenance — **строго Appendix B**; не выдумывай другую модель).

### Margin call each tick
Если позиция open и:
- Long: `mark <= liquidationPrice`
- Short: `mark >= liquidationPrice`

то:
1. Закрой принудительно по `mark` (или liq price — **канон: mark**).
2. `status = 'liquidated'`.
3. `cashUsd += max(0, marginUsd + pnl)` (потери маржи допустимы до 0 cash).
4. Ledger `liquidation`.
5. Toast `toast.liquidated` kind=`danger`, `aria-live=assertive`.

### Net Worth
`netWorth = cashUsd + sum(marginUsd + unrealizedPnl for open positions)`  
Эквивалент: cash + equity positions. Держи `computed`.

---

## 4.9 MarketMathService API (канон)

```ts
gbmStep(price, mu, sigma, dt, z): number
sampleNormal(rng?): number
requiredMargin(notionalUsd, leverage): number
liquidationPrice(side, entry, leverage): number
unrealizedPnl(side, entry, mark, qty): number
qtyFromNotional(notionalUsd, price, lotSize): number
roundToTick(price, tickSize): number
```

Сервис тонкий: делегирует в `domain/**`.

---

## 4.10 TradingEngineService — команды

| Метод | Поведение |
|-------|-----------|
| `start` / `stop` | Clock on/off |
| `onTick` | §4.2 |
| `selectAsset` | UI selection |
| `setCandleInterval` | 5 \| 15; chart читает соответствующий буфер |
| `placeOrder` | §4.6 |
| `cancelOrder` | §4.6 |
| `closePosition` | market close §4.7 |
| `resetSimulation` | clear positions/orders/news/tape/candles; cash=initial; reseeds drifts; keep clock running |

---

## 4.11 Согласованность стакана и цены

1. Mid/last из GBM — источник истины.
2. Book всегда пересобирается после цены.
3. User fills влияют на tape и candle volume, но **не** обязаны сдвигать mid отдельной impact-моделью (impact optional = 0). Канон: **без permanent price impact**; mid остаётся GBM.

---

## 4.12 Ошибки и reject reasons (i18n keys)

- `trade.error.insufficientMargin`
- `trade.error.invalidNotional`
- `trade.error.invalidLimitPrice`
- `trade.error.invalidLeverage`
- `trade.error.orderNotFound`
- `trade.error.positionNotFound`

Показывай через toast `warning` / inline в trade panel.
