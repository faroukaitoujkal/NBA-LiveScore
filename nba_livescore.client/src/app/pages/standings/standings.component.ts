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
      next: (data: any) => {
        this.standings = data;
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
