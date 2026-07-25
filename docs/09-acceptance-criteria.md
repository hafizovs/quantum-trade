# 09 — Acceptance Criteria & Definition of Done

Чеклист приёмки. Генератор после завершения работ **обязан** пройти каждый пункт. Пункт провален → доработать код, не оправдываться.

---

## 9.1 Build & Run

- [ ] `npm install` завершается без ошибок
- [ ] `npm start` / `ng serve` поднимает приложение
- [ ] Консоль браузера без ошибок runtime при старте
- [ ] Нет красных ошибок Angular (NG0xxx) в консоли
- [ ] Zoneless: тики рынка обновляют UI (цены, график, стакан) без Zone.js hacks
- [ ] В зависимостях нет three / ngrx / chart.js / d3 / plotly / lightweight-charts / highcharts / echarts / tradingview
- [ ] Если Tailwind не подключён — SCSS variables тема работает; если подключён — конфиг полный

---

## 9.2 Shell & layout

- [ ] Terminal CSS Grid: trade | chart | order book+news; снизу positions; toolbar/status
- [ ] Toolbar с брендом **QuantumTrade**, asset tabs, interval 5s/15s, theme, lang, help, reset
- [ ] Status bar показывает Net Worth, cash, last price, unrealized PnL, live indicator
- [ ] Responsive stack на узком viewport не ломает chart полностью
- [ ] Тема Dark Financial / Cyberpunk Terminal: тёмный терминал, neon up/down

---

## 9.3 Market simulation

- [ ] Три актива BTC/USD, ETH/USD, CORE-AI доступны и тикают
- [ ] Цена обновляется примерно раз в секунду
- [ ] Модель цены — GBM (есть `gbmStep` / эквивалент), не простой `±const`
- [ ] News shock появляется в окне 30–45 с и меняет drift; headline виден в News Feed
- [ ] После окончания shock drift/vol возвращаются к base (snap)
- [ ] В пуле есть новости про AI-протокол и взлом моста (RU+EN)

---

## 9.4 Orders & matching

- [ ] Market BUY/LONG открывает long позицию, списывает margin с cash
- [ ] Market SELL/SHORT открывает short позицию
- [ ] Limit ордер встаёт в список и отображается/вливается в стакан
- [ ] Buy/Long limit исполняется когда marketPrice ≤ limitPrice
- [ ] Sell/Short limit исполняется когда marketPrice ≥ limitPrice
- [ ] При исполнении показывается toast
- [ ] Cancel снимает open limit
- [ ] Reject при недостаточной марже с понятным сообщением
- [ ] Time & Sales показывает синтетические и user сделки

---

## 9.5 Portfolio & leverage

- [ ] Leverage слайдер 1×…20× влияет на required margin и liq price preview
- [ ] Unrealized PnL long/short считается и обновляется каждый тик (computed)
- [ ] Net Worth обновляется в реальном времени
- [ ] Liquidation price отображается в позиции
- [ ] При достижении liq price позиция ликвидируется автоматически + danger toast + ledger entry
- [ ] Close position возвращает margin ± PnL в cash
- [ ] Вкладки Open Positions / Limit Orders / Balance History работают
- [ ] Reset восстанавливает initial cash и очищает позиции/ордера

---

## 9.6 Candlestick chart

- [ ] Canvas 2D рисует японские свечи с фитилями (high/low)
- [ ] Под свечами — histogram volume
- [ ] Интервалы 5s и 15s переключаются и показывают корректный OHLC
- [ ] Pan drag листает историю влево/вправо
- [ ] Wheel zoom меняет число видимых свечей в допустимых пределах
- [ ] HiDPI: нет мыла на retina (devicePixelRatio учтён)
- [ ] Last price line/label видны
- [ ] Crosshair или hover OHLC (если реализован crosshair — ок; минимум last price HUD)

---

## 9.7 Order book UI

- [ ] Asks и Bids видны, sorted корректно (best у spread)
- [ ] Горизонтальные depth bars отражают относительный size
- [ ] Spread / mid отображаются
- [ ] Клик по цене подставляет limit price в trade form
- [ ] Строки могут flash при обновлении

---

## 9.8 i18n / theme / hotkeys

- [ ] Locale default `ru`; `G` переключает RU↔EN
- [ ] Theme `T` переключает dark/light панелей; chart остаётся тёмным
- [ ] Hotkeys 1/2/3 меняют актив; L — Market/Limit; B/S — long/short market (если форма валидна)
- [ ] Help `H` показывает хоткеи; Escape закрывает
- [ ] Нет захардкоженных-only-RU строк критичного UI вне словарей (news/ledger bilingual fields допустимы)

---

## 9.9 Tests & code quality

- [ ] `npm test` / эквивалент прогоняет обязательные specs из документа 07
- [ ] В исходниках нет `// TODO`, `// ...`, `*ngIf`, `*ngFor`, BehaviorSubject-state для UI/market
- [ ] Чеклист [08-file-checklist.md](08-file-checklist.md) выполнен на 100%
- [ ] Канонические файлы брифа существуют под точными именами

---

## 9.10 Manual smoke script (обязателен к прохождению)

1. Открыть приложение → видны тикающий BTC график и стакан.
2. Market Long на BTC с плечом 5× → позиция в таблице, cash уменьшился, uPnL живой.
3. Поставить Limit Short далеко от рынка → ордер в вкладке; Cancel → исчез.
4. Поставить Limit близко / дождаться fill → toast + позиция/баланс.
5. Переключить 5s→15s, сделать pan и zoom на графике.
6. Дождаться news shock → headline + заметный тренд.
7. Открыть высокий leverage и довести до ликвидации (или unit-тестом подтвердить path) → danger toast.
8. Переключить EN/theme/help; Reset → стартовый cash.

---

## 9.11 Definition of Done (финальный вердикт)

Приложение **готово**, только если все чекбоксы §9.1–§9.9 отмечены и smoke §9.10 проходит.

**На этом генерация считается завершённой.**
