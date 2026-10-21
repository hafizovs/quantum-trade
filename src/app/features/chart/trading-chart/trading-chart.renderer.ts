import {
  BODY_WIDTH_RATIO,
  CHART_BOTTOM_AXIS_PX,
  CHART_RIGHT_AXIS_PX,
  CHART_TOP_HUD_PX,
  PRICE_PADDING_RATIO,
  VOLUME_AREA_RATIO,
} from '../../../core/constants/chart.constants';
import type { Candle } from '../../../core/models/trading.types';

export interface ChartColors {
  bg: string;
  grid: string;
  text: string;
  textMuted: string;
  bull: string;
  bear: string;
  volumeBull: string;
  volumeBear: string;
  lastLine: string;
  crosshair: string;
  wick: string;
}

export interface ChartFrame {
  width: number;
  height: number;
  dpr: number;
  candles: readonly Candle[];
  lastPrice: number;
  pricePrecision: number;
  offsetCandles: number;
  candlesVisible: number;
  crosshairX: number | null;
  crosshairY: number | null;
  theme: 'dark' | 'light';
  emptyMessage: string;
  intervalSec: number;
  assetSymbol: string;
}

export interface ChartLayout {
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;
  priceHeight: number;
  volumeHeight: number;
  candleWidth: number;
  visible: Candle[];
  priceMin: number;
  priceMax: number;
  maxVolume: number;
}

const FALLBACK_COLORS: ChartColors = {
  bg: '#0a0e14',
  grid: 'rgba(255,255,255,0.06)',
  text: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.45)',
  bull: '#00c853',
  bear: '#ff3b5c',
  volumeBull: 'rgba(0,200,83,0.35)',
  volumeBear: 'rgba(255,59,92,0.35)',
  lastLine: 'rgba(255,255,255,0.55)',
  crosshair: 'rgba(255,255,255,0.25)',
  wick: 'rgba(255,255,255,0.55)',
};

