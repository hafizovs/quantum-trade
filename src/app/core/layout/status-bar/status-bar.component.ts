import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { I18nService } from '../../i18n.service';
import { TradingEngineService } from '../../../features/chart/trading-engine.service';
import { UiStore } from '../../ui/ui.store';
import {
  formatPrice,
  formatSignedUsd,
  formatUsd,
} from '../../../shared/format.util';

@Component({
  selector: 'qt-status-bar',
  imports: [],
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  private readonly engine = inject(TradingEngineService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);

  readonly locale = this.ui.locale;
  readonly asset = this.engine.selectedAsset;
  readonly netWorth = this.engine.netWorth;
  readonly cashUsd = this.engine.cashUsd;
  readonly selectedPrice = this.engine.selectedPrice;
  readonly totalUnrealizedPnl = this.engine.totalUnrealizedPnl;
  readonly simRunning = this.engine.simRunning;
  readonly positions = this.engine.positions;

  t(key: string): string {
    return this.i18n.t(key);
  }

  fmtUsd(value: number): string {
    return formatUsd(value, this.locale());
  }

  fmtSignedUsd(value: number): string {
    return formatSignedUsd(value, this.locale());
  }

  fmtPrice(value: number): string {
    const asset = this.asset();
    return formatPrice(value, asset.pricePrecision, this.locale());
  }
}
