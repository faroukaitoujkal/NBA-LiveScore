import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamService } from '../../services/team.service';
import { Team } from '../../services/team.model';
import { FavoritesService } from '../../services/favorites.service';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './team-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamListComponent implements OnInit {
  teams: Team[] = [];
  isLoading = true;
  hasError = false;

  constructor(
    private teamService: TeamService, 
    public favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.teamService.getTeams().subscribe({
      next: (data: any) => {
        this.teams = data;
        this.isLoading = false;
        this.hasError = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load teams', err);
        this.isLoading = false;
        this.hasError = true;
        this.cdr.markForCheck();
      }
    });
  }

  toggleFavorite(event: Event, teamId: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesService.toggleFavorite(teamId);
  }

  isFavorite(teamId: number): boolean {
    return this.favoritesService.isFavorite(teamId);
  }

  trackByTeamId(index: number, team: Team): number {
    return team.id;
  }
}
