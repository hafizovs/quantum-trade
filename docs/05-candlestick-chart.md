# 05 — Candlestick Chart (Canvas 2D)

Реализуй интерактивный свечной график **только на HTML5 Canvas 2D**. Константы — из [appendix-a-defaults.md](appendix-a-defaults.md). Запрещены Chart.js, D3, Plotly, Lightweight Charts и аналоги.

---

## 5.1 Файлы

| Файл | Назначение |
|------|------------|
| `components/trading-chart/trading-chart.component.ts` | Host, inputs/signals, pointer/wheel handlers, rAF draw schedule |
| `components/trading-chart/trading-chart.component.html` | `<canvas>` + optional HUD overlay (last price / interval) |
| `components/trading-chart/trading-chart.component.scss` | full-size chart panel, dark canvas bg |
| `components/trading-chart/trading-chart.renderer.ts` | Чистые функции отрисовки кадра (grid, candles, volume, crosshair) |
| `domain/market/candle-aggregator.ts` | OHLC aggregation (уже из 04) |

Допустимо держать renderer methods внутри component файла, **но** чеклист ожидает `trading-chart.renderer.ts` — создай его.

---

## 5.2 Данные

Компонент читает через `inject(TradingEngineService)`:
- `selectedAssetId`
- `candles()[assetId]` для текущего `candleIntervalSec` **или** отдельный computed `activeCandles`
- `prices()[assetId]` для last price badge

Локальные signals:
```ts
offsetCandles = signal(0)        // 0 = прилипли к правому краю (live)
candlesVisible = signal(60)      // zoom
isPanning = signal(false)
panStartX = signal(0)
panStartOffset = signal(0)
cursorX = signal<number | null>(null)
cursorY = signal<number | null>(null)
cssWidth / cssHeight / dpr
```

При смене актива или interval: `offsetCandles.set(0)` (вернуться к live tip).

---

## 5.3 Candle aggregation (напоминание)

`candle-aggregator`:
1. Bucket key = `floor(tick.time / (intervalSec * 1000)) * intervalSec * 1000`.
2. Если новый bucket — push candle `{open=high=low=close=price, volume}`.
3. Иначе обнови: `high=max`, `low=min`, `close=price`, `volume+=tick.volume`.
4. Веди отдельные массивы для 5s и 15s.
5. Trim до `MAX_CANDLES`.

Volume тика синтетический > 0; user fill добавляет свой qty.

---

## 5.4 Layout внутри canvas

Вертикальные зоны (в пикселях canvas):

```
┌─────────────────────────────────────────────┐
│  padding / top HUD (last, change%)          │  ~24–32px
├─────────────────────────────────────────────┤
│                                             │
│           PRICE / CANDLES AREA              │  ~70% remaining
│                                             │
├─────────────────────────────────────────────┤
│           VOLUME HISTOGRAM                  │  ~22% remaining
├─────────────────────────────────────────────┤
│           TIME AXIS LABELS                  │  ~18–22px
└─────────────────────────────────────────────┘
  price axis labels on the RIGHT (~56px)
```

- Right price axis: внутри canvas, моноширинные labels.
- Bottom time axis: labels каждые N свечей.
- Не используй HTML axis как обязательный (допустим HUD поверх canvas через CSS для last price).

---

## 5.5 Viewport & transforms

Пусть `all = candles` (array oldest → newest).

```
visible = clamp(candlesVisible, MIN_VISIBLE, MAX_VISIBLE)
offset = clamp(offsetCandles, 0, max(0, all.length - visible))
start = max(0, all.length - visible - offset)
end = min(all.length, start + visible)
slice = all.slice(start, end)
```

- `offset === 0` → live mode (правый край = последняя свеча).
- Новые свечи при `offset === 0` сами «едут»; при `offset > 0` история стабильна (offset можно не автоинкрементить — **канон:** при live stick справа; при pan назад offset сохраняется).

Масштаб цены:
```
minLow = min(slice.low) * (1 - PRICE_PADDING)
maxHigh = max(slice.high) * (1 + PRICE_PADDING)
y = map(price, minLow, maxHigh, candleAreaBottom, candleAreaTop)
```

