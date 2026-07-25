# 08 — File Checklist

Генератор **обязан** создать каждый файл из списка. Отмечай мысленно ☑. Пропуск файла = провал DoD.

Рядом с путём — краткое содержание (1–2 предложения). Код внутри файла — **полный**, без сокращений.

---

## 8.1 Project root / Angular scaffold

| # | Path | Content |
|---|------|---------|
| 1 | `package.json` | Имя `quantum-trade`, scripts start/build/test; tailwind deps если выбран Tailwind |
| 2 | `angular.json` | project config, styles `src/styles.scss` |
| 3 | `tsconfig.json` | base TS config |
| 4 | `tsconfig.app.json` | app TS config |
| 5 | `tsconfig.spec.json` | spec TS config |
| 6 | `src/index.html` | title QuantumTrade, fonts Orbitron/IBM Plex Sans/IBM Plex Mono, root element |
| 7 | `src/main.ts` | bootstrapApplication |
| 8 | `src/styles.scss` | CSS variables Dark Financial, reset, full viewport, flash keyframes |
| 9 | `README.md` | install, start, test, hotkeys, overview |
| 10 | `tailwind.config.js` / эквивалент | **только если** выбран Tailwind — полный конфиг content/theme |

---

## 8.2 App shell

| # | Path | Content |
|---|------|---------|
| 11 | `src/app/app.config.ts` | zoneless providers |
| 12 | `src/app/app.component.ts` | thin host → terminal-root |
| 13 | `src/app/app.component.html` | `<qt-terminal-root />` |
| 14 | `src/app/app.component.scss` | full-height host |

---

## 8.3 Models (канон брифа)

| # | Path | Content |
|---|------|---------|
| 15 | `src/app/models/trading.types.ts` | Candle, Order, Position, MarketAsset, OrderBookItem, NewsItem + связанные типы |

---

## 8.4 Core constants

| # | Path | Content |
|---|------|---------|
| 16 | `src/app/core/constants/market.constants.ts` | tick dt, min price, vol clamps, catch-up |
| 17 | `src/app/core/constants/assets.constants.ts` | BTC/ETH/COREAI seed params |
| 18 | `src/app/core/constants/order-book.constants.ts` | levels, spread, size bases |
| 19 | `src/app/core/constants/portfolio.constants.ts` | initial cash, leverage, maintenance, min notional |
| 20 | `src/app/core/constants/chart.constants.ts` | visible candles, zoom, paddings, body ratio |
| 21 | `src/app/core/constants/news.constants.ts` | shock timing + headline pool |
| 22 | `src/app/core/constants/ui.constants.ts` | toast TTL, tape/news caps, panel sizes |

---

## 8.5 Core models (модульные)

| # | Path | Content |
|---|------|---------|
| 23 | `src/app/core/models/asset-id.model.ts` | AssetId |
| 24 | `src/app/core/models/order-type.model.ts` | OrderType |
| 25 | `src/app/core/models/order-side.model.ts` | OrderSide |
| 26 | `src/app/core/models/position-side.model.ts` | PositionSide |
| 27 | `src/app/core/models/candle-interval.model.ts` | CandleIntervalSec |
| 28 | `src/app/core/models/theme.model.ts` | ThemeId |
| 29 | `src/app/core/models/locale.model.ts` | LocaleId |

---

## 8.6 Domain market / orders / portfolio / math

| # | Path | Content |
|---|------|---------|
| 30 | `src/app/domain/market/gbm.ts` | gbmStep pure |
| 31 | `src/app/domain/market/gbm.spec.ts` | GBM tests |
| 32 | `src/app/domain/market/news-shock.ts` | pick + apply shock |
| 33 | `src/app/domain/market/candle-aggregator.ts` | ticks → OHLC |
| 34 | `src/app/domain/market/candle-aggregator.spec.ts` | candle tests |
| 35 | `src/app/domain/market/order-book-builder.ts` | synthetic book + user limits merge |
| 36 | `src/app/domain/orders/matching-engine.ts` | market/limit match |
| 37 | `src/app/domain/orders/matching-engine.spec.ts` | matching tests |
| 38 | `src/app/domain/portfolio/margin.ts` | margin, liq, PnL |
| 39 | `src/app/domain/portfolio/margin.spec.ts` | portfolio math tests |
| 40 | `src/app/domain/math/clamp.ts` | clamp/lerp |
| 41 | `src/app/domain/math/rng.ts` | mulberry32 + RandomSource |
| 42 | `src/app/domain/math/normal.ts` | Box-Muller N(0,1) |
| 43 | `src/app/domain/math/id-factory.ts` | createId prefixes |

---

## 8.7 State stores

| # | Path | Content |
|---|------|---------|
| 44 | `src/app/state/market.store.ts` | prices, params, candles, books, news, tape |
| 45 | `src/app/state/portfolio.store.ts` | cash, positions, orders, ledger |
| 46 | `src/app/state/ui.store.ts` | theme, locale, help, tabs, toasts, selection mirrors if needed |

