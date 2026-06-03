import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {
  GenerateSlotsResult,
  SlotDto,
  SlotFilter,
  SUPPORTED_TIME_ZONES
} from '../models/slot.models';
import { SlotsService } from '../services/slots.service';
import { TimezoneSelectorComponent } from '../shared/timezone-selector/timezone-selector.component';
import { AbpLocalizationPipe } from '../core/localization/abp-localization.pipe';
import { LocalizationService } from '../core/localization/localization.service';
import { LocalDatePipe } from '../core/localization/local-date.pipe';
import { TzNamePipe } from '../core/localization/tz-name.pipe';

const WINDOW = 3;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateOrderValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string;
  const end   = group.get('endDate')?.value   as string;
  return start && end && start > end ? { dateOrder: true } : null;
}

function bothInPastValidator(group: AbstractControl): ValidationErrors | null {
  const end   = group.get('endDate')?.value as string;
  return end && end < todayStr() ? { bothInPast: true } : null;
}

@Component({
  selector: 'app-slots',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TimezoneSelectorComponent,
    AbpLocalizationPipe,
    LocalDatePipe,
    TzNamePipe
  ],
  templateUrl: './slots.component.html',
  styleUrl: './slots.component.scss'
})
export class SlotsComponent implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly slotsService = inject(SlotsService);
  private readonly l            = inject(LocalizationService);

  readonly allTimeZones  = SUPPORTED_TIME_ZONES;
  readonly pageSize      = 10;

  /** Status options — keys resolved at render time by the pipe */
  readonly statusOptions = [
    { labelKey: 'Status:All',       value: ''          },
    { labelKey: 'Status:Available', value: 'available' },
    { labelKey: 'Status:Booked',    value: 'booked'    }
  ];

  private readonly DEFAULT_TZ = 'Africa/Cairo';

  generateForm = this.fb.nonNullable.group(
    {
      startDate:    ['', Validators.required],
      endDate:      ['', Validators.required],
      timeZone:     [this.DEFAULT_TZ, Validators.required],
      slotDuration: [30, [Validators.required, Validators.min(1)]]
    },
    { validators: [dateOrderValidator, bothInPastValidator] }
  );

  viewTimeZone = this.DEFAULT_TZ;
  slots: SlotDto[]   = [];
  totalCount         = 0;
  currentPage        = 0;
  filter: SlotFilter = {};

  filterStatus   = '';
  filterDateFrom = '';
  filterDateTo   = '';

  generateResult: GenerateSlotsResult | null = null;
  errorMessage    = '';
  successMessage  = '';
  warningMessage  = '';
  loadingGenerate = false;
  loadingSlots    = false;

  // ── Getters ────────────────────────────────────────────────────────────────

  get startInPastWarning(): boolean {
    const start = this.generateForm.get('startDate')?.value as string;
    const end   = this.generateForm.get('endDate')?.value   as string;
    const today = todayStr();
    return !!(start && end && start < today && end >= today);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get pageStart(): number {
    return this.totalCount === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalCount);
  }

  get pageNumbers(): (number | null)[] {
    const total = this.totalPages;
    if (total <= 1) return [];

    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);

    const half  = Math.floor(WINDOW / 2);
    const start = Math.max(2, this.currentPage - half + 1);
    const end   = Math.min(total - 1, start + WINDOW - 1);
    for (let p = start; p <= end; p++) pages.add(p);

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | null)[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(null);
      result.push(sorted[i]);
    }
    return result;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadSlots();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  generate(): void {
    this.generateForm.markAllAsTouched();
    if (this.generateForm.invalid) return;

    this.loadingGenerate = true;
    this.errorMessage    = '';
    this.successMessage  = '';
    this.warningMessage  = '';

    if (this.startInPastWarning) {
      this.warningMessage = this.l.instant('Warning:StartInPast');
    }

    this.slotsService.generate(this.generateForm.getRawValue()).subscribe({
      next: result => {
        this.generateResult = result;
        this.successMessage = this.l.instant(
          'Message:SlotsGenerated',
          [String(result.totalSlotsCreated)]
        );
        this.loadingGenerate = false;
        this.currentPage = 0;
        this.loadSlots();
      },
      error: err => {
        this.errorMessage = err?.error?.error?.message
          ?? this.l.instant('Message:FailedGenerate');
        this.warningMessage  = '';
        this.loadingGenerate = false;
      }
    });
  }

  applyFilter(): void {
    this.filter = {
      statusFilter: this.filterStatus   || undefined,
      dateFrom:     this.filterDateFrom || undefined,
      dateTo:       this.filterDateTo   || undefined
    };
    this.currentPage = 0;
    this.loadSlots();
  }

  clearFilter(): void {
    this.filterStatus   = '';
    this.filterDateFrom = '';
    this.filterDateTo   = '';
    this.filter         = {};
    this.currentPage    = 0;
    this.loadSlots();
  }

  loadSlots(): void {
    this.loadingSlots = true;
    this.errorMessage = '';

    this.slotsService
      .getNextAvailable(this.viewTimeZone, this.currentPage, this.pageSize, this.filter)
      .subscribe({
        next: result => {
          this.slots        = result.items;
          this.totalCount   = result.totalCount;
          this.loadingSlots = false;
        },
        error: err => {
          this.errorMessage = err?.error?.error?.message
            ?? this.l.instant('Message:FailedLoad');
          this.loadingSlots = false;
        }
      });
  }

  onTimeZoneChange(timeZone: string): void {
    this.viewTimeZone = timeZone;
    this.currentPage  = 0;
    this.loadSlots();
  }

  onGenerateTimezoneChange(tz: string): void {
    this.generateForm.patchValue({ timeZone: tz });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadSlots();
  }

  bookSlot(slot: SlotDto): void {
    this.slotsService.book(slot.id).subscribe({
      next: () => {
        this.successMessage = this.l.instant(
          'Message:SlotBooked',
          [slot.localStartTime]
        );
        this.loadSlots();
      },
      error: err => {
        this.errorMessage = err?.error?.error?.message
          ?? this.l.instant('Message:FailedBook');
      }
    });
  }
}
