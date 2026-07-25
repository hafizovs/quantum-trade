# 01 — Product Vision & UX

Документ обязателен к исполнению целиком. Генератор кода не имеет права упрощать сценарии или выкидывать панели.

---

## 1.1 Продукт

| Поле | Значение |
|------|----------|
| Название | **QuantumTrade** |
| Подзаголовок (RU) | Симулятор биржи и японских свечей |
| Подзаголовок (EN) | Exchange & Candlestick Chart Simulator |
| Тип | SPA, профессиональный торговый терминал / market simulator |
| Платформа | Современный desktop Chrome/Firefox/Edge; mobile — usable (панели stacked / collapsible), desktop — primary |
| Рендер графика | HTML5 Canvas 2D (свечи + volume, pan/zoom) |
| Активы | BTC/USD, ETH/USD, CORE-AI |
| Торговый уровень | Market + Limit, Long/Short, leverage 1×–20×, order book matching, liquidation |

**Ценность:** дать прозрачный, математически честный симулятор биржи: Geometric Brownian Motion с новостными шоками, живой стакан, исполнение ордеров, маржинальные позиции и профессиональный свечной терминал в стиле Bloomberg / TradingView — без бэкенда и без внешних chart-библиотек.

**Аудитория:** трейдеры-любители, студенты quant/finance, frontend-разработчики Angular Signals, которым нужен нетривиальный stateful demo с real-time Canvas и биржевой математикой.

---

## 1.2 Информационная архитектура экрана

Один главный экран (без роутинга страниц). Корневой каркас — `TerminalRootComponent` на **CSS Grid**. Состав панелей:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Toolbar: QuantumTrade | asset tabs | candle 5s/15s | theme | lang | help         │
├──────────────┬────────────────────────────────────────────┬──────────────────────┤
│              │                                            │                      │
│  TRADE       │   CANDLESTICK CHART (Canvas 2D)            │  ORDER BOOK          │
│  PANEL       │   OHLC candles + wicks                     │  Asks (red)          │
│              │   Volume histogram below                   │  ─── spread ───      │
│  asset       │   pan drag | zoom wheel                    │  Bids (green)        │
│  Market/Lim  │                                            │  depth bars          │
│  size USD    │                                            ├──────────────────────┤
│  leverage    │                                            │  NEWS FEED           │
│  BUY / LONG  │                                            │  + TIME & SALES      │
│  SELL/SHORT  │                                            │                      │
├──────────────┴────────────────────────────────────────────┴──────────────────────┤
│ Tabs: Open Positions | Limit Orders | Balance History                            │
│ rows with unrealized PnL (green/red) / cancel limit / ledger entries             │
└──────────────────────────────────────────────────────────────────────────────────┘
│ Status: Net Worth | USD balance | selected price | unrealized PnL | sim time     │
```

- Левая trade panel: ~260–300px; центр chart — flex grow (минимум ~480px); правая колонка: ~280–320px (order book сверху ~55%, news/T&S снизу ~45%).
- Нижняя панель позиций: ~180–220px высотой, внутренний скролл таблицы.
- На `width < 1200px`: вертикальный стек Trade → Chart → Order Book → News → Positions (chart минимум 320px высотой).
- Z-index: terminal (0) < panels (10) < chart overlays/crosshair (20) < drawers/help (30) < toast (40).

Канон композиции:
- `AppComponent` — thin host → `qt-terminal-root`.
- `TerminalRootComponent` связывает toolbar, trade-panel, trading-chart, order-book, news-feed, time-sales, positions-panel, status-bar, help, toast.

---

## 1.3 Визуальный язык — Dark Financial / Cyberpunk Terminal

Тема по умолчанию: **dark** (Bloomberg / TradingView cyber terminal). Светлая тема панелей — переключатель (холст графика остаётся тёмным).

CSS variables (обязательные имена в `styles.scss` или `@theme` / `:root` при Tailwind):

```scss
:root,
[data-theme='dark'] {
  --qt-bg-deep: #070b10;
  --qt-bg-panel: #0d1219;
  --qt-bg-panel-elevated: #141b26;
  --qt-bg-chart: #0a0e14;
  --qt-border: #1e2a3a;
  --qt-border-strong: #2d3f56;
  --qt-text: #d7e0ea;
  --qt-text-muted: #7a8a9e;
  --qt-accent: #00e5a8;           /* terminal teal — не purple */
  --qt-accent-2: #3aa0ff;         /* info / selection cyan-blue */
  --qt-up: #00c853;               /* neon green Up */
  --qt-down: #ff3b5c;             /* neon red Down */
  --qt-up-dim: rgba(0, 200, 83, 0.18);
  --qt-down-dim: rgba(255, 59, 92, 0.18);
  --qt-warn: #ffb020;
  --qt-danger: #ff3b5c;
  --qt-grid: rgba(45, 63, 86, 0.45);
  --qt-crosshair: rgba(215, 224, 234, 0.35);
  --qt-depth-bid: rgba(0, 200, 83, 0.22);
  --qt-depth-ask: rgba(255, 59, 92, 0.22);
  --qt-focus-ring: #00e5a8;
  --qt-font-display: 'Orbitron', 'Segoe UI', sans-serif;
  --qt-font-ui: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  --qt-font-mono: 'IBM Plex Mono', 'JetBrains Mono', monospace;
}

