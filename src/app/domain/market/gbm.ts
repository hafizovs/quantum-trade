/**
 * Discrete Geometric Brownian Motion step:
 * S' = S * exp((μ - ½σ²)Δt + σ√Δt · Z)
 */
export function gbmStep(
  price: number,
  mu: number,
  sigma: number,
  dt: number,
  z: number,
): number {
  const driftTerm = (mu - 0.5 * sigma * sigma) * dt;
  const diffusionTerm = sigma * Math.sqrt(dt) * z;
  return price * Math.exp(driftTerm + diffusionTerm);
}

export function roundToTick(price: number, tickSize: number): number {
  if (tickSize <= 0) {
    return price;
  }
  return Math.round(price / tickSize) * tickSize;
}

export function floorToLot(qty: number, lotSize: number): number {
  if (lotSize <= 0) {
    return qty;
  }
  return Math.floor(qty / lotSize + 1e-12) * lotSize;
}

export function qtyFromNotional(
  notionalUsd: number,
  price: number,
  lotSize: number,
): number {
  if (price <= 0) {
    return 0;
  }
  return floorToLot(notionalUsd / price, lotSize);
}
