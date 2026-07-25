import { MAX_CANDLES } from '../../core/constants/market.constants';
import type { CandleIntervalSec } from '../../core/models/candle-interval.model';
import type { AssetId, Candle, PriceTick } from '../../models/trading.types';

export function bucketStart(time: number, intervalSec: CandleIntervalSec): number {
  const ms = intervalSec * 1000;
  return Math.floor(time / ms) * ms;
}

export class CandleAggregator {
  private readonly buffers: Record<
    AssetId,
    Record<CandleIntervalSec, Candle[]>
  > = {
    BTCUSD: { 5: [], 15: [] },
    ETHUSD: { 5: [], 15: [] },
    COREAI: { 5: [], 15: [] },
  };

  reset(): void {
    for (const id of Object.keys(this.buffers) as AssetId[]) {
      this.buffers[id][5] = [];
      this.buffers[id][15] = [];
    }
  }

  getCandles(assetId: AssetId, intervalSec: CandleIntervalSec): Candle[] {
    return this.buffers[assetId][intervalSec];
  }

  snapshot(): Record<AssetId, Record<CandleIntervalSec, Candle[]>> {
    return {
      BTCUSD: {
        5: [...this.buffers.BTCUSD[5]],
        15: [...this.buffers.BTCUSD[15]],
      },
      ETHUSD: {
        5: [...this.buffers.ETHUSD[5]],
        15: [...this.buffers.ETHUSD[15]],
      },
      COREAI: {
        5: [...this.buffers.COREAI[5]],
        15: [...this.buffers.COREAI[15]],
      },
    };
  }

  onTick(tick: PriceTick): void {
    this.pushInterval(tick, 5);
    this.pushInterval(tick, 15);
  }

  addVolume(assetId: AssetId, time: number, volume: number): void {
    this.addVolumeInterval(assetId, time, volume, 5);
    this.addVolumeInterval(assetId, time, volume, 15);
  }

  private pushInterval(tick: PriceTick, intervalSec: CandleIntervalSec): void {
    const list = this.buffers[tick.assetId][intervalSec];
    const key = bucketStart(tick.time, intervalSec);
    const last = list.length > 0 ? list[list.length - 1] : null;

    if (!last || last.openTime !== key) {
      list.push({
        assetId: tick.assetId,
        intervalSec,
        openTime: key,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.volume,
      });
      this.trim(list);
      return;
    }

    last.high = Math.max(last.high, tick.price);
    last.low = Math.min(last.low, tick.price);
    last.close = tick.price;
    last.volume += tick.volume;
  }

  private addVolumeInterval(
    assetId: AssetId,
    time: number,
    volume: number,
    intervalSec: CandleIntervalSec,
  ): void {
    const list = this.buffers[assetId][intervalSec];
    const key = bucketStart(time, intervalSec);
    const last = list.length > 0 ? list[list.length - 1] : null;
    if (last && last.openTime === key) {
      last.volume += volume;
    }
  }

  private trim(list: Candle[]): void {
    while (list.length > MAX_CANDLES) {
      list.shift();
    }
  }
}
