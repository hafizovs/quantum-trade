import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { getAssetSeed } from '../../../core/constants/assets.constants';
import type { AssetId } from '../../../core/models/asset-id.model';
import { I18nService } from '../../../core/i18n.service';
import { TradingEngineService } from '../../chart/trading-engine.service';
import { UiStore } from '../../../core/ui/ui.store';
import type { PositionsTab } from '../../../core/ui/ui.store';
import {
  formatDateTime,
  formatPrice,
  formatQty,
  formatSignedUsd,
  formatUsd,
} from '../../../shared/format.util';

@Component({
  selector: 'qt-positions-panel',
  imports: [],
  templateUrl: './positions-panel.component.html',
  styleUrl: './positions-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionsPanelComponent {
  private readonly engine = inject(TradingEngineService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);

  readonly locale = this.ui.locale;
  readonly positionsTab = this.ui.positionsTab;
  readonly positions = this.engine.positions;
  readonly openOrders = this.engine.openOrders;
  readonly balanceHistory = this.engine.balanceHistory;
  readonly prices = this.engine.prices;

  readonly history = computed(() => [...this.balanceHistory()].sort((a, b) => b.time - a.time));

  t(key: string): string {
    return this.i18n.t(key);
  }

  setTab(tab: PositionsTab): void {
    this.ui.setPositionsTab(tab);
  }

  assetSymbol(assetId: AssetId): string {
    return getAssetSeed(assetId).symbol;
  }

  fmtPrice(assetId: AssetId, value: number): string {
    const asset = getAssetSeed(assetId);
    return formatPrice(value, asset.pricePrecision, this.locale());
  }

  fmtQty(assetId: AssetId, value: number): string {
    const asset = getAssetSeed(assetId);
    return formatQty(value, asset.qtyPrecision, this.locale());
  }

  fmtUsd(value: number): string {
    return formatUsd(value, this.locale());
  }

  fmtSignedUsd(value: number): string {
    return formatSignedUsd(value, this.locale());
  }

  fmtTime(ts: number): string {
    return formatDateTime(ts, this.locale());
  }

  markPrice(assetId: AssetId): number {
    return this.prices()[assetId];
  }

  sideLabel(side: 'long' | 'short'): string {
    return side === 'long' ? this.t('side.long') : this.t('side.short');
  }

  note(entry: { noteRu: string; noteEn: string }): string {
    return this.locale() === 'ru' ? entry.noteRu : entry.noteEn;
  }

  closePosition(id: string): void {
    this.engine.closePosition(id);
  }

  cancelOrder(id: string): void {
    this.engine.cancelOrder(id);
  }
}
