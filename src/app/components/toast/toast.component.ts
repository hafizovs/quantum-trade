import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
} from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { ToastService } from '../../services/toast.service';
import { UiStore } from '../../state/ui.store';
import type { ToastItem } from '../../models/trading.types';

@Component({
  selector: 'qt-toast',
  imports: [],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly queue = this.ui.toastQueue;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    effect(() => {
      const items = this.queue();
      const activeIds = new Set(items.map((item) => item.id));

      for (const [id, timer] of this.timers) {
        if (!activeIds.has(id)) {
          clearTimeout(timer);
          this.timers.delete(id);
        }
      }

      for (const item of items) {
        if (this.timers.has(item.id)) {
          continue;
        }
        const timer = setTimeout(() => this.dismiss(item.id), item.ttlMs);
        this.timers.set(item.id, timer);
      }
    });

    this.destroyRef.onDestroy(() => {
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      this.timers.clear();
    });
  }

  t(item: ToastItem): string {
    return this.i18n.t(item.messageKey, item.params);
  }

  closeLabel(): string {
    return this.i18n.t('help.close');
  }

  dismiss(id: string): void {
    this.toast.dismiss(id);
  }

  liveMode(item: ToastItem): 'assertive' | 'polite' {
    return item.kind === 'danger' ? 'assertive' : 'polite';
  }
}
