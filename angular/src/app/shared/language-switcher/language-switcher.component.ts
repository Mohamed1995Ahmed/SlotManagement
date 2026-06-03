import {
  Component,
  ElementRef,
  HostListener,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalizationService } from '../../core/localization/localization.service';
import { AbpLocalizationPipe } from '../../core/localization/abp-localization.pipe';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, AbpLocalizationPipe],
  template: `
    <div class="ls-wrapper">

      <!-- Trigger: globe icon + current lang code -->
      <button type="button" class="ls-trigger"
              (click)="toggle()"
              [attr.aria-expanded]="open"
              aria-haspopup="listbox">
        <!-- Globe SVG (inline — no external dependency) -->
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17"
             viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2"  y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10
                   15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>

        <span class="ls-code">{{ currentCode | uppercase }}</span>

        <!-- Chevron -->
        <svg class="ls-chevron" [class.open]="open"
             xmlns="http://www.w3.org/2000/svg" width="11" height="11"
             viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <!-- Dropdown -->
      <ul *ngIf="open" class="ls-menu" role="listbox">
        <li *ngFor="let lang of langs"
            class="ls-option"
            [class.active]="lang.code === currentCode"
            role="option"
            [attr.aria-selected]="lang.code === currentCode"
            (click)="use(lang.code)">

          <span class="ls-flag" aria-hidden="true">{{ lang.flag }}</span>
          <span class="ls-name">{{ lang.nameKey | abpLocalization }}</span>

          <!-- Checkmark for active -->
          <svg *ngIf="lang.code === currentCode"
               class="ls-check"
               xmlns="http://www.w3.org/2000/svg" width="13" height="13"
               viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </li>
      </ul>

    </div>
  `,
  styles: [`
    .ls-wrapper { position: relative; display: inline-block; }

    .ls-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 0.38rem 0.7rem;
      font-size: 0.85rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      white-space: nowrap;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .ls-trigger:hover {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
    }

    .ls-code { min-width: 1.6rem; text-align: center; }

    .ls-chevron { transition: transform 0.2s; }
    .ls-chevron.open { transform: rotate(180deg); }

    .ls-menu {
      position: absolute;
      inset-inline-end: 0;
      top: calc(100% + 5px);
      min-width: 155px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(15,23,42,0.12);
      list-style: none;
      margin: 0;
      padding: 5px 0;
      z-index: 9999;
    }

    .ls-option {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.5rem 0.9rem;
      cursor: pointer;
      font-size: 0.9rem;
      color: #1f2937;
      transition: background 0.12s;
    }
    .ls-option:hover { background: #f1f5f9; }
    .ls-option.active {
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 600;
    }

    .ls-flag { font-size: 1.15rem; line-height: 1; }
    .ls-name { flex: 1; }
    .ls-check { color: #2563eb; flex-shrink: 0; }
  `]
})
export class LanguageSwitcherComponent {
  private readonly l   = inject(LocalizationService);
  private readonly el  = inject(ElementRef);

  open = false;

  readonly langs = [
    { code: 'en', flag: '🇬🇧', nameKey: 'Language:English' },
    { code: 'ar', flag: '🇸🇦', nameKey: 'Language:Arabic'  }
  ];

  get currentCode(): string { return this.l.currentLang; }

  toggle(): void { this.open = !this.open; }

  async use(code: string): Promise<void> {
    await this.l.use(code);
    this.open = false;
  }

  @HostListener('document:click', ['$event.target'])
  onOutside(t: HTMLElement): void {
    if (!this.el.nativeElement.contains(t)) this.open = false;
  }
}
