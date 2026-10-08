import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'standings', loadComponent: () => import('./pages/standings/standings.component').then(m => m.StandingsComponent) },
  { path: 'teams', loadComponent: () => import('./pages/team-list/team-list.component').then(m => m.TeamListComponent) },
  { path: 'teams/:id', loadComponent: () => import('./pages/team-detail/team-detail.component').then(m => m.TeamDetailComponent) },
  { path: 'matches/:id', loadComponent: () => import('./components/live-match-tracker/live-match-tracker.component').then(m => m.LiveMatchTrackerComponent) },
  { path: 'legal/mentions', loadComponent: () => import('./pages/legal/legal-mentions/legal-mentions.component').then(m => m.LegalMentionsComponent) },
  { path: 'legal/privacy', loadComponent: () => import('./pages/legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent) },
  { path: 'legal/terms', loadComponent: () => import('./pages/legal/terms-of-service/terms-of-service.component').then(m => m.TermsOfServiceComponent) },
  { path: '**', redirectTo: '' }
];
