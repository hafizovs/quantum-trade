import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  MAX_LEVERAGE,
  MIN_LEVERAGE,
  MIN_NOTIONAL_USD,
} from '../../../core/constants/portfolio.constants';
import { I18nService } from '../../../core/i18n.service';
import { MarketMathService } from '../../chart/market-math.service';
import { TradingEngineService } from '../../chart/trading-engine.service';
import { UiStore } from '../../../core/ui/ui.store';
import {
  formatPrice,
  formatQty,
  formatUsd,
} from '../../../shared/format.util';

@Component({
  selector: 'qt-trade-panel',
  imports: [],
  templateUrl: './trade-panel.component.html',
  styleUrl: './trade-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradePanelComponent {
  private readonly engine = inject(TradingEngineService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);
  private readonly math = inject(MarketMathService);

  readonly minNotional = MIN_NOTIONAL_USD;
  readonly minLeverage = MIN_LEVERAGE;
  readonly maxLeverage = MAX_LEVERAGE;

  readonly asset = this.engine.selectedAsset;
  readonly locale = this.ui.locale;
  readonly orderType = this.ui.orderType;
  readonly notionalUsd = this.ui.notionalUsd;
  readonly leverage = this.ui.leverage;
  readonly limitPrice = this.ui.limitPrice;
  readonly lastTradeError = this.ui.lastTradeError;
  readonly selectedPrice = this.engine.selectedPrice;

  readonly preview = computed(() => {
    const asset = this.asset();
    const price =
      this.orderType() === 'limit' && this.limitPrice() !== null
        ? this.limitPrice()!
        : this.selectedPrice();
    const notional = this.notionalUsd();
    const lev = this.leverage();
    const qty = this.math.qtyFromNotional(notional, price, asset.lotSize);
    const margin = this.math.requiredMargin(notional, lev);
    const liqLong = this.math.liquidationPrice('long', price, lev);
    const liqShort = this.math.liquidationPrice('short', price, lev);
    return { qty, margin, liqLong, liqShort, price };
  });

  t(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }

  fmtPrice(value: number): string {
    const asset = this.asset();
    return formatPrice(value, asset.pricePrecision, this.locale());
  }

  fmtQty(value: number): string {
    const asset = this.asset();
    return formatQty(value, asset.qtyPrecision, this.locale());
  }

  fmtUsd(value: number): string {
    return formatUsd(value, this.locale());
  }

  onNotionalInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      this.ui.notionalUsd.set(parsed);
    }
  }

  onLimitInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      this.ui.limitPrice.set(parsed);
    }
  }

  onLeverageInput(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(raw)) {
      this.ui.leverage.set(
        Math.min(MAX_LEVERAGE, Math.max(MIN_LEVERAGE, Math.round(raw))),
      );
    }
  }

  setOrderType(type: 'market' | 'limit'): void {
    this.ui.orderType.set(type);
  }

  buyLong(): void {
    this.submit('long');
  }

  sellShort(): void {
    this.submit('short');
  }

  private submit(side: 'long' | 'short'): void {
    const assetId = this.engine.selectedAssetId();
    this.engine.placeOrder({
      assetId,
      type: this.orderType(),
      positionSide: side,
      notionalUsd: this.notionalUsd(),
      limitPrice: this.orderType() === 'limit' ? this.limitPrice() : null,
      leverage: this.leverage(),
    });
  }
}
