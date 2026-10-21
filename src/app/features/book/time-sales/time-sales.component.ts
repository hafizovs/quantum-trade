import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { getAssetSeed } from '../../../core/constants/assets.constants';
import { MAX_TAPE_VIEW } from '../../../core/constants/market.constants';
import type { AssetId } from '../../../core/models/asset-id.model';
import { I18nService } from '../../../core/i18n.service';
import { TradingEngineService } from '../../chart/trading-engine.service';
import { UiStore } from '../../../core/ui/ui.store';
import { formatPrice, formatQty, formatTime } from '../../../shared/format.util';

@Component({
  selector: 'qt-time-sales',
  imports: [],
  templateUrl: './time-sales.component.html',
  styleUrl: './time-sales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeSalesComponent {
  private readonly engine = inject(TradingEngineService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);

  readonly locale = this.ui.locale;
  readonly selectedAssetId = this.engine.selectedAssetId;

  readonly tape = computed(() => {
    const assetId = this.selectedAssetId();
    return this.engine
      .timeAndSales()
      .filter((item) => item.assetId === assetId)
      .slice(0, MAX_TAPE_VIEW);
  });

  t(key: string): string {
    return this.i18n.t(key);
  }

  fmtPrice(assetId: AssetId, price: number): string {
    const asset = getAssetSeed(assetId);
    return formatPrice(price, asset.pricePrecision, this.locale());
  }

  fmtQty(assetId: AssetId, qty: number): string {
    const asset = getAssetSeed(assetId);
    return formatQty(qty, asset.qtyPrecision, this.locale());
  }

  fmtTime(ts: number): string {
    return formatTime(ts, this.locale());
  }
}
