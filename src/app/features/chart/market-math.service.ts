import { Injectable } from '@angular/core';
import { MIN_PRICE } from '../../core/constants/market.constants';
import {
  floorToLot,
  gbmStep,
  qtyFromNotional,
  roundToTick,
} from '../../domain/market/gbm';
import { sampleNormal } from '../../domain/math/normal';
import type { RandomSource } from '../../domain/math/rng';
import {
  liquidationPrice,
  requiredMargin,
  unrealizedPnl,
} from '../../domain/portfolio/margin';
import type { PositionSide } from '../../core/models/trading.types';

@Injectable({ providedIn: 'root' })
export class MarketMathService {
  gbmStep(
    price: number,
    mu: number,
    sigma: number,
    dt: number,
    z: number,
  ): number {
    return gbmStep(price, mu, sigma, dt, z);
  }

  nextPrice(
    price: number,
    mu: number,
    sigma: number,
    dt: number,
    z: number,
    tickSize: number,
  ): number {
    let next = gbmStep(price, mu, sigma, dt, z);
    next = Math.max(next, MIN_PRICE);
    next = roundToTick(next, tickSize);
    return Math.max(next, MIN_PRICE);
  }

  sampleNormal(rng: RandomSource): number {
    return sampleNormal(() => rng.next());
  }

  requiredMargin(notionalUsd: number, leverage: number): number {
    return requiredMargin(notionalUsd, leverage);
  }

  liquidationPrice(
    side: PositionSide,
    entry: number,
    leverage: number,
  ): number {
    return liquidationPrice(side, entry, leverage);
  }

  unrealizedPnl(
    side: PositionSide,
    entry: number,
    mark: number,
    qty: number,
  ): number {
    return unrealizedPnl(side, entry, mark, qty);
  }

  qtyFromNotional(
    notionalUsd: number,
    price: number,
    lotSize: number,
  ): number {
    return qtyFromNotional(notionalUsd, price, lotSize);
  }

  roundToTick(price: number, tickSize: number): number {
    return roundToTick(price, tickSize);
  }

  floorToLot(qty: number, lotSize: number): number {
    return floorToLot(qty, lotSize);
  }
}
