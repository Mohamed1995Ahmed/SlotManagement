import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  inject,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AbpLocalizationPipe } from '../../core/localization/abp-localization.pipe';
import { LocalizationService } from '../../core/localization/localization.service';
import { TIMEZONE_NAMES_AR } from '../../core/localization/timezone-names';

interface TzOption {
  id: string;       // TZDB identifier — always sent to backend
  display: string;  // Localised display name shown to the user
}

@Component({
  selector: 'app-timezone-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, AbpLocalizationPipe],
  template: `
    <div class="tz-wrapper">
      <input
        class="tz-input"
        type="text"
        [placeholder]="'Label:SearchTimeZone' | abpLocalization"
        [(ngModel)]="query"
        (ngModelChange)="onQueryChange()"
        (focus)="open = true"
        autocomplete="off"
        [attr.aria-label]="'Label:SearchTimeZone' | abpLocalization"
      />
      <ul class="tz-dropdown" *ngIf="open && filtered.length > 0" role="listbox">
        <li
          *ngFor="let opt of filtered"
          class="tz-option"
          [class.highlighted]="opt.id === value"
          (mousedown)="select(opt)"
          role="option"
          [attr.aria-selected]="opt.id === value"
        >{{ opt.display }}</li>
      </ul>
      <p class="tz-empty" *ngIf="open && query && filtered.length === 0">
        {{ 'Label:NoMatchFound' | abpLocalization }}
      </p>
    </div>
  `,
  styles: [`
    .tz-wrapper { position: relative; }

    .tz-input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.6rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font: inherit;
    }

    .tz-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      max-height: 220px;
      overflow-y: auto;
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin: 0;
      padding: 4px 0;
      list-style: none;
      z-index: 1000;
      box-shadow: 0 8px 24px rgba(15,23,42,0.10);
    }

    .tz-option {
      padding: 0.5rem 0.85rem;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .tz-option:hover, .tz-option.highlighted {
      background: #eff6ff;
      color: #1d4ed8;
    }

    .tz-empty {
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      font-size: 0.88rem;
      color: #94a3b8;
      z-index: 1000;
    }
  `]
})
export class TimezoneSelectorComponent implements OnChanges, OnInit, OnDestroy {
  @Input() value     = '';
  @Input() allZones: string[] = [];
  @Output() valueChange = new EventEmitter<string>();

  query    = '';
  filtered: TzOption[] = [];
  open     = false;

  private readonly _el  = inject(ElementRef);
  private readonly l    = inject(LocalizationService);
  private readonly cdr  = inject(ChangeDetectorRef);
  private langSub!: Subscription;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Re-render the input label and dropdown whenever the language switches
    this.langSub = this.l.currentLang$.subscribe(() => {
      this.query    = this.displayFor(this.value);
      this.filtered = this.getFiltered(this.query);
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['allZones']) {
      this.query    = this.displayFor(this.value);
      this.filtered = this.getFiltered(this.query);
    }
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  // ── Interaction ───────────────────────────────────────────────────────────

  onQueryChange(): void {
    this.open     = true;
    this.filtered = this.getFiltered(this.query);
  }

  select(opt: TzOption): void {
    this.value    = opt.id;
    this.query    = opt.display;
    this.open     = false;
    this.filtered = this.getFiltered(opt.display);
    this.valueChange.emit(opt.id);
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: HTMLElement): void {
    if (!this._el.nativeElement.contains(target)) {
      this.open = false;
      // Reset query to localised display of current value if user typed something invalid
      const lowerQuery = this.query.toLowerCase();
      const valid = this.allZones.some(
        z =>
          z.toLowerCase() === lowerQuery ||
          this.displayFor(z).toLowerCase() === lowerQuery
      );
      if (!valid) this.query = this.displayFor(this.value);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Localised display name for a TZDB id. */
  private displayFor(id: string): string {
    if (!id) return '';
    return this.l.currentLang === 'ar'
      ? (TIMEZONE_NAMES_AR[id] ?? id)
      : id;
  }

  private getFiltered(q: string): TzOption[] {
    const term = q.toLowerCase();
    return this.allZones
      .filter(id => {
        const display = this.displayFor(id);
        return (
          id.toLowerCase().includes(term) ||
          display.toLowerCase().includes(term)
        );
      })
      .slice(0, 100)
      .map(id => ({ id, display: this.displayFor(id) }));
  }
}
