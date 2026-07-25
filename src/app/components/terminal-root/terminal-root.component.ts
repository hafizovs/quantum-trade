import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import {
  POSITIONS_PANEL_HEIGHT_PX,
  RIGHT_COLUMN_WIDTH_PX,
  TRADE_PANEL_WIDTH_PX,
} from '../../core/constants/ui.constants';
import { HotkeysService } from '../../services/hotkeys.service';
import { MarketClockService } from '../../services/market-clock.service';
import { I18nService } from '../../services/i18n.service';
import { UiStore } from '../../state/ui.store';
import { HelpOverlayComponent } from '../help-overlay/help-overlay.component';
import { NewsFeedComponent } from '../news-feed/news-feed.component';
import { OrderBookComponent } from '../order-book/order-book.component';
import { PositionsPanelComponent } from '../positions-panel/positions-panel.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { TimeSalesComponent } from '../time-sales/time-sales.component';
import { ToastComponent } from '../toast/toast.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { TradePanelComponent } from '../trade-panel/trade-panel.component';
import { TradingChartComponent } from '../trading-chart/trading-chart.component';

@Component({
  selector: 'qt-terminal-root',
  imports: [
    ToolbarComponent,
    TradePanelComponent,
    TradingChartComponent,
    OrderBookComponent,
    NewsFeedComponent,
    TimeSalesComponent,
    PositionsPanelComponent,
    StatusBarComponent,
    HelpOverlayComponent,
    ToastComponent,
  ],
  templateUrl: './terminal-root.component.html',
  styleUrl: './terminal-root.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.qt-theme-dark]': 'theme() === "dark"',
    '[class.qt-theme-light]': 'theme() === "light"',
  },
})
export class TerminalRootComponent implements OnInit {
  private readonly clock = inject(MarketClockService);
  private readonly hotkeys = inject(HotkeysService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly theme = this.ui.theme;
  readonly rightPaneTab = this.ui.rightPaneTab;

  readonly tradePanelWidth = TRADE_PANEL_WIDTH_PX;
  readonly rightColumnWidth = RIGHT_COLUMN_WIDTH_PX;
  readonly positionsPanelHeight = POSITIONS_PANEL_HEIGHT_PX;

  ngOnInit(): void {
    this.clock.start();
    this.hotkeys.init();
    this.destroyRef.onDestroy(() => this.clock.stop());
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  setRightPaneTab(tab: 'news' | 'tape'): void {
    this.ui.setRightPaneTab(tab);
  }
}
