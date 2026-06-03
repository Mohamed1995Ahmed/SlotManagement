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
  STATUS_OPTIONS,
  SUPPORTED_TIME_ZONES
} from '../models/slot.models';
import { SlotsService } from '../services/slots.service';

const WINDOW = 3;

// ── Custom validators ────────────────────────────────────────────────────────

/** Returns today's date string in YYYY-MM-DD (local browser time). */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Cross-field validator: startDate must be <= endDate.
 * Applied at the form group level.
 */
function dateOrderValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string;
  const end   = group.get('endDate')?.value   as string;
  if (start && end && start > end) {
    return { dateOrder: true };
  }
  return null;
}

/**
 * Cross-field validator: both dates must not be entirely in the past.
 * Applied at the form group level.
 */
function bothInPastValidator(group: AbstractControl): ValidationErrors | null {
  const end   = group.get('endDate')?.value as string;
  const today = todayStr();
  if (end && end < today) {
    return { bothInPast: true };
  }
  return null;
}

@Component({
  selector: 'app-slots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './slots.component.html',
  styleUrl: './slots.component.scss'
})
export class SlotsComponent implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly slotsService = inject(SlotsService);

  readonly timeZones     = SUPPORTED_TIME_ZONES;
  readonly statusOptions = STATUS_OPTIONS;
  readonly pageSize      = 10;

  // ── Generate form ──────────────────────────────────────────────────────────
  generateForm = this.fb.nonNullable.group(
    {
      startDate:    ['', Validators.required],
      endDate:      ['', Validators.required],
      timeZone:     [this.timeZones[0], Validators.required],
      slotDuration: [30, [Validators.required, Validators.min(1)]]
    },
    { validators: [dateOrderValidator, bothInPastValidator] }
  );

  // ── View state ─────────────────────────────────────────────────────────────
  viewTimeZone = this.timeZones[0];
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

  // ── Convenience getters for template ─────────────────────────────────────

  /** True when start is in the past but end is today/future — warn but allow. */
  get startInPastWarning(): boolean {
    const start = this.generateForm.get('startDate')?.value as string;
    const end   = this.generateForm.get('endDate')?.value   as string;
    const today = todayStr();
    return !!(start && end && start < today && end >= today);
  }

  // ── Pagination helpers ────────────────────────────────────────────────────
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

    // Warn the user before submitting that start will be clamped server-side
    if (this.startInPastWarning) {
      const today = todayStr();
      this.warningMessage =
        `Start date is in the past. Slots will be generated from ${today} onwards.`;
    }

    this.slotsService.generate(this.generateForm.getRawValue()).subscribe({
      next: result => {
        this.generateResult = result;
        this.successMessage = `Generated ${result.totalSlotsCreated} slots successfully.`;
        this.loadingGenerate = false;
        this.currentPage = 0;
        this.loadSlots();
      },
      error: err => {
        this.errorMessage    = err?.error?.error?.message ?? 'Failed to generate slots.';
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
          this.errorMessage = err?.error?.error?.message ?? 'Failed to load slots.';
          this.loadingSlots = false;
        }
      });
  }

  onTimeZoneChange(timeZone: string): void {
    this.viewTimeZone = timeZone;
    this.currentPage  = 0;
    this.loadSlots();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadSlots();
  }

  bookSlot(slot: SlotDto): void {
    this.slotsService.book(slot.id).subscribe({
      next: () => {
        this.successMessage = `Slot booked: ${slot.localStartTime}`;
        this.loadSlots();
      },
      error: err => {
        this.errorMessage = err?.error?.error?.message ?? 'Failed to book slot.';
      }
    });
  }
}
