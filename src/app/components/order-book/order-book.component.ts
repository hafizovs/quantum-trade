import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FLASH_MS } from '../../core/constants/ui.constants';
import { I18nService } from '../../services/i18n.service';
import { TradingEngineService } from '../../services/trading-engine.service';
import { UiStore } from '../../state/ui.store';
import { formatPrice, formatQty } from '../../utils/format.util';

@Component({
  selector: 'qt-order-book',
  imports: [],
  templateUrl: './order-book.component.html',
  styleUrl: './order-book.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderBookComponent {
  private readonly engine = inject(TradingEngineService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);

  readonly locale = this.ui.locale;
  readonly asset = this.engine.selectedAsset;
  readonly book = this.engine.selectedBook;

  readonly flashing = signal(false);

  readonly asksReversed = computed(() => {
    const asks = this.book()?.asks ?? [];
    return [...asks].reverse();
  });

  readonly maxAskDepth = computed(() =>
    Math.max(...(this.book()?.asks.map((a) => a.size) ?? [1]), 1),
  );

  readonly maxBidDepth = computed(() =>
    Math.max(...(this.book()?.bids.map((b) => b.size) ?? [1]), 1),
  );

  constructor() {
    effect((onCleanup) => {
      this.book()?.updatedAt;
      this.flashing.set(true);
      const timer = setTimeout(() => this.flashing.set(false), FLASH_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  fmtPrice(value: number): string {
    return formatPrice(value, this.asset().pricePrecision, this.locale());
  }

  fmtSize(value: number): string {
    return formatQty(value, this.asset().qtyPrecision, this.locale());
  }

  depthPct(size: number, side: 'ask' | 'bid'): number {
    const max = side === 'ask' ? this.maxAskDepth() : this.maxBidDepth();
    return Math.min(100, (size / max) * 100);
  }

  pickPrice(price: number): void {
    this.ui.setLimitPriceFromBook(price);
  }
}
