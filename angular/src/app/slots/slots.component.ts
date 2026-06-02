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

/** Max numbered page buttons visible at a time (excluding first/last/ellipsis) */
const WINDOW = 3;

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
    { validators: [dateRangeValidator] }
  );

  // ── View state ─────────────────────────────────────────────────────────────
  viewTimeZone = this.timeZones[0];
  slots: SlotDto[]           = [];
  totalCount                 = 0;
  currentPage                = 0;
  filter: SlotFilter         = {};

  // filter bar fields (bound with ngModel)
  filterStatus   = '';
  filterDateFrom = '';
  filterDateTo   = '';

  generateResult: GenerateSlotsResult | null = null;
  errorMessage    = '';
  successMessage  = '';
  loadingGenerate = false;
  loadingSlots    = false;

  // ── Pagination helpers ─────────────────────────────────────────────────────
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get pageStart(): number {
    return this.totalCount === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalCount);
  }

  /**
   * Builds the page-number array shown in the pagination bar.
   * Always shows first + last page; shows a sliding window of WINDOW pages
   * around the current page; inserts null as an ellipsis marker.
   *
   * Example (totalPages=12, current=5, WINDOW=3):
   *   [1, null, 4, 5, 6, null, 12]
   */
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

    const sorted  = Array.from(pages).sort((a, b) => a - b);
    const result: (number | null)[] = [];

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(null); // ellipsis
      result.push(sorted[i]);
    }
    return result;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadSlots();
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  generate(): void {
    if (this.generateForm.invalid) {
      this.generateForm.markAllAsTouched();
      return;
    }

    this.loadingGenerate = true;
    this.errorMessage    = '';
    this.successMessage  = '';

    this.slotsService.generate(this.generateForm.getRawValue()).subscribe({
      next: result => {
        this.generateResult = result;
        this.successMessage = `Generated ${result.totalSlotsCreated} slots successfully.`;
        this.loadingGenerate = false;
        this.currentPage = 0;
        this.loadSlots();
      },
      error: err => {
        this.errorMessage   = err?.error?.error?.message ?? 'Failed to generate slots.';
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
          this.slots      = result.items;
          this.totalCount = result.totalCount;
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

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end   = group.get('endDate')?.value;
  return start && end && start > end ? { dateRange: true } : null;
}
