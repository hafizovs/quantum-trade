import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TradingEngineService } from '../../services/trading-engine.service';
import { UiStore } from '../../state/ui.store';
import type { NewsSentiment } from '../../models/trading.types';
import { formatDateTime } from '../../utils/format.util';

@Component({
  selector: 'qt-news-feed',
  imports: [],
  templateUrl: './news-feed.component.html',
  styleUrl: './news-feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsFeedComponent {
  private readonly engine = inject(TradingEngineService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);

  readonly locale = this.ui.locale;
  readonly news = computed(() => [...this.engine.news()].sort((a, b) => b.time - a.time));

  t(key: string): string {
    return this.i18n.t(key);
  }

  headline(item: { headlineRu: string; headlineEn: string }): string {
    return this.locale() === 'ru' ? item.headlineRu : item.headlineEn;
  }

  sentimentLabel(sentiment: NewsSentiment): string {
    if (sentiment === 'bullish') {
      return this.t('news.bullish');
    }
    if (sentiment === 'bearish') {
      return this.t('news.bearish');
    }
    return this.t('news.neutral');
  }

  fmtTime(ts: number): string {
    return formatDateTime(ts, this.locale());
  }
}
