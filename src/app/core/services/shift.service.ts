import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserShiftsResponse, UserShiftSummary, ShiftInput } from '../models/shift.model';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private readonly API_URL = '/api/frontend';

  constructor(private http: HttpClient) {}

  getAllUsersShifts(): Observable<UserShiftSummary[]> {
    return this.http.get<UserShiftSummary[]>(`${this.API_URL}/shifts/`);
  }

  getUserShifts(userId: number): Observable<UserShiftsResponse> {
    return this.http.get<UserShiftsResponse>(`${this.API_URL}/shifts/${userId}/`);
  }

  setUserShifts(userId: number, shifts: ShiftInput[]): Observable<any> {
    return this.http.post(`${this.API_URL}/shifts/${userId}/set/`, { shifts });
  }
}
