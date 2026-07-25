# 06 — UI Panels

Все панели — standalone components, Signals, control flow `@if`/`@for`. Строки UI — только через `I18nService.t(...)`. Стили — Tailwind **или** SCSS + CSS variables из [01-product-vision.md](01-product-vision.md).

---

## 6.1 Toolbar (`qt-toolbar`)

Элементы слева направо:

1. Brand: **QuantumTrade** (Orbitron / display font, крупнее соседних контролов).
2. Asset tabs / segmented control: `BTC/USD` | `ETH/USD` | `CORE-AI` (hotkeys 1/2/3).
3. Candle interval toggle: `5s` | `15s`.
4. Spacer.
5. Button **Reset** (`R`) — полный reset симуляции/портфеля.
6. Button **Theme** (`T`).
7. Button **Lang** (`G`) — показывает `RU`/`EN`.
8. Button **Help** (`H`).

Требования:
- `aria-label` на каждой кнопке; `aria-pressed` / selected state на asset и interval.
- Высота toolbar 48–52px; sticky top.
- i18n: `toolbar.reset`, `toolbar.theme`, `toolbar.lang`, `toolbar.help`, `toolbar.interval.5s`, `toolbar.interval.15s`, `asset.*`.

---

## 6.2 Terminal Root (`qt-terminal-root`)

Корневой компонент приложения (кроме thin `AppComponent` wrapper).

Ответственность:
- CSS Grid shell по wireframe из документа 01.
- Скомпоновать toolbar, trade-panel, trading-chart, order-book, news-feed, time-sales, positions-panel, status-bar, help, toast.
- На старте вызвать `tradingEngine.start()`; на destroy — `stop()` через `DestroyRef`.
- Пробросить команды пользователя в engine / ui store.

Не содержать формулы GBM/margin.

---

## 6.3 Trade Panel (`qt-trade-panel`)

Левая колонка. Элементы сверху вниз:

1. Заголовок `trade.title`.
2. Read-only selected asset + last price (mono, up/down flash class).
3. Order type toggle: **Market** | **Limit** (`L`).
4. Position side подразумевается кнопками снизу; визуально можно показать сегмент Long/Short preview.
5. Input **Notional USD** (`type=number`, min из Appendix A, step 10 или 1).
6. Если Limit — input **Limit price** (step = tickSize).
7. Leverage slider 1…20 + numeric label `×N` (`+`/`-` hotkeys).
8. Estimated block (`computed`):
   - qty
   - required margin
   - liq price preview (для выбранной стороны — показывай оба preview рядом с кнопками или пересчёт для Long и Short)
9. Кнопка **BUY / LONG** (зелёная).
10. Кнопка **SELL / SHORT** (красная).
11. Inline error из последнего reject (`reasonKey`).

### Поведение
- Submit вызывает `engine.placeOrder({ assetId, type, positionSide, notionalUsd, limitPrice, leverage })`.
- Disabled, если notional невалиден.
- После успешного market — можно оставить форму; toast подтверждает.
- Все labels через i18n: `trade.notional`, `trade.leverage`, `trade.buyLong`, `trade.sellShort`, `trade.margin`, `trade.liqPrice`, `trade.qty`, `trade.orderType.market`, `trade.orderType.limit`.

---

## 6.4 Trading Chart (`qt-trading-chart`)

Центр. См. [05-candlestick-chart.md](05-candlestick-chart.md).

Мини-HUD над/внутри:
- Symbol
- Last price
- 24h-like change от первой видимой свечи или session open (канон: change от open первой свечи в текущем slice)
- Interval badge

---

## 6.5 Order Book (`qt-order-book`)

Правая верхняя панель.

### Структура
1. Header: `orderBook.title` + spread.
2. Asks: список сверху вниз от **худшего к лучшему** или лучший у spread — **канон визуала TradingView:** asks отображаются так, чтобы **best ask был ближе к центру (над spread)**, т.е. массив asks рисуется reversed (высокий ask сверху, best ask снизу блока asks).
3. Spread row: mid / spread abs / spread bps.
4. Bids: best bid сверху, хуже — ниже.

