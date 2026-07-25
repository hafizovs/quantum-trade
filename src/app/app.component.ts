import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { TerminalRootComponent } from './components/terminal-root/terminal-root.component';
import { UiStore } from './state/ui.store';

@Component({
  selector: 'qt-root',
  standalone: true,
  imports: [TerminalRootComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly ui = inject(UiStore);

  constructor() {
    effect(() => {
      const theme = this.ui.theme();
      document.documentElement.dataset['theme'] = theme;
    });
  }
}
