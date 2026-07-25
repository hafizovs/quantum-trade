# QuantumTrade — Главный промпт генерации проекта

> **Как использовать этот пакет:** вставь содержимое этого файла (INDEX.md) в начало диалога с кодовым агентом, затем укажи: «Прочитай и строго выполни документы `docs/01` → `docs/09` и оба appendix в указанном порядке. Генерируй полный код приложения без сокращений.»

---

## 0. Роль и миссия

Ты — **Senior Quant Developer** и **Frontend Architect**. Твоя задача — **с нуля** создать полноценное, расширенное, готовое к продакшену интерактивное приложение:

**«QuantumTrade: Симулятор биржи и японских свечей»**

на **последнем стабильном Angular (22+ на момент генерации)**.

Не спрашивай разрешения «начать с MVP». Выдай **полный рабочий проект**: все файлы, математический генератор цен (Geometric Brownian Motion), систему новостных шоков, движок ордеров и matching стакана, портфель с Long/Short и плечом 1×–20×, liquidation / margin call, Canvas 2D свечной график с volume / pan / zoom, живой order book, ленту новостей и Time & Sales, нижнюю панель позиций, Dark Financial / Cyberpunk Terminal UI, i18n, тесты из пакета документов. Выжми максимум из контекста. Не жалей токенов. Пиши шедевр.

Этот INDEX — точка входа. Детальные требования — в связанных документах ниже. При конфликте: **более специфичный документ побеждает**; жёсткие правила из §1 этого файла **неотменяемы**.

---

## 1. ЖЁСТКИЕ ПРАВИЛА ГЕНЕРАЦИИ КОДА (БЕЗ ИСКЛЮЧЕНИЙ)

1. **ПИШИ КОД ПОЛНОСТЬЮ.** Любые сокращения, комментарии вида `// ...`, `// TODO`, `// аналогично`, `// логика аналогична`, `/* rest of file */`, `...existing code...` **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ**. Напиши каждую функцию генерации цен, каждый шаг сведения ордеров в стакане и каждый пиксель отрисовки свечей на Canvas от начала до конца. Если файлы получаются гигантскими — пиши их целиком, не жалей токены.
2. **Только современный Angular:**
   - Standalone-компоненты (`standalone: true` явно, если CLI ещё требует).
   - **Angular Signals** для абсолютно всего реактивного состояния (`signal`, `computed`, `effect`, `linkedSignal`). **Запрещены** `BehaviorSubject` / `Subject` для UI/торгового состояния.
   - Новый Control Flow: `@if`, `@for` (с обязательным `track`), `@switch`, `@let`. **Запрещены** `*ngIf`, `*ngFor`, `*ngSwitch`.
   - `input()`, `output()`, `model()` вместо `@Input` / `@Output` декораторов.
   - `inject()` для DI.
   - **Zoneless** change detection (как в новых приложениях Angular 21+/22+). Не опирайся на Zone.js для обновления UI.
   - `ChangeDetectionStrategy.OnPush` (дефолт новых приложений — не отключай).
3. **Разделяй логику:** интерфейсы/модели отдельно, чистые формулы GBM / margin / PnL / matching в `domain/`, Angular-сервисы-обёртки отдельно, UI-компоненты отдельно, stores (signals) отдельно. UI **не** считает GBM-шаг, liquidation price и matching в шаблоне.
4. **Рендер графика — чистый HTML5 Canvas 2D.** **Запрещены** Chart.js, D3, Plotly, TradingView Lightweight Charts, Highcharts, ECharts, Three.js, Babylon, WebGL-фреймворки как npm-зависимости для графика (свечи и volume пишешь сам на Canvas 2D).
5. **Биржевая механика обязательна:**
   - Geometric Brownian Motion + news shocks — из [04-trading-engine.md](04-trading-engine.md) и [appendix-b-formulas.md](appendix-b-formulas.md).
   - Order Book Bids/Asks, Market + Limit, Long/Short, leverage 1×–20×, liquidation — из документов 03/04 и Appendix A/B.
   - Candlestick OHLC aggregation, pan/zoom — из [05-candlestick-chart.md](05-candlestick-chart.md).
   - Числа и дефолты — из [appendix-a-defaults.md](appendix-a-defaults.md).
