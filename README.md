## Live demo

https://hafizovs.github.io/quantum-trade/

# QuantumTrade

Exchange and candlestick simulator on Angular 22+ (zoneless, Signals, Canvas 2D).

## About

QuantumTrade is an exchange and Japanese-candlestick simulator on Angular 22+ (zoneless, Signals, Canvas 2D). Prices follow geometric Brownian motion with news shocks every 30–45 seconds. You trade BTC/USD, ETH/USD, and CORE-AI with market or limit orders, long or short, and leverage from 1× to 20×, including liquidation.

## Capabilities

- Geometric Brownian Motion plus news shocks (30–45 s)
- Assets: BTC/USD, ETH/USD, CORE-AI
- Market / limit, long / short, leverage 1×–20×, liquidation
- Live order book, time and sales, and a candlestick chart with pan and zoom
- RU/EN, theme toggle, and hotkeys

## Functionality

- Select BTC, ETH, or CORE-AI with `1`, `2`, or `3`
- Send a market long (`B`) or market short (`S`), toggle market and limit with `L`, and change leverage by 1 with `+` / `-`
- Watch the order book, the time and sales tape, and the candlestick chart (pan and zoom)
- Toggle theme (`T`) and language (`G`), open help (`H`), fully reset with `R`, and close help with Esc

## Features

- Geometric Brownian Motion + news shocks (30–45 s)
- Assets: BTC/USD, ETH/USD, CORE-AI
- Market / Limit, Long / Short, leverage 1×–20×, liquidation
- Live order book, Time & Sales, candlestick chart (pan/zoom)
- i18n RU/EN, theme toggle, hotkeys

Specification: [`../docs`](../docs)

## Start

```bash
npm install
npm start
```

Open http://localhost:4200/

## Tests

```bash
npm test
```

## Hotkeys

| Key | Action |
|---------|----------|
| `1` / `2` / `3` | BTC / ETH / CORE-AI |
| `B` / `S` | Market Long / Short |
| `L` | Market ↔ Limit |
| `+` / `-` | Leverage ±1 |
| `T` | Theme |
| `G` | Language RU↔EN |
| `H` | Help |
| `R` | Full reset |
| `Esc` | Close help |
