# 07 — Extended Features

Все фичи этого документа **обязательны**. Не помечай их optional в коде.

---

## 7.1 Toasts & notifications

`ToastService` / `UiStore.toastQueue`:
1. `show(kind, messageKey, params?, ttlMs?)`.
2. Default TTL: info/success 2500ms; warning 3500ms; danger (liquidation) 6000ms.
3. Max visible stack: 4; новые сверху.
4. Обязательные события:
   - order filled / position opened
   - limit placed
   - limit cancelled
   - position closed
   - liquidated
   - news shock
   - order rejected
   - simulation reset

---

## 7.2 i18n (signal-словари)

### Файлы
- `i18n/locale.type.ts` — `LocaleId = 'ru' | 'en'`
- `i18n/i18n.keys.ts` — union всех ключей **или** const object
- `i18n/ru.ts` / `i18n/en.ts` — словари
- `services/i18n.service.ts` — `locale = signal`, `t(key, params?)`

### Требования
1. Default locale: `ru`.
2. Все видимые строки UI через `t()`.
3. News headlines хранятся как `headlineRu` / `headlineEn` в модели — UI выбирает по locale (не обязательно ключи для каждого шаблона новости).
4. Ledger notes — аналогично `noteRu` / `noteEn`.
5. Переключение `G` мгновенно обновляет UI.

Минимальные группы ключей: `toolbar.*`, `trade.*`, `orderBook.*`, `news.*`, `tape.*`, `positions.*`, `status.*`, `toast.*`, `help.*`, `asset.*`, `theme.*`, `chart.*`.

---

## 7.3 Hotkeys

`HotkeysService` слушает `window:keydown` (через host listener в terminal-root или injectable с `DestroyRef`).

Таблица — из [01-product-vision.md](01-product-vision.md) §1.5. Игнорируй, если target — input/select/textarea/contenteditable (кроме Escape).

---

## 7.4 Theme toggle

- `ui.theme: 'dark' | 'light'`
- Пиши `data-theme` на `document.documentElement`.
- Chart canvas остаётся тёмным; панели следуют теме.
- После toggle — chart redraw.

---

## 7.5 Unit tests (обязательные)

Создай и добейся зелёного прогона:

| Файл | Что покрыть |
|------|-------------|
| `domain/market/gbm.spec.ts` | `gbmStep` > 0; при z=0 формула совпадает с oracle; рост/падение зависит от знака z при μ=0 |
| `domain/portfolio/margin.spec.ts` | long/short unrealized PnL; requiredMargin; liquidationPrice monotonic vs leverage; long liquidated when mark ≤ liq |
| `domain/orders/matching-engine.spec.ts` | market long fills at ask; buy limit fills when price ≤ limit; sell limit when price ≥ limit; cancel removes open |
| `domain/market/candle-aggregator.spec.ts` | OHLC updates inside bucket; new bucket on interval boundary; volume sums; low/high invariants |
| `services/trading-engine.service.spec.ts` | place market → position + cash↓; tick marks pnl; force liquidation path; reset restores cash |

RNG в тестах — детерминированный stub (`rng.ts` seed).

---

## 7.6 README проекта

В корне приложения `README.md`:
- Описание QuantumTrade
- `npm install` / `npm start` / `npm test`
- Кратко: активы, хоткеи, leverage, ссылка на пакет промпта `../docs` (если docs рядом)

---

## 7.7 Quality gates

Перед завершением генерации:
1. Нет `TODO` / `...` / `as any` без нужды (допустим точечный cast с комментарием-обоснованием, не заглушкой).
2. Нет `*ngIf` / `*ngFor` / `BehaviorSubject` для state.
3. Нет Chart.js / D3 / lightweight-charts / TradingView deps.
4. Все файлы из [08-file-checklist.md](08-file-checklist.md) существуют.
5. Сценарии [09-acceptance-criteria.md](09-acceptance-criteria.md) выполнимы вручную.
