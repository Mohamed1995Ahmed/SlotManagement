import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timezone-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tz-wrapper">
      <input
        class="tz-input"
        type="text"
        [placeholder]="placeholder"
        [(ngModel)]="query"
        (ngModelChange)="onQueryChange()"
        (focus)="open = true"
        autocomplete="off"
        [attr.aria-label]="placeholder"
      />
      <ul class="tz-dropdown" *ngIf="open && filtered.length > 0" role="listbox">
        <li
          *ngFor="let tz of filtered"
          class="tz-option"
          [class.highlighted]="tz === value"
          (mousedown)="select(tz)"
          role="option"
          [attr.aria-selected]="tz === value"
        >{{ tz }}</li>
      </ul>
      <p class="tz-empty" *ngIf="open && filtered.length === 0">No match found.</p>
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
export class TimezoneSelectorComponent implements OnChanges {
  @Input() value  = '';
  @Input() allZones: string[] = [];
  @Input() placeholder = 'Search time zone…';
  @Output() valueChange = new EventEmitter<string>();

  query    = '';
  filtered: string[] = [];
  open     = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.query    = this.value;
      this.filtered = this.getFiltered(this.value);
    }
    if (changes['allZones']) {
      this.filtered = this.getFiltered(this.query);
    }
  }

  onQueryChange(): void {
    this.open     = true;
    this.filtered = this.getFiltered(this.query);
  }

  select(tz: string): void {
    this.value = tz;
    this.query = tz;
    this.open  = false;
    this.filtered = this.getFiltered(tz);
    this.valueChange.emit(tz);
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: HTMLElement): void {
    if (!this._el.nativeElement.contains(target)) {
      this.open = false;
      // If user typed something invalid, reset to last valid value
      if (!this.allZones.includes(this.query)) {
        this.query = this.value;
      }
    }
  }

  private getFiltered(q: string): string[] {
    const term = q.toLowerCase();
    return this.allZones.filter(z => z.toLowerCase().includes(term)).slice(0, 100);
  }

  constructor(private _el: ElementRef) {}
}