export function resolveChartColors(
  theme: 'dark' | 'light',
  root?: HTMLElement | null,
): ChartColors {
  const el = root ?? (typeof document !== 'undefined' ? document.documentElement : null);
  const read = (name: string, fallback: string): string => {
    if (!el) {
      return fallback;
    }
    const value = getComputedStyle(el).getPropertyValue(name).trim();
    return value || fallback;
  };

  const isDark = theme === 'dark';
  return {
    bg: read('--qt-chart-bg', isDark ? '#0a0e14' : '#f4f6f8'),
    grid: read('--qt-chart-grid', isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'),
    text: read('--qt-text', isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.78)'),
    textMuted: read(
      '--qt-text-muted',
      isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
    ),
    bull: read('--qt-bull', '#00c853'),
    bear: read('--qt-bear', '#ff3b5c'),
    volumeBull: read('--qt-volume-bull', 'rgba(0,200,83,0.35)'),
    volumeBear: read('--qt-volume-bear', 'rgba(255,59,92,0.35)'),
    lastLine: read('--qt-last-line', isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'),
    crosshair: read('--qt-crosshair', isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'),
    wick: read('--qt-wick', isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'),
  };
}

export function computeChartLayout(frame: ChartFrame): ChartLayout {
  const plotLeft = 8;
  const plotTop = CHART_TOP_HUD_PX;
  const plotWidth = Math.max(0, frame.width - plotLeft - CHART_RIGHT_AXIS_PX);
  const plotHeight = Math.max(0, frame.height - plotTop - CHART_BOTTOM_AXIS_PX);
  const volumeHeight = plotHeight * VOLUME_AREA_RATIO;
  const priceHeight = plotHeight - volumeHeight;
  const candleWidth = frame.candlesVisible > 0 ? plotWidth / frame.candlesVisible : plotWidth;

  const total = frame.candles.length;
  const end = Math.max(0, total - frame.offsetCandles);
  const start = Math.max(0, end - frame.candlesVisible);
  const visible = frame.candles.slice(start, end);

  let priceMin = Number.POSITIVE_INFINITY;
  let priceMax = Number.NEGATIVE_INFINITY;
  let maxVolume = 0;

  for (const c of visible) {
    priceMin = Math.min(priceMin, c.low);
    priceMax = Math.max(priceMax, c.high);
    maxVolume = Math.max(maxVolume, c.volume);
  }

  if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax)) {
    const ref = frame.lastPrice > 0 ? frame.lastPrice : 1;
    priceMin = ref * (1 - PRICE_PADDING_RATIO);
    priceMax = ref * (1 + PRICE_PADDING_RATIO);
  } else {
    const span = Math.max(priceMax - priceMin, refSpan(frame.lastPrice));
    const pad = span * PRICE_PADDING_RATIO;
    priceMin -= pad;
    priceMax += pad;
  }

  if (maxVolume <= 0) {
    maxVolume = 1;
  }

  return {
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    priceHeight,
    volumeHeight,
    candleWidth,
    visible,
    priceMin,
    priceMax,
    maxVolume,
  };
}

function refSpan(lastPrice: number): number {
  return Math.max(lastPrice * 0.002, 0.0001);
}

function priceToY(price: number, layout: ChartLayout): number {
  const { priceMin, priceMax, priceHeight, plotTop } = layout;
  const ratio = (price - priceMin) / (priceMax - priceMin);
  return plotTop + priceHeight * (1 - ratio);
}

function formatAxisPrice(price: number, precision: number): string {
  return price.toFixed(precision);
}

export function drawChart(
  ctx: CanvasRenderingContext2D,
  frame: ChartFrame,
  colors: ChartColors = FALLBACK_COLORS,
): void {
  const { width, height, dpr } = frame;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  const layout = computeChartLayout(frame);

  drawHud(ctx, frame, layout, colors);

  if (layout.visible.length === 0) {
    drawEmptyState(ctx, frame, layout, colors);
    drawCrosshair(ctx, frame, layout, colors);
    ctx.restore();
    return;
  }

  drawPriceGrid(ctx, layout, colors, frame.pricePrecision);
  drawCandles(ctx, layout, colors);
  drawVolume(ctx, layout, colors);
  drawLastPriceLine(ctx, frame, layout, colors);
  drawCrosshair(ctx, frame, layout, colors);

  ctx.restore();
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  frame: ChartFrame,
  layout: ChartLayout,
  colors: ChartColors,
): void {
  ctx.fillStyle = colors.text;
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `${frame.assetSymbol} · ${frame.intervalSec}s · ${layout.visible.length}/${frame.candles.length}`,
    layout.plotLeft,
    8,
  );
}

function drawEmptyState(
  ctx: CanvasRenderingContext2D,
  frame: ChartFrame,
  layout: ChartLayout,
  colors: ChartColors,
): void {
  ctx.fillStyle = colors.textMuted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    frame.emptyMessage,
    layout.plotLeft + layout.plotWidth / 2,
    layout.plotTop + layout.plotHeight / 2,
  );
}

function drawPriceGrid(
  ctx: CanvasRenderingContext2D,
  layout: ChartLayout,
  colors: ChartColors,
  precision: number,
): void {
  const rows = 5;
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.textMuted;
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= rows; i += 1) {
    const ratio = i / rows;
    const y = layout.plotTop + layout.priceHeight * ratio;
    const price =
      layout.priceMax - (layout.priceMax - layout.priceMin) * ratio;

    ctx.beginPath();
    ctx.moveTo(layout.plotLeft, y);
    ctx.lineTo(layout.plotLeft + layout.plotWidth, y);
    ctx.stroke();

    ctx.fillText(
      formatAxisPrice(price, precision),
      layout.plotLeft + layout.plotWidth + 6,
      y,
    );
  }
}

