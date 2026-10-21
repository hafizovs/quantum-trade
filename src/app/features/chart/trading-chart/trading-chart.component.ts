import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {
  DEFAULT_CANDLES_VISIBLE,
  MAX_VISIBLE_CANDLES,
  MIN_VISIBLE_CANDLES,
  ZOOM_STEP_CANDLES,
} from '../../../core/constants/chart.constants';
import { I18nService } from '../../../core/i18n.service';
import { TradingEngineService } from '../trading-engine.service';
import { UiStore } from '../../../core/ui/ui.store';
import { drawChart, resolveChartColors } from './trading-chart.renderer';

@Component({
  selector: 'qt-trading-chart',
  imports: [],
  templateUrl: './trading-chart.component.html',
  styleUrl: './trading-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradingChartComponent implements OnInit {
  private readonly engine = inject(TradingEngineService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly offsetCandles = signal(0);
  readonly candlesVisible = signal(DEFAULT_CANDLES_VISIBLE);
  readonly crosshairX = signal<number | null>(null);
  readonly crosshairY = signal<number | null>(null);

  private panStartX = 0;
  private panStartOffset = 0;
  private isPanning = false;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private canvasWidth = 0;
  private canvasHeight = 0;

  readonly ariaLabel = () => {
    const asset = this.engine.selectedAsset();
    const price = this.engine.selectedPrice();
    const interval = this.engine.candleIntervalSec();
    return this.i18n.t('chart.aria', {
      asset: asset.symbol,
      price: price.toFixed(asset.pricePrecision),
      interval,
    });
  };

  constructor() {
    effect(() => {
      this.engine.activeCandles();
      this.engine.selectedPrice();
      this.engine.candleIntervalSec();
      this.engine.selectedAssetId();
      this.ui.theme();
      this.offsetCandles();
      this.candlesVisible();
      this.crosshairX();
      this.crosshairY();
      this.scheduleDraw();
    });
  }

  ngOnInit(): void {
    const canvas = this.canvasRef().nativeElement;
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
      }
    });
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.destroyRef.onDestroy(() => {
      canvas.removeEventListener('pointerdown', this.onPointerDown);
      canvas.removeEventListener('pointermove', this.onPointerMove);
      canvas.removeEventListener('pointerup', this.onPointerUp);
      canvas.removeEventListener('pointerleave', this.onPointerLeave);
      canvas.removeEventListener('wheel', this.onWheel);
    });
    this.onResize();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.isPanning = true;
    this.panStartX = event.clientX;
    this.panStartOffset = this.offsetCandles();
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.isPanning) {
      const layoutWidth = Math.max(1, rect.width - 64);
      const candleWidth = layoutWidth / this.candlesVisible();
      const deltaPx = event.clientX - this.panStartX;
      const deltaCandles = Math.round(deltaPx / Math.max(1, candleWidth));
      const total = this.engine.activeCandles().length;
      const maxOffset = Math.max(0, total - MIN_VISIBLE_CANDLES);
      const next = Math.min(maxOffset, Math.max(0, this.panStartOffset + deltaCandles));
      this.offsetCandles.set(next);
      return;
    }

    this.crosshairX.set(x);
    this.crosshairY.set(y);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.isPanning = false;
    (event.target as HTMLCanvasElement).releasePointerCapture(event.pointerId);
  };

  private readonly onPointerLeave = (): void => {
    this.isPanning = false;
    this.crosshairX.set(null);
    this.crosshairY.set(null);
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? ZOOM_STEP_CANDLES : -ZOOM_STEP_CANDLES;
    const next = Math.min(
      MAX_VISIBLE_CANDLES,
      Math.max(MIN_VISIBLE_CANDLES, this.candlesVisible() + delta),
    );
    this.candlesVisible.set(next);
    this.offsetCandles.set(0);
  };

  private onResize(): void {
    const host = this.host.nativeElement;
    this.canvasWidth = host.clientWidth;
    this.canvasHeight = host.clientHeight;
    this.scheduleDraw();
  }

  private scheduleDraw(): void {
    if (this.rafId !== null) {
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.draw();
    });
  }

  private draw(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const width = this.canvasWidth;
    const height = this.canvasHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const asset = this.engine.selectedAsset();
    const colors = resolveChartColors(this.ui.theme(), this.host.nativeElement);

    drawChart(ctx, {
      width,
      height,
      dpr,
      candles: this.engine.activeCandles(),
      lastPrice: this.engine.selectedPrice(),
      pricePrecision: asset.pricePrecision,
      offsetCandles: this.offsetCandles(),
      candlesVisible: this.candlesVisible(),
      crosshairX: this.crosshairX(),
      crosshairY: this.crosshairY(),
      theme: this.ui.theme(),
      emptyMessage: this.i18n.t('chart.waiting'),
      intervalSec: this.engine.candleIntervalSec(),
      assetSymbol: asset.symbol,
    }, colors);
  }
}
