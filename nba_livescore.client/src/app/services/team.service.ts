import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay, catchError } from 'rxjs/operators';
import { Team } from './team.model';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = '/api/teams'; 
  private teamsCache$?: Observable<Team[]>;

  constructor(private http: HttpClient) { }

  createTeam(team: Team): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, team);
  }

  getTeams(): Observable<Team[]> {
    if (!this.teamsCache$) {
      this.teamsCache$ = this.http.get<Team[]>(this.apiUrl).pipe(
        shareReplay(1),
        catchError(err => {
          console.error('Failed to fetch teams', err);
          return of([]);
        })
      );
    }
    return this.teamsCache$;
  }

  getTeam(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/${id}`);
  }
}
