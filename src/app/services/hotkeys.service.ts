import { DestroyRef, Injectable, inject } from '@angular/core';
import {
  DEFAULT_NOTIONAL_USD,
  MAX_LEVERAGE,
  MIN_LEVERAGE,
  MIN_NOTIONAL_USD,
} from '../core/constants/portfolio.constants';
import type { AssetId } from '../core/models/asset-id.model';
import { TradingEngineService } from './trading-engine.service';
import { UiStore } from '../state/ui.store';

@Injectable({ providedIn: 'root' })
export class HotkeysService {
  private readonly engine = inject(TradingEngineService);
  private readonly ui = inject(UiStore);
  private readonly destroyRef = inject(DestroyRef);
  private bound = false;

  init(): void {
    if (this.bound || typeof window === 'undefined') {
      return;
    }
    this.bound = true;
    const handler = (event: KeyboardEvent) => this.onKeyDown(event);
    window.addEventListener('keydown', handler);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('keydown', handler);
      this.bound = false;
    });
  }

  private onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase() ?? '';
    const isEditable =
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      target?.isContentEditable === true;

    if (event.key === 'Escape') {
      this.ui.setHelpOpen(false);
      if (target && 'blur' in target) {
        (target as HTMLElement).blur();
      }
      return;
    }

    if (isEditable) {
      return;
    }

    const key = event.key;
    const upper = key.length === 1 ? key.toUpperCase() : key;

    switch (upper) {
      case '1':
        this.engine.selectAsset('BTCUSD');
        break;
      case '2':
        this.engine.selectAsset('ETHUSD');
        break;
      case '3':
        this.engine.selectAsset('COREAI');
        break;
      case 'B':
        this.quickMarket('long');
        break;
      case 'S':
        this.quickMarket('short');
        break;
      case 'L':
        this.ui.toggleOrderType();
        break;
      case '+':
      case '=':
        this.ui.bumpLeverage(1);
        break;
      case '-':
      case '_':
        this.ui.bumpLeverage(-1);
        break;
      case 'T':
        this.ui.toggleTheme();
        break;
      case 'G':
        this.ui.toggleLocale();
        break;
      case 'H':
        this.ui.toggleHelp();
        break;
      case 'R':
        this.engine.resetSimulation();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  private quickMarket(side: 'long' | 'short'): void {
    const notional = this.ui.notionalUsd();
    const leverage = Math.min(
      MAX_LEVERAGE,
      Math.max(MIN_LEVERAGE, this.ui.leverage()),
    );
    if (!Number.isFinite(notional) || notional < MIN_NOTIONAL_USD) {
      this.ui.notionalUsd.set(DEFAULT_NOTIONAL_USD);
    }
    const assetId = this.engine.selectedAssetId() as AssetId;
    this.engine.placeOrder({
      assetId,
      type: 'market',
      positionSide: side,
      notionalUsd: this.ui.notionalUsd(),
      leverage,
    });
  }
}
