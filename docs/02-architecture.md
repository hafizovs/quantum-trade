# 02 — Architecture (Angular 22+)

Создай приложение строго по этой архитектуре. Не сваливай GBM, matching и liquidation в шаблоны компонентов. Не используй NgRx/Akita — только Signals stores.

---

## 2.1 Стек и bootstrap

1. Создай проект Angular **latest stable ≥ 22**, standalone, SCSS, **без SSR**, без routing (предпочтительно **без** `@angular/router`).
2. Включи **zoneless** (дефолт новых приложений). Не добавляй `zone.js` обратно.
3. Prefix: `qt`.
4. Точка входа: `main.ts` → `bootstrapApplication(AppComponent, appConfig)`.
5. `app.config.ts`: `provideZonelessChangeDetection()` (или эквивалент актуального API).
6. Если используешь Tailwind — добавь официальную интеграцию для Angular/PostCSS полностью (конфиг, content globs, base styles). Если SCSS — глобальные CSS variables из документа 01.

---

## 2.2 Дерево каталогов (обязательное)

Минимальный каркас из брифа **обязан** существовать. Доменный слой расширяет его до продакшен-структуры:

```
src/
  index.html
  main.ts
  styles.scss
  app/
    app.component.ts
    app.component.html
    app.component.scss
    app.config.ts

    models/
      trading.types.ts           # Candle, Order, Position, MarketAsset, OrderBookItem, NewsItem (+ реэкспорт)

    core/
      constants/
        market.constants.ts
        assets.constants.ts
        order-book.constants.ts
        portfolio.constants.ts
        chart.constants.ts
        news.constants.ts
        ui.constants.ts
      models/
        asset-id.model.ts
        order-type.model.ts
        order-side.model.ts
        position-side.model.ts
        candle-interval.model.ts
        theme.model.ts
        locale.model.ts

    domain/
      market/
        gbm.ts                   # Geometric Brownian Motion step
        gbm.spec.ts
        news-shock.ts            # pick news, apply drift/vol shocks
        candle-aggregator.ts     # ticks → OHLC candles
        candle-aggregator.spec.ts
        order-book-builder.ts    # synthetic book around mid
      orders/
        matching-engine.ts       # market/limit match + fills
        matching-engine.spec.ts
      portfolio/
        margin.ts                # margin, liquidation, PnL
        margin.spec.ts
      math/
        clamp.ts
        rng.ts                   # seeded RNG for tests / optional sim seed
        normal.ts                # Box-Muller / Ziggurat N(0,1)

    state/
      market.store.ts            # prices, candles, books, news, trades tape
      portfolio.store.ts         # balances, positions, orders, ledger
      ui.store.ts                # theme, locale, selectedAsset, candleInterval, help, toast

    services/
      market-math.service.ts     # КАНОН БРИФА: фасад формул GBM/margin/PnL
      trading-engine.service.ts  # КАНОН БРИФА: тики, matching, portfolio orchestration
      market-clock.service.ts    # rAF / zoneless timer ~1s ticks
      hotkeys.service.ts
      i18n.service.ts
      toast.service.ts

    components/
      terminal-root/
        terminal-root.component.ts
        terminal-root.component.html
        terminal-root.component.scss
      toolbar/
        toolbar.component.ts
        toolbar.component.html
        toolbar.component.scss
      trade-panel/
        trade-panel.component.ts
        trade-panel.component.html
        trade-panel.component.scss
      trading-chart/
        trading-chart.component.ts
        trading-chart.component.html
        trading-chart.component.scss
        trading-chart.renderer.ts    # Canvas draw helpers (допустимо)
      order-book/
        order-book.component.ts
        order-book.component.html
        order-book.component.scss
      news-feed/
        news-feed.component.ts
        news-feed.component.html
        news-feed.component.scss
      time-sales/
        time-sales.component.ts
        time-sales.component.html
        time-sales.component.scss
      positions-panel/
        positions-panel.component.ts
        positions-panel.component.html
        positions-panel.component.scss
      status-bar/
        status-bar.component.ts
        status-bar.component.html
        status-bar.component.scss
      help-overlay/
        help-overlay.component.ts
        help-overlay.component.html
        help-overlay.component.scss
      toast/
        toast.component.ts
        toast.component.html
        toast.component.scss

    i18n/
      locale.type.ts
      i18n.keys.ts
      ru.ts
      en.ts
```

Допускается объединять мелкие model-файлы **только если** публичный API `models/trading.types.ts` полностью покрывает типы из документа 03. Предпочтительно держать `trading.types.ts` как канонический агрегат.

**Важно про канонические сервисы:**
- `market-math.service.ts` — публичный фасад над `domain/market/gbm`, `domain/portfolio/margin` (+ helpers). UI и engine вызывают его **или** domain напрямую из engine; **канон:** engine использует domain pure + math service как DI-обёртку с теми же формулами (без дублирования логики двумя разными реализациями).
- `trading-engine.service.ts` — единственный оркестратор тика: GBM → candles → book → match limits → mark positions → liquidations → news schedule.

---

## 2.3 Слои и зависимости

```
components → services / stores → domain/* (pure)
                ↑
         models / core/constants
```

| Слой | Ответственность | Запрещено |
|------|-----------------|-----------|
| `models` / `core/models` | Типы, union, интерфейсы | Логика рынка |
| `domain/market` | GBM, news shock, candles, synthetic book | Angular DI, DOM |
| `domain/orders` | Matching Market/Limit | UI |
| `domain/portfolio` | Margin, PnL, liquidation price | DOM |
| `domain/math` | clamp, RNG, normal sample | UI |
| `state/*` | Signals snapshots | Формулы GBM |
| `services/trading-engine` | Оркестрация тика и команд пользователя | HTML шаблоны |
| `services/market-math` | DI-фасад формул | Рендер |
| `services/market-clock` | rAF / timer | Matching |
| `components/*` | Отображение + команды | Математика маржи/GBM |