### Строка уровня
- Price (цвет ask/bid)
- Size
- Cumulative (optional muted)
- Горизонтальный depth bar: ширина = `size / maxSizeAmongVisible` или `cumulative / maxCumulative` — **канон: по size относительно max size в видимых levels**.

`@for (level of asksView(); track level.price)`.
Flash class при изменении size на уровне (сравнение с prev snapshot в component effect).

Клик по price (optional nice-to-have) → подставить limit price в trade form через `output()` / ui store. **Обязателен** в пакете: реализуй click-to-fill limit price.

---

## 6.6 News Feed (`qt-news-feed`)

Правая нижняя — верхняя секция вкладки/стека.

- Список новостей newest-first, scrollable.
- Строка: time | sentiment badge | headline (locale).
- Bullish badge green, bearish red, neutral muted.
- Empty state: `news.empty`.
- Max render `MAX_NEWS` из store (уже trimmed).

---

## 6.7 Time & Sales (`qt-time-sales`)

Под news или соседняя вкладка в правом нижнем блоке.

**Канон layout:** внутри правой нижней панели — mini tabs `News` | `Trades` **или** вертикальный split 50/50. Выбери **mini tabs** (компактнее на высоте).

Строка tape:
- time (HH:mm:ss)
- price (up/down color by side)
- qty
- user trades — визуально отмечены (accent border / label `YOU`)

`@for (t of tape(); track t.id)`; limit отображения последним N (`MAX_TAPE_VIEW`).

---

## 6.8 Positions Panel (`qt-positions-panel`)

Нижняя панель с вкладками:

### Tab: Open Positions
Колонки:
| Asset | Side | Qty | Entry | Mark | Leverage | Margin | Liq Price | uPnL | Actions |

- uPnL цвет green/red + знак.
- Action: **Close** → `engine.closePosition(id)`.
- Empty: `positions.empty`.

### Tab: Limit Orders
Колонки:
| Asset | Side | Type | Qty | Limit | Leverage | Status | Created | Actions |

- Action: **Cancel** для `open`.
- Empty: `orders.empty`.

### Tab: Balance History
Колонки:
| Time | Kind | Delta | Balance after | Note |

- Delta цвет по знаку.
- Empty: `history.empty` (не должно быть сразу после seed — seed entry видна).

Tab state: `uiStore.positionsTab`.  
i18n: `positions.tabs.positions|orders|history`, заголовки колонок `positions.col.*`.

---

## 6.9 Status Bar (`qt-status-bar`)

Нижняя строка (под positions или над ней — **канон: самый низ окна**):

- Net Worth (крупнее)
- Cash USD
- Selected last price
- Total unrealized PnL (цвет)
- Sim clock / tick indicator (пульсирующая точка `live`)
- Optional: open positions count

---

## 6.10 Help Overlay (`qt-help-overlay`)

Модальный/drawer со списком хоткеев из документа 01 и кратким пояснением GBM / leverage / liquidation.  
Закрытие: button, backdrop click, Escape.

---

## 6.11 Toast (`qt-toast`)

Стек тостов top-right (z-index 40):
- success — fill / open
- warning — reject
- danger — liquidation (дольше TTL)
- info — news

Автоудаление по `ttlMs`.  
`role="status"`; liquidation — `aria-live="assertive"`.

---

## 6.12 Responsive

`< 1200px`: stack panels; chart min-height 320px; order book и news на полную ширину; positions scroll.
Не скрывай trade panel полностью — collapsible допустим с кнопкой «Trade».

---

## 6.13 Что запрещено в панелях

- Карточки-статистики вместо таблиц позиций на desktop.
- Стакан без depth bars.
- Кнопки Buy/Sell без явного Long/Short смысла.
- Хардкод русских строк в шаблонах в обход i18n.
