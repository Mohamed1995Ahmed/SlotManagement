export interface GenerateSlotsInput {
  startDate: string;
  endDate: string;
  timeZone: string;
  slotDuration: number;
}

export interface GenerateSlotsResult {
  totalSlotsCreated: number;
}

export interface SlotDto {
  id: string;
  localStartTime: string;
  localEndTime: string;
  timeZone: string;
  durationMinutes: number;
  isBookable: boolean;
}

/** Matches ABP's PagedResultDto<T> shape */
export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export const SUPPORTED_TIME_ZONES = [
  'Africa/Cairo',
  'America/New_York',
  'Europe/London'
];