function drawCandles(
  ctx: CanvasRenderingContext2D,
  layout: ChartLayout,
  colors: ChartColors,
): void {
  const bodyWidth = Math.max(1, layout.candleWidth * BODY_WIDTH_RATIO);

  layout.visible.forEach((candle, index) => {
    const cx = layout.plotLeft + index * layout.candleWidth + layout.candleWidth / 2;
    const openY = priceToY(candle.open, layout);
    const closeY = priceToY(candle.close, layout);
    const highY = priceToY(candle.high, layout);
    const lowY = priceToY(candle.low, layout);
    const bullish = candle.close >= candle.open;
    const color = bullish ? colors.bull : colors.bear;

    ctx.strokeStyle = colors.wick;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, highY);
    ctx.lineTo(cx, lowY);
    ctx.stroke();

    const top = Math.min(openY, closeY);
    const bodyHeight = Math.max(1, Math.abs(closeY - openY));
    ctx.fillStyle = color;
    ctx.fillRect(cx - bodyWidth / 2, top, bodyWidth, bodyHeight);
  });
}

function drawVolume(
  ctx: CanvasRenderingContext2D,
  layout: ChartLayout,
  colors: ChartColors,
): void {
  const volumeTop = layout.plotTop + layout.priceHeight;
  const barWidth = Math.max(1, layout.candleWidth * BODY_WIDTH_RATIO);

  layout.visible.forEach((candle, index) => {
    const cx = layout.plotLeft + index * layout.candleWidth + layout.candleWidth / 2;
    const ratio = candle.volume / layout.maxVolume;
    const barHeight = layout.volumeHeight * ratio;
    const bullish = candle.close >= candle.open;
    ctx.fillStyle = bullish ? colors.volumeBull : colors.volumeBear;
    ctx.fillRect(
      cx - barWidth / 2,
      volumeTop + layout.volumeHeight - barHeight,
      barWidth,
      barHeight,
    );
  });

  ctx.strokeStyle = colors.grid;
  ctx.beginPath();
  ctx.moveTo(layout.plotLeft, volumeTop);
  ctx.lineTo(layout.plotLeft + layout.plotWidth, volumeTop);
  ctx.stroke();
}

function drawLastPriceLine(
  ctx: CanvasRenderingContext2D,
  frame: ChartFrame,
  layout: ChartLayout,
  colors: ChartColors,
): void {
  if (frame.lastPrice <= 0) {
    return;
  }
  const y = priceToY(frame.lastPrice, layout);
  if (y < layout.plotTop || y > layout.plotTop + layout.priceHeight) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = colors.lastLine;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(layout.plotLeft, y);
  ctx.lineTo(layout.plotLeft + layout.plotWidth, y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = colors.lastLine;
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    formatAxisPrice(frame.lastPrice, frame.pricePrecision),
    layout.plotLeft + layout.plotWidth + 6,
    y,
  );
  ctx.restore();
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  frame: ChartFrame,
  layout: ChartLayout,
  colors: ChartColors,
): void {
  const { crosshairX, crosshairY } = frame;
  if (crosshairX === null || crosshairY === null) {
    return;
  }
  if (
    crosshairX < layout.plotLeft ||
    crosshairX > layout.plotLeft + layout.plotWidth ||
    crosshairY < layout.plotTop ||
    crosshairY > layout.plotTop + layout.plotHeight
  ) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = colors.crosshair;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(layout.plotLeft, crosshairY);
  ctx.lineTo(layout.plotLeft + layout.plotWidth, crosshairY);
  ctx.moveTo(crosshairX, layout.plotTop);
  ctx.lineTo(crosshairX, layout.plotTop + layout.plotHeight);
  ctx.stroke();

  const priceRatio = 1 - (crosshairY - layout.plotTop) / layout.priceHeight;
  const hoverPrice =
    layout.priceMin + (layout.priceMax - layout.priceMin) * priceRatio;

  ctx.fillStyle = colors.text;
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    formatAxisPrice(hoverPrice, frame.pricePrecision),
    layout.plotLeft + layout.plotWidth - 4,
    crosshairY - 4,
  );
  ctx.restore();
}
