# Appendix A — Defaults, Ranges & Seed Data

Справочник чисел. Реализации копируют значения в `core/constants/*` **без округления «на глаз»**.

---

## A.1 Симуляция / clock

| Константа | Значение |
|-----------|----------|
| `TICK_INTERVAL_MS` | 1000 |
| `TICK_DT_SEC` | 1 |
| `MAX_CATCH_UP_TICKS` | 3 |
| `MIN_PRICE` | 0.0001 |
| `MIN_VOLATILITY` | 0.00005 |
| `MAX_VOLATILITY` | 0.05 |
| `DEFAULT_RNG_SEED` | 42 |
| `MAX_TICK_HISTORY` | 2000 |
| `MAX_CANDLES` | 500 |
| `MAX_NEWS` | 40 |
| `MAX_TAPE` | 200 |
| `MAX_TAPE_VIEW` | 80 |
| `MAX_LEDGER` | 200 |

---

## A.2 Активы (seed)

### BTCUSD — BTC/USD

| Field | Value |
|-------|-------|
| symbol | `BTC/USD` |
| base / quote | `BTC` / `USD` |
| basePrice | 67500 |
| pricePrecision | 2 |
| qtyPrecision | 6 |
| tickSize | 0.5 |
| lotSize | 0.000001 |
| baseDrift (μ per second) | 0.000002 |
| baseVolatility (σ per second) | 0.0018 |

### ETHUSD — ETH/USD

| Field | Value |
|-------|-------|
| symbol | `ETH/USD` |
| base / quote | `ETH` / `USD` |
| basePrice | 3450 |
| pricePrecision | 2 |
| qtyPrecision | 5 |
| tickSize | 0.05 |
| lotSize | 0.00001 |
| baseDrift | 0.0000025 |
| baseVolatility | 0.0022 |

### COREAI — CORE-AI

| Field | Value |
|-------|-------|
| symbol | `CORE-AI` |
| base / quote | `CORE` / `USD` |
| basePrice | 128.5 |
| pricePrecision | 2 |
| qtyPrecision | 4 |
| tickSize | 0.01 |
| lotSize | 0.0001 |
| baseDrift | 0.000004 |
| baseVolatility | 0.0035 |

На старте `drift = baseDrift`, `volatility = baseVolatility` для каждого актива.

---

## A.3 Order book

| Константа | Значение |
|-----------|----------|
| `ORDER_BOOK_LEVELS` | 12 |
| `BASE_SPREAD_TICKS` | 2 |
| `LEVEL_STEP_TICKS` | 2 |
| `BASE_LEVEL_SIZE_BTC` | 0.35 |
| `BASE_LEVEL_SIZE_ETH` | 4.2 |
| `BASE_LEVEL_SIZE_CORE` | 85 |
| `LEVEL_SIZE_GROWTH` | 1.08 |
| `LEVEL_SIZE_NOISE` | 0.15 |

`spread = BASE_SPREAD_TICKS * tickSize` (симметрично вокруг mid).

Synthetic tick volume ranges (uniform):

| Asset | min | max |
|-------|-----|-----|
| BTCUSD | 0.01 | 0.8 |
| ETHUSD | 0.2 | 12 |
| COREAI | 5 | 220 |

---

## A.4 Portfolio / leverage

| Константа | Значение |
|-----------|----------|
| `INITIAL_CASH_USD` | 100000 |
| `MIN_LEVERAGE` | 1 |
| `MAX_LEVERAGE` | 20 |
| `DEFAULT_LEVERAGE` | 5 |
| `MIN_NOTIONAL_USD` | 50 |
| `DEFAULT_NOTIONAL_USD` | 1000 |
| `MAINTENANCE_MARGIN_RATE` | 0.005 |
| `TAKER_FEE_BPS` | 0 |
| `MAKER_FEE_BPS` | 0 |

---

## A.5 News shocks

| Константа | Значение |
|-----------|----------|
| `NEWS_MIN_MS` | 30000 |
| `NEWS_MAX_MS` | 45000 |
| `DEFAULT_SHOCK_DURATION_MS` | 20000 |
| `BULLISH_DRIFT_DELTA` | +0.00035 |
| `BEARISH_DRIFT_DELTA` | −0.00035 |
| `SHOCK_VOL_DELTA` | +0.0012 |

