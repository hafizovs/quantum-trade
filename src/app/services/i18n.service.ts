import { Injectable, computed, inject } from '@angular/core';
import type { I18nKey } from '../i18n/i18n.keys';
import { EN } from '../i18n/en';
import { RU } from '../i18n/ru';
import { UiStore } from '../state/ui.store';

const DICTS = { ru: RU, en: EN } as const;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly ui = inject(UiStore);

  readonly locale = this.ui.locale;

  readonly dict = computed(() => DICTS[this.ui.locale()]);

  t(key: I18nKey | string, params?: Record<string, string | number>): string {
    const dict = this.dict();
    let text = (dict as Record<string, string>)[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  }
}
