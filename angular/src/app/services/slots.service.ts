import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  GenerateSlotsInput,
  GenerateSlotsResult,
  PagedResult,
  SlotDto
} from '../models/slot.models';

@Injectable({ providedIn: 'root' })
export class SlotsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/app/slots`;

  generate(input: GenerateSlotsInput): Observable<GenerateSlotsResult> {
    return this.http.post<GenerateSlotsResult>(`${this.baseUrl}/generate`, input);
  }

  getNextAvailable(
    timeZone: string,
    page = 0,
    pageSize = 20
  ): Observable<PagedResult<SlotDto>> {
    const params = new HttpParams()
      .set('timeZone', timeZone)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PagedResult<SlotDto>>(`${this.baseUrl}/next`, { params });
  }

  book(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/book`, {});
  }
}