### Пул новостей (минимум 8; скопируй все)

| id | sentiment | assetId | headlineRu | headlineEn | driftDelta | volDelta |
|----|-----------|---------|------------|------------|------------|----------|
| n1 | bullish | COREAI | Регулятор одобрил AI-протокол | Regulator approved AI protocol | +0.00045 | +0.0015 |
| n2 | bearish | ALL | Крупный взлом моста | Major bridge exploit | −0.0004 | +0.0018 |
| n3 | bullish | BTCUSD | ETF зафиксировал приток капитала | ETF recorded capital inflows | +0.0003 | +0.001 |
| n4 | bearish | BTCUSD | Киты начали разгрузку на споте | Whales dumping on spot | −0.00032 | +0.0012 |
| n5 | bullish | ETHUSD | Успешный апгрейд сети | Successful network upgrade | +0.00034 | +0.0011 |
| n6 | bearish | ETHUSD | Газ вырос до экстремума | Gas fees spiked to extremes | −0.00028 | +0.001 |
| n7 | bullish | ALL | ФРС сигнализирует мягкую политику | Fed signals dovish policy | +0.00025 | +0.0009 |
| n8 | bearish | COREAI | Утечка модели CORE-AI | CORE-AI model leak reported | −0.0005 | +0.002 |
| n9 | neutral | ALL | Волатильность ожидается повышенной | Elevated volatility expected | 0 | +0.0016 |
| n10 | bullish | ALL | Институционалы увеличили экспозицию | Institutions increased exposure | +0.00022 | +0.0008 |

`durationMs` для всех по умолчанию `DEFAULT_SHOCK_DURATION_MS`, если не указано иное.

---

## A.6 Chart

| Константа | Значение |
|-----------|----------|
| `DEFAULT_CANDLE_INTERVAL_SEC` | 5 |
| `ALT_CANDLE_INTERVAL_SEC` | 15 |
| `DEFAULT_CANDLES_VISIBLE` | 60 |
| `MIN_VISIBLE_CANDLES` | 20 |
| `MAX_VISIBLE_CANDLES` | 180 |
| `ZOOM_STEP_CANDLES` | 4 |
| `PRICE_PADDING_RATIO` | 0.04 |
| `BODY_WIDTH_RATIO` | 0.62 |
| `CHART_RIGHT_AXIS_PX` | 56 |
| `CHART_BOTTOM_AXIS_PX` | 20 |
| `CHART_TOP_HUD_PX` | 28 |
| `VOLUME_AREA_RATIO` | 0.22 |

---

## A.7 UI

| Константа | Значение |
|-----------|----------|
| `TOAST_TTL_INFO_MS` | 2500 |
| `TOAST_TTL_SUCCESS_MS` | 2500 |
| `TOAST_TTL_WARNING_MS` | 3500 |
| `TOAST_TTL_DANGER_MS` | 6000 |
| `TOAST_MAX_VISIBLE` | 4 |
| `TRADE_PANEL_WIDTH_PX` | 280 |
| `RIGHT_COLUMN_WIDTH_PX` | 300 |
| `POSITIONS_PANEL_HEIGHT_PX` | 200 |
| `FLASH_MS` | 180 |

---

## A.8 Hotkeys (сводка)

См. [01-product-vision.md](01-product-vision.md) §1.5 — реализуй все строки таблицы.

| Key | Action |
|-----|--------|
| `1` | BTCUSD |
| `2` | ETHUSD |
| `3` | COREAI |
| `B` | Market Long submit |
| `S` | Market Short submit |
| `L` | Toggle Market/Limit |
| `=` / `+` | leverage +1 |
| `-` | leverage −1 |
| `T` | theme |
| `G` | locale |
| `H` | help |
| `R` | reset |
| `Esc` | close help / blur |

---

## A.9 Formatting

| Asset | price format example | qty example |
|-------|----------------------|-------------|
| BTCUSD | `67,500.00` | `0.014832` |
| ETHUSD | `3,450.00` | `0.28940` |
| COREAI | `128.50` | `7.8200` |

Используй `Intl.NumberFormat` с locale UI для тысяч; price/qty precision — из актива.
