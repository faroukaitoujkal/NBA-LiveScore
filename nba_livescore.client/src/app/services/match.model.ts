import { Team } from './team.model';

export enum MatchStatus {
  Scheduled = 0,
  InProgress = 1,
  Finished = 2,
  Canceled = 3
}

export interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: {
      state: string; // 'pre', 'in', 'post'
      detail: string;
    };
  };
  competitions: {
    competitors: {
      team: {
        displayName: string;
        abbreviation: string;
        logo: string;
        shortDisplayName?: string;
        name?: string;
      };
      score: string;
      homeAway: 'home' | 'away';
    }[];
    venue?: {
      fullName: string;
    };
  }[];
  links: { href: string }[];
}

export interface ESPNScheduleResponse {
  events: ESPNEvent[];
}

export interface Match {
  id: number;
  matchDate: string;
  location: string;
  
  homeTeamId: number;
  homeTeam?: Team;
  awayTeamId: number;
  awayTeam?: Team;
  
  numberOfQuarters: number;
  quarterDuration: number;
  timeoutDuration: number;
  
  currentQuarter: number;
  homeTeamScore: number;
  awayTeamScore: number;
  status: MatchStatus;
  season?: string;

  homeTeamStartingPlayers?: number[];
  awayTeamStartingPlayers?: number[];
  liveEncoders?: string[];
}
