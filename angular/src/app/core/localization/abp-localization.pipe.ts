import {
  ChangeDetectorRef,
  inject,
  OnDestroy,
  Pipe,
  PipeTransform
} from '@angular/core';
import { Subscription } from 'rxjs';
import { LocalizationService } from './localization.service';

/**
 * ABP-compatible localization pipe.
 *
 * Impure so it re-evaluates automatically when the language changes.
 *
 * Usage (identical to ABP Angular):
 *   {{ 'Label:StartDate' | abpLocalization }}
 *   {{ 'Message:SlotsGenerated' | abpLocalization:['42'] }}
 */
@Pipe({
  name: 'abpLocalization',
  standalone: true,
  pure: false
})
export class AbpLocalizationPipe implements PipeTransform, OnDestroy {
  private readonly l   = inject(LocalizationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub: Subscription;

  constructor() {
    // Mark the host view for check every time the language switches.
    this.sub = this.l.currentLang$.subscribe(() => this.cdr.markForCheck());
  }

  transform(key: string, params?: string[] | Record<string, string>): string {
    return this.l.instant(key, params);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
