## Live demo

https://hafizovs.github.io/quantum-trade/

# QuantumTrade

Симулятор биржи и японских свечей на Angular 22+ (zoneless, Signals, Canvas 2D).

## Возможности

- Geometric Brownian Motion + новостные шоки (30–45 с)
- Активы: BTC/USD, ETH/USD, CORE-AI
- Market / Limit, Long / Short, плечо 1×–20×, liquidation
- Живой order book, Time & Sales, свечной график (pan/zoom)
- i18n RU/EN, theme toggle, hotkeys

Спецификация: [`../docs`](../docs)

## Запуск

```bash
npm install
npm start
```

Откройте http://localhost:4200/

## Тесты

```bash
npm test
```

## Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `1` / `2` / `3` | BTC / ETH / CORE-AI |
| `B` / `S` | Market Long / Short |
| `L` | Market ↔ Limit |
| `+` / `-` | Плечо ±1 |
| `T` | Тема |
| `G` | Язык RU↔EN |
| `H` | Справка |
| `R` | Полный сброс |
| `Esc` | Закрыть справку |
