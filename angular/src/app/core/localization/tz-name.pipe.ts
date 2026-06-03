import { Pipe, PipeTransform, inject, OnDestroy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { LocalizationService } from './localization.service';
import { TIMEZONE_NAMES_AR } from './timezone-names';

/**
 * Translates a TZDB identifier to the active-language display name.
 *
 *   EN: 'Africa/Cairo'  →  'Africa/Cairo'
 *   AR: 'Africa/Cairo'  →  'القاهرة'
 *
 * Usage: {{ slot.timeZone | tzName }}
 */
@Pipe({
  name: 'tzName',
  standalone: true,
  pure: false   // re-evaluates when language switches
})
export class TzNamePipe implements PipeTransform, OnDestroy {
  private readonly l   = inject(LocalizationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub: Subscription;

  constructor() {
    this.sub = this.l.currentLang$.subscribe(() => this.cdr.markForCheck());
  }

  transform(id: string | null | undefined): string {
    if (!id) return '';
    return this.l.currentLang === 'ar'
      ? (TIMEZONE_NAMES_AR[id] ?? id)
      : id;
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
