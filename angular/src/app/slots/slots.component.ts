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
  SUPPORTED_TIME_ZONES,
  SlotDto
} from '../models/slot.models';
import { SlotsService } from '../services/slots.service';

@Component({
  selector: 'app-slots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './slots.component.html',
  styleUrl: './slots.component.scss'
})
export class SlotsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly slotsService = inject(SlotsService);

  readonly timeZones = SUPPORTED_TIME_ZONES;
  readonly pageSize = 20;

  generateForm = this.fb.nonNullable.group(
    {
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      timeZone: [this.timeZones[0], Validators.required],
      slotDuration: [30, [Validators.required, Validators.min(1)]]
    },
    { validators: [dateRangeValidator] }
  );

  viewTimeZone = this.timeZones[0];
  slots: SlotDto[] = [];
  totalCount = 0;
  currentPage = 0;

  generateResult: GenerateSlotsResult | null = null;
  errorMessage = '';
  successMessage = '';
  loadingGenerate = false;
  loadingSlots = false;

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get hasPrev(): boolean {
    return this.currentPage > 0;
  }

  get hasNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  get pageStart(): number {
    return this.totalCount === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalCount);
  }

  ngOnInit(): void {
    this.loadSlots();
  }

  generate(): void {
    if (this.generateForm.invalid) {
      this.generateForm.markAllAsTouched();
      return;
    }

    this.loadingGenerate = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.slotsService.generate(this.generateForm.getRawValue()).subscribe({
      next: result => {
        this.generateResult = result;
        this.successMessage = `Generated ${result.totalSlotsCreated} slots successfully.`;
        this.loadingGenerate = false;
        this.currentPage = 0;
        this.loadSlots();
      },
      error: err => {
        this.errorMessage = err?.error?.error?.message ?? 'Failed to generate slots.';
        this.loadingGenerate = false;
      }
    });
  }

  loadSlots(): void {
    this.loadingSlots = true;
    this.errorMessage = '';

    this.slotsService
      .getNextAvailable(this.viewTimeZone, this.currentPage, this.pageSize)
      .subscribe({
        next: result => {
          this.slots = result.items;
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
    this.currentPage = 0;
    this.loadSlots();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadSlots();
  }

  prevPage(): void {
    if (this.hasPrev) this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    if (this.hasNext) this.goToPage(this.currentPage + 1);
  }

  bookSlot(slot: SlotDto): void {
    this.slotsService.book(slot.id).subscribe({
      next: () => {
        this.successMessage = `Slot booked: ${slot.localStartTime}`;
        // Stay on the same page; if it becomes empty, go back one
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
  const end = group.get('endDate')?.value;
  return start && end && start > end ? { dateRange: true } : null;
}
