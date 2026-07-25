import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import type { AssetId } from '../../core/models/asset-id.model';
import type { CandleIntervalSec } from '../../core/models/candle-interval.model';
import { I18nService } from '../../services/i18n.service';
import { TradingEngineService } from '../../services/trading-engine.service';
import { UiStore } from '../../state/ui.store';

@Component({
  selector: 'qt-toolbar',
  imports: [],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  private readonly engine = inject(TradingEngineService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);

  readonly assets = this.engine.assets;
  readonly selectedAssetId = this.engine.selectedAssetId;
  readonly candleIntervalSec = this.engine.candleIntervalSec;
  readonly theme = this.ui.theme;
  readonly locale = this.ui.locale;

  t(key: string): string {
    return this.i18n.t(key);
  }

  assetLabel(id: AssetId): string {
    return this.i18n.t(`asset.${id}`);
  }

  selectAsset(id: AssetId): void {
    this.engine.selectAsset(id);
  }

  setInterval(sec: CandleIntervalSec): void {
    this.engine.setCandleInterval(sec);
  }

  reset(): void {
    this.engine.resetSimulation();
  }

  toggleTheme(): void {
    this.ui.toggleTheme();
  }

  toggleLocale(): void {
    this.ui.toggleLocale();
  }

  openHelp(): void {
    this.ui.setHelpOpen(true);
  }

  themeLabel(): string {
    return this.theme() === 'dark' ? this.t('theme.dark') : this.t('theme.light');
  }

  localeLabel(): string {
    return this.locale().toUpperCase();
  }
}
