import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export type LocalizationTexts = Record<string, string>;

interface LocalizationFile {
  culture: string;
  texts: LocalizationTexts;
}

/**
 * Runtime localization service that mirrors ABP's LocalizationService API.
 * Loads JSON files from /i18n/<lang>.json (served from the public/ folder).
 *
 * Templates:  {{ 'Label:StartDate' | abpLocalization }}
 * TypeScript: this.l.instant('Message:SlotsGenerated', ['42'])
 */
@Injectable({ providedIn: 'root' })
export class LocalizationService {
  private texts: LocalizationTexts = {};
  private readonly cache = new Map<string, LocalizationTexts>();
  private readonly supported = ['en', 'ar'];

  /** Emits every time the active language changes. */
  readonly currentLang$ = new BehaviorSubject<string>('en');

  /** True when the active language is RTL. */
  readonly isRtl = signal(false);

  constructor(private readonly http: HttpClient) {}

  // ── Bootstrap ────────────────────────────────────────────────────────────

  /** Called from APP_INITIALIZER — always starts in English. */
  async initialize(): Promise<void> {
    localStorage.removeItem('slotbooking_lang');
    await this.use('en');
  }

  // ── Language switch ───────────────────────────────────────────────────────

  async use(lang: string): Promise<void> {
    const target = this.supported.includes(lang) ? lang : 'en';

    if (!this.cache.has(target)) {
      const file = await firstValueFrom(
        this.http.get<LocalizationFile>(`/i18n/${target}.json`)
      );
      this.cache.set(target, file.texts ?? {});
    }

    this.texts = this.cache.get(target)!;
    localStorage.setItem('slotbooking_lang', target);
    this.currentLang$.next(target);

    const rtl = target === 'ar';
    this.isRtl.set(rtl);
    document.documentElement.lang = target;
    document.documentElement.dir  = rtl ? 'rtl' : 'ltr';
  }

  get currentLang(): string {
    return this.currentLang$.getValue();
  }

  // ── Key resolution ────────────────────────────────────────────────────────

  /**
   * Resolve a localization key with optional interpolation.
   *
   * Positional params (ABP-style {0}, {1}):
   *   instant('Message:SlotsGenerated', ['42'])  → "Generated 42 slots successfully."
   *
   * Named params (ABP exception data style):
   *   instant('SlotBooking:InvalidTimeZone', { TimeZone: 'Bad/Zone' })
   *
   * Falls back to the key itself when not found.
   */
  instant(key: string, params?: string[] | Record<string, string>): string {
    let text = this.texts[key] ?? key;

    if (Array.isArray(params)) {
      params.forEach((v, i) => { text = text.replaceAll(`{${i}}`, v); });
    } else if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replaceAll(`{${k}}`, v);
      });
    }

    return text;
  }
}