[data-theme='light'] {
  --qt-bg-deep: #e8eef5;
  --qt-bg-panel: #f5f8fc;
  --qt-bg-panel-elevated: #ffffff;
  --qt-border: #c5d0de;
  --qt-border-strong: #9aabbf;
  --qt-text: #121820;
  --qt-text-muted: #5a6b7d;
  --qt-accent: #008f6b;
  --qt-accent-2: #1565c0;
  --qt-up: #1b8a45;
  --qt-down: #c62828;
  --qt-up-dim: rgba(27, 138, 69, 0.12);
  --qt-down-dim: rgba(198, 40, 40, 0.12);
  --qt-warn: #c77c00;
  --qt-danger: #c62828;
  --qt-grid: rgba(154, 171, 191, 0.35);
  --qt-crosshair: rgba(18, 24, 32, 0.3);
  --qt-depth-bid: rgba(27, 138, 69, 0.16);
  --qt-depth-ask: rgba(198, 40, 40, 0.16);
  --qt-focus-ring: #008f6b;
  /* chart остаётся тёмным: не переопределяй --qt-bg-chart / candle colors */
}
```

**Шрифты (подключи в `index.html`):**
- Brand / display: **Orbitron** — не Inter/Roboto/Arial.
- UI: **IBM Plex Sans**.
- Numbers / mono: **IBM Plex Mono** или **JetBrains Mono**.

**Motion (минимум 2–3):**
1. Flash строки стакана / Time & Sales при новом тике (150–200ms background pulse green/red).
2. Toast появление: fade + slide 180ms; liquidation toast — более агрессивный warn pulse.
3. PnL ячейки: краткий color flash при обновлении тика (не непрерывный glow spam).

**Brand:** слово **QuantumTrade** в toolbar — hero-level signal (крупнее соседних контролов, display font). Первый viewport читается как один терминал, не как набор карточек-дашборда.

**Запреты визуала:** purple-on-white / purple-indigo градиенты, cream+#terracotta broadsheet, emoji в UI-кнопках, multi-layer drop shadows, rounded-full pill-кластеры статистики, inset hero-карточки вместо full terminal grid.

---

## 1.4 User journeys (обязательные сценарии)

### J1 — Первый взгляд
1. Пользователь открывает приложение.
2. Тема: **dark**. Locale: **ru**. Актив: **BTC/USD**.
3. Стартовый баланс USD из Appendix A; симуляция уже тикает.
4. График показывает накопленные свечи (после нескольких тиков — живой OHLC); стакан заполнен; news feed может быть пуст до первого шока или с seed-новостью.
5. Brand **QuantumTrade** виден в toolbar.

### J2 — Market Long / Short
1. Выбирает актив (BTC / ETH / CORE-AI).
2. Тип ордера **Market**, вводит размер (USD notional или qty — канон: **USD notional**), leverage слайдером.
3. Жмёт **BUY / LONG** → позиция открывается по best ask / mid (см. 04); баланс маржи списывается; toast «Позиция открыта».
4. Аналогично **SELL / SHORT**.
5. Вкладка «Открытые позиции» показывает entry, size, leverage, liquidation, unrealized PnL (зелёный/красный).

### J3 — Limit order
1. Тип **Limit**, вводит limit price и размер.
2. Ордер встаёт в стакан / список лимитных ордеров.
3. Когда рыночная цена пересекает лимит — ордер исполняется, toast, позиция/баланс обновляются.
4. Можно отменить неисполненный лимит со вкладки «Лимитные ордера».

### J4 — Liquidation
1. Открывает агрессивный Long/Short с высоким плечом.
2. Рынок идёт против позиции до liquidation price.
3. Автоматический Margin Call: позиция закрывается, toast «Ликвидация», запись в историю баланса.

### J5 — Chart navigation
1. Тянет график мышью — pan истории влево/вправо.
2. Колесо — zoom по оси времени (больше/меньше свечей в viewport).
3. Переключатель 5s / 15s пересобирает OHLC из тиков без потери истории тиков.

### J6 — News shock
1. Через 30–45 с появляется новость в ленте (bullish или bearish).
2. Drift GBM меняется; тренд на графике становится заметно направленным.
3. Стакан и цены продолжают тикать согласованно.

### J7 — i18n / theme / help
1. `G` — RU↔EN; `T` — theme; `H` — help с хоткеями.
2. Все UI-строки через `t()`.

---

## 1.5 Hotkeys

| Клавиша | Действие |
|---------|----------|
| `1` | Выбрать BTC/USD |
| `2` | Выбрать ETH/USD |
| `3` | Выбрать CORE-AI |
| `B` | Фокус / быстрый Market BUY LONG (если форма валидна — submit long market) |
| `S` | Фокус / быстрый Market SELL SHORT |
| `L` | Переключить тип ордера Market ↔ Limit |
| `+` / `=` | Увеличить leverage на 1 (clamp max) |
| `-` | Уменьшить leverage на 1 (clamp min) |
| `Escape` | Закрыть help / сбросить фокус trade form |
| `T` | Theme toggle |
| `G` | Language RU↔EN |
| `H` | Help overlay |
| `R` | Reset portfolio & simulation (подтверждение не обязательно в симуляторе; канон: мгновенный soft-reset к стартовым балансам + clear positions/orders, рынок продолжает тикать с текущих цен **или** полный reseed — **канон: полный reset** по Appendix A) |

Хоткеи **не** срабатывают, если `event.target` — `input` / `textarea` / `select` / `contenteditable`, **кроме** Escape.

---

## 1.6 Accessibility

1. Toolbar и trade кнопки — focusable, `aria-label` через i18n.
2. Leverage slider: `role="slider"` + `aria-valuemin/max/now`.
3. BUY/LONG и SELL/SHORT различимы не только цветом (текст + иконка направления).
4. Order book rows: табличная семантика или `aria-row`/`aria-label` с price/size.
5. Positions table: `<table>` или grid с заголовками.
6. Toast / liquidation: `role="status"` / `aria-live="assertive"` для ликвидации, `polite` для обычных.
7. Canvas chart: `role="img"` + `aria-label` с активом и last price; pan/zoom — мышь/wheel (допустим hint в help).
8. Контраст текста на панелях ≥ WCAG AA для основного текста.
9. Focus visible на интерактивных элементах (не `outline: none` без замены).

---

## 1.7 Нефункциональные требования

1. Тик рынка ~1 с; UI обновляется через Signals без Zone.js.
2. Canvas redraw на тик / pan / zoom / resize без заметных лагов при ≤ 500 свечах в буфере (ориентир; clamp истории — Appendix A).
3. Matching и liquidation — синхронно внутри тика движка; без гонок двух таймеров на один asset.
4. Без роутера и без SSR.
5. Без внешних chart/trading библиотек.
6. README с install/start/test и кратким описанием возможностей.

---

## 1.8 Что запрещено в UX

- Пустой «график-заглушка» без реальных OHLC.
- Стакан без depth bars.
- Скрытая нижняя панель позиций на desktop ≥ 1200px.
- Торговля без выбора leverage (должен быть явный контроль, default из Appendix A).
- Purple-on-white / terracotta-cream / broadsheet газетный layout как визуальный дефолт.
- Карточки-статы в hero-зоне вместо единого terminal composition.
