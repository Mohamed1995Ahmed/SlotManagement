import { Pipe, PipeTransform, inject, OnDestroy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { LocalizationService } from './localization.service';

/**
 * Formats an ISO offset datetime string according to the active locale,
 * preserving the full date AND time.
 *
 * Input example: "2026-06-15T08:30:00+03:00"
 *
 *   EN  →  2026-06-15  08:30:00 +03:00
 *   AR  →  06/15/2026  08:30:00 +03:00
 *
 * Usage: {{ slot.localStartTime | localDate }}
 */
@Pipe({
  name: 'localDate',
  standalone: true,
  pure: false   // re-evaluates on language switch
})
export class LocalDatePipe implements PipeTransform, OnDestroy {
  private readonly l   = inject(LocalizationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub: Subscription;

  constructor() {
    this.sub = this.l.currentLang$.subscribe(() => this.cdr.markForCheck());
  }

  /**
   * Parses "YYYY-MM-DDThh:mm:ss±hh:mm" and returns a formatted string.
   * Falls back to the raw value if parsing fails.
   */
  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Split on 'T' to separate date and time+offset
    const tIdx = value.indexOf('T');
    if (tIdx === -1) {
      // No time part — format date only
      return this.formatDate(value);
    }

    const datePart     = value.slice(0, tIdx);          // "2026-06-15"
    const timeAndOffset = value.slice(tIdx + 1);        // "08:30:00+03:00"

    // Separate time from offset  (offset starts at + or -, after the seconds)
    // hh:mm:ss+hh:mm  or  hh:mm:ss-hh:mm  or  hh:mm:ssZ
    const offsetMatch = timeAndOffset.match(/^(\d{2}:\d{2}:\d{2})(Z|[+-]\d{2}:\d{2})$/);
    const timePart   = offsetMatch ? offsetMatch[1] : timeAndOffset;
    const offsetPart = offsetMatch ? offsetMatch[2] : '';

    const formattedDate = this.formatDate(datePart);

    return offsetPart
      ? `${formattedDate}  ${timePart}  ${offsetPart}`
      : `${formattedDate}  ${timePart}`;
  }

  /** Formats "YYYY-MM-DD" → locale date string. */
  private formatDate(datePart: string): string {
    const parts = datePart.split('-');
    if (parts.length !== 3) return datePart;

    const [yyyy, mm, dd] = parts;

    return this.l.currentLang === 'ar'
      ? `${mm}/${dd}/${yyyy}`    // mm/dd/yyyy  (Arabic)
      : `${yyyy}-${mm}-${dd}`;  // yyyy-mm-dd  (English)
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