Масштаб X:
```
candleSlotW = candleAreaWidth / slice.length
xCenter(i) = leftPad + i * candleSlotW + candleSlotW/2
bodyW = max(1, candleSlotW * BODY_WIDTH_RATIO)
```

---

## 5.6 Отрисовка кадра (полный pipeline)

`draw(ctx, frame)` **целиком** каждый раз (не dirty-partial без clear):

1. **Resize sync:** `canvas.width = cssW * dpr`, `height = cssH * dpr`, `ctx.setTransform(dpr,0,0,dpr,0,0)`.
2. Clear → fill `--qt-bg-chart`.
3. Draw horizontal grid (price) + vertical grid (time).
4. Draw volume bars in volume area:
   - color up/down by `close >= open` → `--qt-up` / `--qt-down` с alpha.
   - height ∝ `volume / maxVolume`.
5. Draw candles in price area:
   - Wick: line `high→low` at xCenter, stroke up/down color.
   - Body: rect from open→close; если `close >= open` fill up, else fill down.
   - Doji (`open ≈ close`): минимум 1px body.
6. Draw last price dashed line across chart + label on price axis (accent).
7. Draw price axis labels (right) and time labels (bottom).
8. If cursor inside: crosshair (vertical + horizontal) + HUD box (OHLC + volume of hovered candle).
9. Optional: watermark «QuantumTrade» очень тусклый — не обязателен.

Цвета бери из CSS variables через `getComputedStyle` **или** захардкоженные hex, синхронные с темой документа 01 (`#00c853` / `#ff3b5c`). При theme toggle — перерисовать.

---

## 5.7 Pan

1. `pointerdown` (primary button) на canvas → `isPanning=true`, store startX + startOffset; `setPointerCapture`.
2. `pointermove` → `deltaCandles = round((x - startX) / candleSlotW)` → `offset = clamp(startOffset + deltaCandles, ...)`.
   - Drag вправо → смотреть более старую историю → offset увеличивается.
3. `pointerup` / `pointercancel` → end pan.
4. Не начинай pan, если клик был на UI overlay buttons.

---

## 5.8 Zoom (wheel)

1. `wheel` + `preventDefault` на chart host.
2. `deltaY < 0` → zoom in: `candlesVisible -= ZOOM_STEP` (меньше свечей).
3. `deltaY > 0` → zoom out: `candlesVisible += ZOOM_STEP`.
4. Clamp `MIN_VISIBLE_CANDLES`…`MAX_VISIBLE_CANDLES` (Appendix A: 20…180).
5. Zoom относительно курсора (желательно): скорректируй offset так, чтобы цена/время под курсором остались стабильными. Минимум — zoom к правому краю; **канон: zoom к курсору**, если реализуемо без багов; иначе zoom-to-right с комментарием-обоснованием недопустим как TODO — сделай zoom-to-right полностью корректно как fallback канона пакета: **канон зафиксирован: zoom-to-right edge** (проще и стабильно).

---

## 5.9 Resize

`ResizeObserver` на host → обновить css sizes → schedule draw.  
Не теряй pan/zoom state.

---

## 5.10 Когда перерисовывать

- Новый tick / смена candles signal (`effect` или clock callback).
- Pan / zoom / pointer move (crosshair).
- Resize / theme change / asset / interval change.

Используй `requestAnimationFrame` coalescing: несколько событий → один draw за кадр.

---

## 5.11 Accessibility & empty states

- `role="img"` + `aria-label` через i18n: актив, last price, interval.
- Если свечей 0: нарисуй empty grid + текст «Ожидание тиков…» (i18n) в центре canvas.
- Help описывает pan/zoom.

---

## 5.12 Запрещено

- Внешние chart libraries.
- Рисовать свечи через DOM div’ы вместо canvas.
- Пропускать volume histogram.
- Игнорировать HiDPI (`devicePixelRatio`).
- Ломать анимацию всего UI из-за тяжёлого sync layout в draw (не читай layout thrash каждый пиксель).
