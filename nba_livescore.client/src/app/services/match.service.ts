import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Match, ESPNScheduleResponse } from './match.model';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private apiUrl = '/api/matches';

  constructor(private http: HttpClient) { }

  createMatch(match: Match): Observable<Match> {
    return this.http.post<Match>(this.apiUrl, match);
  }

  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>(this.apiUrl);
  }

  getUpcomingMatches(): Observable<ESPNScheduleResponse> {
    return this.http.get<ESPNScheduleResponse>(`${this.apiUrl}/upcoming`);
  }

  getMatchById(id: string): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/${id}`);
  }

  getMatch(id: number): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/${id}`);
  }

  getMatchScores(matchId: number): Observable<{ homeTeamScore: number; awayTeamScore: number }> {
    const url = `${this.apiUrl}/${matchId}/scores`;
    return this.http.get<{ homeTeamScore: number; awayTeamScore: number }>(url);
  }

  getTeamName(teamId: number): Observable<string> {
    return this.http.get<{ name: string }>(`/api/teams/${teamId}/name`)
      .pipe(map(response => response.name));
  }

  updateMatch(id: number, match: Match): Observable<Match> {
    return this.http.put<Match>(`${this.apiUrl}/${id}`, match);
  }

  updateMatchStatus(matchId: number, isFinished: boolean): Observable<void> {
    const url = `${this.apiUrl}/${matchId}/finish`;
    return this.http.put<void>(url, { isFinished });
  }

  updateCurrentQuarter(matchId: number, currentQuarter: number): Observable<void> {
    const url = `/api/matches/${matchId}/currentQuarter`;
    return this.http.put<void>(url, currentQuarter); 
  }

  deleteMatch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Functional features: Player Scores
  addScore(scoreData: { matchId: number; playerId: number; points: number }): Observable<{ success: boolean; id?: number }> {
    return this.http.post<{ success: boolean; id?: number }>('/api/playerscores/add-score', scoreData);
  }

  getHistoricalScores(matchId: number): Observable<{ id: number; scoreTime: string; points: number; playerId: number; player?: { name: string } }[]> {
    return this.http.get<{ id: number; scoreTime: string; points: number; playerId: number; player?: { name: string } }[]>(`/api/playerscores/match/${matchId}`);
  }
}
