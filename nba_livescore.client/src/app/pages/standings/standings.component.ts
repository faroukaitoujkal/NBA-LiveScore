import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StandingService } from '../../services/standing.service';
import { Standing } from '../../services/standing.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterLink],
  templateUrl: './standings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandingsComponent implements OnInit {
  standings: Standing[] = [];
  isLoading = true;
  hasError = false;

  constructor(private standingService: StandingService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.standingService.getStandings().subscribe({
      next: (data: Standing[]) => {
        // Calculate GP and PCT if they are missing or zero from the API
        this.standings = data.map(team => {
          const wins = team.wins || 0;
          const losses = team.losses || 0;
          const gp = wins + losses;
          const pct = gp > 0 ? (wins / gp) : 0;
          
          return {
            ...team,
            gamesPlayed: team.gamesPlayed || gp,
            winPercentage: team.winPercentage || pct
          };
        });
        
        // Ensure standings are properly sorted by win percentage descending, then wins descending
        this.standings.sort((a, b) => {
          if (b.winPercentage !== a.winPercentage) {
             return b.winPercentage - a.winPercentage;
          }
          return b.wins - a.wins;
        });

        this.isLoading = false;
        this.hasError = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load standings', err);
        this.isLoading = false;
        this.hasError = true;
        this.cdr.markForCheck();
      }
    });
  }

  trackByTeamId(index: number, standing: Standing): number {
    return standing.teamId;
  }
}