Правила:
1. `domain/**` — **чистые** функции/классы без Angular DI, без DOM.
2. Компоненты читают state через `inject(TradingEngineService)` / stores, не считают liquidation в шаблоне (допустим вывод уже посчитанных `computed` полей).
3. Запрещён circular import store ↔ component.

---

## 2.4 Поток данных тика

```
MarketClockService (rAF / accum ≥ 1s)
  → TradingEngineService.onTick(now)
      → for each asset:
          domain gbm.step(price, drift, vol, dt, z)
          update mid / last
          rebuild synthetic order book
          candleAggregator.pushTick
          matchingEngine.checkUserLimits
          portfolio mark-to-market + liquidation checks
      → maybe emit news shock (30–45s)
      → update Time & Sales tape
        → Signals update
          → Chart / OrderBook / Positions / Status (computed views)
```

Правила:
1. Единственный писатель рыночного и портфельного состояния во время симуляции — `TradingEngineService` (через store API / собственные WritableSignals).
2. UI вызывает только команды: `placeOrder`, `cancelOrder`, `closePosition`, `selectAsset`, `setCandleInterval`, `resetSimulation`.
3. Unrealized PnL и Net Worth — `computed` от positions + prices + cash.

---

## 2.5 Signals surface (канон API)

### `TradingEngineService` (минимум)

```ts
// market
assets: Signal<MarketAsset[]>
selectedAssetId: WritableSignal<AssetId>
prices: Signal<Record<AssetId, number>>
candles: Signal<Record<AssetId, Candle[]>>
orderBooks: Signal<Record<AssetId, OrderBookSnapshot>>
news: Signal<NewsItem[]>
timeAndSales: Signal<TradeTapeItem[]>
candleIntervalSec: WritableSignal<5 | 15>
simRunning: Signal<boolean>

// portfolio
cashUsd: Signal<number>
positions: Signal<Position[]>
openOrders: Signal<Order[]>
balanceHistory: Signal<BalanceLedgerEntry[]>
netWorth: Signal<number>
totalUnrealizedPnl: Signal<number>

// commands
selectAsset(id: AssetId): void
setCandleInterval(sec: 5 | 15): void
placeOrder(input: PlaceOrderInput): PlaceOrderResult
cancelOrder(orderId: string): void
closePosition(positionId: string): void
resetSimulation(): void
start(): void
stop(): void
```

Полные типы — в документе 03. Engine стартует автоматически при bootstrap (`start()` из `TerminalRoot` / constructor + `DestroyRef` cleanup).

### `UiStore`

```ts
theme: WritableSignal<'dark' | 'light'>
locale: WritableSignal<'ru' | 'en'>
helpOpen: WritableSignal<boolean>
positionsTab: WritableSignal<'positions' | 'orders' | 'history'>
toastQueue: WritableSignal<ToastItem[]>
```

---

## 2.6 Market clock (zoneless)

`MarketClockService`:
1. Один `requestAnimationFrame` loop **или** `scheduler` + rAF hybrid.
2. Накапливай `elapsed`; когда `elapsed >= TICK_INTERVAL_MS` (1000) — вызови `engine.onTick`, вычти интервал (не drift-ам через «пропуск», обрабатывай catch-up max N тиков за кадр — см. Appendix A `MAX_CATCH_UP_TICKS`).
3. Не используй Zone.js `setInterval` как единственный механизм без учёта background tab; rAF допустим с fallback `setTimeout` при `document.hidden`.
4. `stop()` отменяет rAF и очищает generation token.

---

## 2.7 Композиция UI

`AppComponent` → `qt-terminal-root`.

`TerminalRootComponent` связывает:
- `qt-toolbar`
- `qt-trade-panel`
- `qt-trading-chart`
- `qt-order-book`
- `qt-news-feed` + `qt-time-sales` (можно в одном правом нижнем контейнере)
- `qt-positions-panel`
- `qt-status-bar`
- `qt-help-overlay`
- `qt-toast`

Не размещай matching/GBM в `TerminalRoot` — только wiring команд и layout.

---

## 2.8 Именование и селекторы

| Сущность | Правило |
|----------|---------|
| Selector | `qt-<kebab-name>` |
| Class | `QtPascalCaseComponent` / `TradingEngineService` |
| Signal fields | camelCase (`cashUsd`, `orderBooks`) |
| i18n keys | dot.notation (`trade.buyLong`, `toast.liquidated`) |
| Asset ids | `'BTCUSD' \| 'ETHUSD' \| 'COREAI'` |

---

## 2.9 Тестовая стратегия (архитектурно)

- Чистые функции `domain/**` тестируй без TestBed.
- Matching / margin — с фиксированными ценами и детерминированным RNG.
- `TradingEngineService` — интеграционные spec на place → fill → liquidate с замоканным clock (ручной `onTick`).
- Компоненты — smoke по желанию; **обязательны** domain + engine specs из 07/09.

---

## 2.10 Запрещённые зависимости

Не добавляй: `three`, `@ngrx/*`, `chart.js`, `d3`, `plotly`, `lightweight-charts`, `highcharts`, `echarts`, `tradingview`, `phaser`, `rxjs` как замену Signals для UI/market state.
