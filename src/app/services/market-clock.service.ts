import { Injectable, inject } from '@angular/core';
import {
  MAX_CATCH_UP_TICKS,
  TICK_INTERVAL_MS,
} from '../core/constants/market.constants';
import { TradingEngineService } from './trading-engine.service';

@Injectable({ providedIn: 'root' })
export class MarketClockService {
  private readonly engine = inject(TradingEngineService);

  private rafId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private lastTs = 0;
  private elapsed = 0;
  private running = false;

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.generation += 1;
    this.lastTs = 0;
    this.elapsed = 0;
    this.engine.markRunning(true);
    this.schedule(this.generation);
  }

  stop(): void {
    this.running = false;
    this.generation += 1;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.engine.markRunning(false);
  }

  private schedule(gen: number): void {
    if (!this.running || gen !== this.generation) {
      return;
    }

    if (typeof document !== 'undefined' && document.hidden) {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        this.pulse(performance.now(), gen);
        this.schedule(gen);
      }, TICK_INTERVAL_MS);
      return;
    }

    this.rafId = requestAnimationFrame((ts) => {
      this.rafId = null;
      this.pulse(ts, gen);
      this.schedule(gen);
    });
  }

  private pulse(ts: number, gen: number): void {
    if (!this.running || gen !== this.generation) {
      return;
    }
    if (this.lastTs === 0) {
      this.lastTs = ts;
      return;
    }
    const delta = ts - this.lastTs;
    this.lastTs = ts;
    this.elapsed += delta;

    let ticks = 0;
    while (this.elapsed >= TICK_INTERVAL_MS && ticks < MAX_CATCH_UP_TICKS) {
      this.elapsed -= TICK_INTERVAL_MS;
      this.engine.onTick(Date.now());
      ticks += 1;
    }
    if (this.elapsed >= TICK_INTERVAL_MS) {
      this.elapsed = this.elapsed % TICK_INTERVAL_MS;
    }
  }
}