6. **Запрещены заглушки:** пустые методы, `return 0`, fake prices без GBM, Lorem Ipsum в UI, `console.log` вместо логики, «потом допишем».
7. **Тесты обязательны** минимум для: GBM step, margin / liquidation / PnL long&short, order matching / limit fill, candle aggregation — см. [07-features-extended.md](07-features-extended.md), [09-acceptance-criteria.md](09-acceptance-criteria.md).
8. **i18n RU/EN** через signal-словарь (не `@angular/localize` build-time), см. [07-features-extended.md](07-features-extended.md).
9. **Структура файлов** должна соответствовать [08-file-checklist.md](08-file-checklist.md). Не пропускай файлы из чеклиста. Минимальный каркас из брифа **обязан** присутствовать (rename-locked):
   - `src/app/models/trading.types.ts`
   - `src/app/services/market-math.service.ts`
   - `src/app/services/trading-engine.service.ts`
   - `src/app/components/trading-chart/trading-chart.component.ts`
   - `src/app/components/order-book/order-book.component.ts`
   - `src/app/components/terminal-root/terminal-root.component.ts`
   Дополнительные файлы из чеклиста (`domain/`, `state/`, `i18n/`, specs, trade-panel, positions-panel, news-feed, time-sales, toolbar, toast) — тоже обязательны.
10. **Стили:** тема **Dark Financial / Cyberpunk Terminal**. Допустимы **Tailwind CSS** *или* чистый SCSS + CSS variables. Если выбираешь Tailwind — настрой его полностью (конфиг, content paths, утилиты) без TODO. Если SCSS — используй CSS variables `--qt-*` из [01-product-vision.md](01-product-vision.md). Не смешивай хаотично оба подхода в одном компоненте.
11. **Интерфейс** оформляй как профессиональный терминал Bloomberg / TradingView vibe: глубокая тёмная тема, контрастные неоновые зелёные (Up) и красные (Down) цвета, grid layout торгового дашборда.

---

## 2. Порядок чтения и выполнения документов

Выполняй **строго по порядку**. Не начинай UI, пока не зафиксированы модели, формулы и trading engine.

| Шаг | Документ | Что сделать |
|-----|----------|-------------|
| 1 | [01-product-vision.md](01-product-vision.md) | Понять продукт, terminal UX, journeys, хоткеи, a11y, визуальный язык |
| 2 | [02-architecture.md](02-architecture.md) | Создать скелет Angular-проекта и папок |
| 3 | [03-data-model.md](03-data-model.md) + [appendix-a-defaults.md](appendix-a-defaults.md) | Candle, Order, Position, MarketAsset, OrderBook, News, Portfolio |
| 4 | [04-trading-engine.md](04-trading-engine.md) + [appendix-b-formulas.md](appendix-b-formulas.md) | GBM, news shocks, matching, leverage, liquidation |
| 5 | [05-candlestick-chart.md](05-candlestick-chart.md) | Canvas 2D свечи, volume, pan/zoom |
| 6 | [06-ui-panels.md](06-ui-panels.md) | Trade panel, order book, news/T&S, positions tabs |
| 7 | [07-features-extended.md](07-features-extended.md) | i18n, hotkeys, theme, toasts, тесты |
| 8 | [08-file-checklist.md](08-file-checklist.md) | Сверка: все файлы существуют и полны |
| 9 | [09-acceptance-criteria.md](09-acceptance-criteria.md) | Прогнать DoD / приёмку |

---

## 3. Краткий функциональный объём (обязателен целиком)

### Market Simulation Engine
- 3 актива: **BTC/USD**, **ETH/USD**, **CORE-AI**.
- Цены обновляются каждую секунду через `requestAnimationFrame` или точный zoneless-таймер.
- Geometric Brownian Motion с drift и volatility; news shocks раз в 30–45 с резко меняют drift.

### Order Book & Matching
- Bids / Asks на Signals; Market (мгновенно по лучшей цене) и Limit (в стакан до пересечения цены).
- Matching при тике: исполнение лимитов пользователя + push/toast уведомление.