---

## 8.8 Services (канон брифа + clock)

| # | Path | Content |
|---|------|---------|
| 47 | `src/app/services/market-math.service.ts` | фасад GBM/margin/PnL |
| 48 | `src/app/services/trading-engine.service.ts` | сердце: тики, matching, portfolio |
| 49 | `src/app/services/trading-engine.service.spec.ts` | place/fill/liquidate/reset |
| 50 | `src/app/services/market-clock.service.ts` | rAF / 1s pacing |
| 51 | `src/app/services/hotkeys.service.ts` | keyboard bindings |
| 52 | `src/app/services/i18n.service.ts` | signal dictionaries |
| 53 | `src/app/services/toast.service.ts` | toast queue helper (или методы ui.store) |

---

## 8.9 Components (канон брифа + UI)

| # | Path | Content |
|---|------|---------|
| 54 | `src/app/components/terminal-root/terminal-root.component.ts` | корневой wiring |
| 55 | `src/app/components/terminal-root/terminal-root.component.html` | grid shell |
| 56 | `src/app/components/terminal-root/terminal-root.component.scss` | terminal layout |
| 57 | `src/app/components/trading-chart/trading-chart.component.ts` | canvas host + pan/zoom |
| 58 | `src/app/components/trading-chart/trading-chart.component.html` | canvas + HUD |
| 59 | `src/app/components/trading-chart/trading-chart.component.scss` | chart panel |
| 60 | `src/app/components/trading-chart/trading-chart.renderer.ts` | draw grid/candles/volume |
| 61 | `src/app/components/order-book/order-book.component.ts` | book + depth |
| 62 | `src/app/components/order-book/order-book.component.html` | asks/spread/bids |
| 63 | `src/app/components/order-book/order-book.component.scss` | depth bars |
| 64 | `src/app/components/trade-panel/trade-panel.component.ts` | order form |
| 65 | `src/app/components/trade-panel/trade-panel.component.html` | inputs + BUY/SELL |
| 66 | `src/app/components/trade-panel/trade-panel.component.scss` | trade styles |
| 67 | `src/app/components/news-feed/news-feed.component.ts` | news list |
| 68 | `src/app/components/news-feed/news-feed.component.html` | headlines |
| 69 | `src/app/components/news-feed/news-feed.component.scss` | news styles |
| 70 | `src/app/components/time-sales/time-sales.component.ts` | tape |
| 71 | `src/app/components/time-sales/time-sales.component.html` | trades list |
| 72 | `src/app/components/time-sales/time-sales.component.scss` | tape styles |
| 73 | `src/app/components/positions-panel/positions-panel.component.ts` | tabs + tables |
| 74 | `src/app/components/positions-panel/positions-panel.component.html` | positions/orders/history |
| 75 | `src/app/components/positions-panel/positions-panel.component.scss` | table styles |
| 76 | `src/app/components/toolbar/toolbar.component.ts` | brand + toggles |
| 77 | `src/app/components/toolbar/toolbar.component.html` | toolbar row |
| 78 | `src/app/components/toolbar/toolbar.component.scss` | toolbar styles |
| 79 | `src/app/components/status-bar/status-bar.component.ts` | net worth / pnl |
| 80 | `src/app/components/status-bar/status-bar.component.html` | status content |
| 81 | `src/app/components/status-bar/status-bar.component.scss` | status styles |
| 82 | `src/app/components/help-overlay/help-overlay.component.ts` | help modal |
| 83 | `src/app/components/help-overlay/help-overlay.component.html` | hotkeys list |
| 84 | `src/app/components/help-overlay/help-overlay.component.scss` | overlay styles |
| 85 | `src/app/components/toast/toast.component.ts` | toast stack |
| 86 | `src/app/components/toast/toast.component.html` | toast items |
| 87 | `src/app/components/toast/toast.component.scss` | toast motion |

---

## 8.10 i18n

| # | Path | Content |
|---|------|---------|
| 88 | `src/app/i18n/locale.type.ts` | LocaleId |
| 89 | `src/app/i18n/i18n.keys.ts` | keys union/const |
| 90 | `src/app/i18n/ru.ts` | полный русский словарь |
| 91 | `src/app/i18n/en.ts` | полный английский словарь |

---

## 8.11 Правила полноты

- Каждый `.ts` компонент содержит полный template (inline или `.html`) и стили.
- GBM, matching, liquidation, canvas draw реализованы полностью.
- Нет пустых файлов-заглушек.
- Если генератор добавляет вспомогательные файлы сверх списка — это разрешено; **удалять** файлы из списка — нельзя.
- Канон брифа (rename-locked) обязан существовать:
  - `models/trading.types.ts`
  - `services/market-math.service.ts`
  - `services/trading-engine.service.ts`
  - `components/trading-chart/trading-chart.component.ts`
  - `components/order-book/order-book.component.ts`
  - `components/terminal-root/terminal-root.component.ts`
