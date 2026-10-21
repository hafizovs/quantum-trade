import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
} from '@angular/core';
import { I18nService } from '../../core/i18n.service';
import { UiStore } from '../../core/ui/ui.store';

@Component({
  selector: 'qt-help-overlay',
  imports: [],
  templateUrl: './help-overlay.component.html',
  styleUrl: './help-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpOverlayComponent {
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);

  readonly helpOpen = this.ui.helpOpen;

  readonly hotkeys = [
    { keys: '1 / 2 / 3', action: 'BTC / ETH / CORE-AI' },
    { keys: 'B / S', action: 'Market Long / Short' },
    { keys: 'L', action: 'Toggle Market / Limit' },
    { keys: '+ / −', action: 'Leverage ±1' },
    { keys: 'T / G / H', action: 'Theme / Lang / Help' },
    { keys: 'R', action: 'Reset simulation' },
    { keys: 'Esc', action: 'Close help / blur input' },
  ];

  t(key: string): string {
    return this.i18n.t(key);
  }

  close(): void {
    this.ui.setHelpOpen(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.helpOpen()) {
      this.close();
    }
  }
}