### Portfolio & Leverage
- Баланс USD + активы; Net Worth в реальном времени (`computed`).
- Long / Short, leverage 1×–20×, margin, liquidation price; Margin Call → автоликвидация.

### Интерфейс (Grid Terminal)
- **Левая панель:** торговый модуль (актив, Market/Limit, сумма, плечо, BUY/LONG, SELL/SHORT).
- **Центр:** Canvas свечной график (5 с / 15 с OHLC) + volume; pan и zoom.
- **Правая верхняя:** живой Order Book с полосками глубины.
- **Правая нижняя:** News Feed + Time & Sales.
- **Нижняя:** вкладки «Открытые позиции» / «Лимитные ордера» / «История баланса».

### Расширения (обязательны)
- Hotkeys, theme toggle, i18n RU/EN, toast notifications, unit-тесты формул/matching/свечей.

---

## 4. Технологический стек (зафиксировано)

| Область | Выбор |
|---------|--------|
| Framework | Angular **latest stable ≥ 22** |
| Components | Standalone only |
| State | Signals stores (`providedIn: 'root'` или feature) |
| CD | Zoneless + OnPush |
| Chart rendering | Pure HTML5 Canvas 2D |
| Forms controls | native + signals / `model()` |
| Styling | Tailwind CSS **или** SCSS + CSS variables (Dark Financial / Cyberpunk Terminal) |
| i18n | Signal-словари `ru.ts` / `en.ts` + `I18nService.t(key)` |
| Tests | Стандартный test runner CLI проекта (Vitest или Jest) |
| Package manager | npm |
| Language UI default | `ru` |
| Assets | BTC/USD, ETH/USD, CORE-AI |

**Команда старта проекта (ориентир):**

```bash
npx @angular/cli@latest new quantum-trade --routing=false --style=scss --ssr=false
cd quantum-trade
```

Имя приложения в `package.json` / title: **QuantumTrade**. Селектор префикс: `qt`.

---

## 5. Definition of Done (кратко)

Приложение **готово**, только если:

1. `ng serve` / `npm start` запускает терминал без ошибок.
2. Три актива тикают по GBM каждую ~1 с; график рисует живые свечи и volume.
3. News shocks появляются каждые 30–45 с и меняют drift; новости видны в ленте.
4. Market и Limit ордера (Long/Short) работают; стакан обновляется; лимиты исполняются с toast.
5. Leverage 1×–20×; margin и liquidation price считаются; при пробое — Margin Call и ликвидация.
6. Net Worth и unrealized PnL обновляются в реальном времени через `computed`.
7. Canvas: pan (drag) и zoom (wheel) по истории свечей работают.
8. Order Book показывает Bids/Asks с горизонтальными depth bars.
9. Нижняя панель: открытые позиции / лимиты / история баланса — работают.
10. i18n RU↔EN, theme toggle, hotkeys — работают.
11. Unit-тесты GBM / margin-PnL / matching / candles проходят.
12. В исходниках **нет** `// TODO`, `// ...`, `*ngIf`, `*ngFor`, BehaviorSubject-state, Chart.js, D3, TradingView libs, Three.js.
13. Чеклист [08-file-checklist.md](08-file-checklist.md) выполнен на 100%.
14. Все пункты [09-acceptance-criteria.md](09-acceptance-criteria.md) отмечены как выполненные.

Полный текст приёмки — в документе 09.

---

## 6. Стиль ответа генератора

1. Сначала создай структуру проекта и доменный слой (модели → GBM / margin / matching → stores → services).
2. Затем `TradingEngineService` + `MarketMathService`, затем UI (`TerminalRoot` → chart → order book → trade → positions → news), затем i18n и тесты.
3. Каждый файл выводи **целиком** с путём.
4. После завершения — кратко перечисли, как запустить и как проверить ключевые сценарии из §5.
5. Не предлагай «упростить GBM до random walk ±const». Не заменяй Canvas на готовую chart-библиотеку. Не пропускай liquidation, matching или pan/zoom.

---

## 7. Начни сейчас

Прочитай [01-product-vision.md](01-product-vision.md) и приступай к генерации полного проекта **QuantumTrade** согласно всему пакету `docs/`.

**Начинай генерацию. Напиши этот проект как Senior Quant Developer и Frontend Architect.**
