import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatchService } from '../../services/match.service';
import { Match, MatchStatus } from '../../services/match.model';
import { SignalrService } from '../../services/signalr.service';
import { Player } from '../../services/player.model';
import { FoulService } from '../../services/foul.service';
import { TimeoutService } from '../../services/timeout.service';
import { SubstitutionService } from '../../services/substitution.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

export interface PlayEvent {
  id: number;
  timestamp: number;
  timeString: string;
  teamName: string;
  translationKey: string;
  translationParams?: any;
  isHome: boolean;
  type: 'SCORE' | 'FOUL' | 'SUB' | 'TIMEOUT';
}

@Component({
  selector: 'app-live-match-tracker',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './live-match-tracker.component.html'
})
export class LiveMatchTrackerComponent implements OnInit, OnDestroy {
  match: Match | null = null;
  loading = true;
  MatchStatus = MatchStatus;
  
  recentEvents: PlayEvent[] = [];
  selectedHomePlayerId: number | null = null;
  selectedAwayPlayerId: number | null = null;
  isSubmitting = false;

  feedback: { message: string, isError: boolean } | null = null;
  private feedbackTimeout: any;

  // Encoder UI State
  activeTab: 'POINTS' | 'FOULS' | 'SUBS' | 'TIMEOUTS' | 'MATCH' = 'POINTS';
  gameTimeInput: string = '12:00';
  selectedFoulType: string = 'P1';
  selectedPlayerOutId: number | null = null;
  selectedPlayerInId: number | null = null;
  timeoutDuration: string = '01:00';

  private scoreSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private matchService: MatchService,
    private signalRService: SignalrService,
    private foulService: FoulService,
    private timeoutService: TimeoutService,
    private subService: SubstitutionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMatch(+id);
      
      this.signalRService.startConnection(+id);
      
      this.scoreSubscription = this.signalRService.scoreUpdated$.subscribe((data: any) => {
        if (data && data.matchId === +id) {
           this.handleScoreUpdate(data);
           this.cdr.detectChanges();
        }
      });
    }
  }

  loadMatch(id: number, showLoading = true) {
    if (showLoading) this.loading = true;
    
    // Fetch match and all historical events simultaneously
    forkJoin({
      match: this.matchService.getMatch(id),
      scores: this.matchService.getHistoricalScores(id).pipe(catchError(() => of([]))),
      fouls: this.foulService.getFoulsByMatch(id).pipe(catchError(() => of([]))),
      subs: this.subService.getSubstitutionsByMatch(id).pipe(catchError(() => of([]))),
      timeouts: this.timeoutService.getTimeoutsByMatchs(id).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res: any) => {
        this.match = res.match;
        
        // Setup default selected players for the encoder panel
        if (this.match?.homeTeam?.players?.length && !this.selectedHomePlayerId) {
           this.selectedHomePlayerId = this.match.homeTeam.players[0].id;
        }
        if (this.match?.awayTeam?.players?.length && !this.selectedAwayPlayerId) {
           this.selectedAwayPlayerId = this.match.awayTeam.players[0].id;
        }

        // Map historical scores to our play-by-play events, sorted newest first
        let allEvents: PlayEvent[] = [];
        
        if (res.scores && !res.scores.error) {
          allEvents = [...allEvents, ...res.scores.map((s: any) => this.mapScoreToEvent(s))];
        }
        if (res.fouls && !res.fouls.error) {
          allEvents = [...allEvents, ...res.fouls.map((f: any) => this.mapFoulToEvent(f))];
        }
        if (res.subs && !res.subs.error) {
          allEvents = [...allEvents, ...res.subs.map((s: any) => this.mapSubToEvent(s))];
        }
        if (res.timeouts && !res.timeouts.error) {
          allEvents = [...allEvents, ...res.timeouts.map((t: any) => this.mapTimeoutToEvent(t))];
        }

        this.recentEvents = allEvents.sort((a: any, b: any) => {
          // Compare by timestamp if available, otherwise fallback to gameTime string comparison
          if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
          return 0; // In a real app we'd parse the MM:SS or use an auto-incrementing ID
        });
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading match', err);
        this.loading = false;
      }
    });
  }

  showFeedback(message: string, isError = false) {
    this.feedback = { message, isError };
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => {
      this.feedback = null;
      this.cdr.markForCheck();
    }, 3000);
    this.cdr.markForCheck();
  }

  // Mapper functions
  mapScoreToEvent(score: any): PlayEvent {
    let player = score.player;
    let isHome = false;
    let teamName = '';

    // If player is not populated by backend, find it locally
    if (!player && this.match) {
       const homeP = this.match.homeTeam?.players?.find(p => p.id === score.playerId);
       if (homeP) {
          player = homeP;
          isHome = true;
          teamName = this.match.homeTeam?.name || '';
       } else {
          const awayP = this.match.awayTeam?.players?.find(p => p.id === score.playerId);
          if (awayP) {
             player = awayP;
             isHome = false;
             teamName = this.match.awayTeam?.name || '';
          }
       }
    } else {
       isHome = this.match?.homeTeamId === score.player?.teamId;
       teamName = isHome ? this.match?.homeTeam?.name || '' : this.match?.awayTeam?.name || '';
    }

    return {
       id: score.id,
       timestamp: new Date(score.scoreTime).getTime(),
       timeString: new Date(score.scoreTime).toLocaleTimeString(),
       teamName: teamName,
       translationKey: 'LIVE_TRACKER.EVENTS.SCORE',
       translationParams: { player: player?.name || 'Unknown', points: score.points },
       isHome: isHome,
       type: 'SCORE'
    };
  }

  mapFoulToEvent(foul: any): PlayEvent {
    const isHome = this.match?.homeTeam?.players?.some((p: any) => p.id === foul.playerId) || false;
    const teamName = isHome ? this.match?.homeTeam?.name : this.match?.awayTeam?.name;
    const player = isHome ? this.match?.homeTeam?.players?.find((p: any) => p.id === foul.playerId) : this.match?.awayTeam?.players?.find((p: any) => p.id === foul.playerId);
    
    return {
       id: foul.id,
       timestamp: Date.now(), // Fallback
       timeString: foul.gameTime || '00:00',
       teamName: teamName || 'Unknown Team',
       translationKey: 'LIVE_TRACKER.EVENTS.FOUL',
       translationParams: { type: foul.foulType, player: player?.name || 'Unknown' },
       isHome: isHome,
       type: 'FOUL'
    };
  }

  mapSubToEvent(sub: any): PlayEvent {
    const isHome = this.match?.homeTeam?.players?.some((p: any) => p.id === sub.playerInId) || false;
    const teamName = isHome ? this.match?.homeTeam?.name : this.match?.awayTeam?.name;
    const playerIn = isHome ? this.match?.homeTeam?.players?.find((p: any) => p.id === sub.playerInId) : this.match?.awayTeam?.players?.find((p: any) => p.id === sub.playerInId);
    const playerOut = isHome ? this.match?.homeTeam?.players?.find((p: any) => p.id === sub.playerOutId) : this.match?.awayTeam?.players?.find((p: any) => p.id === sub.playerOutId);

    return {
       id: sub.id,
       timestamp: Date.now(),
       timeString: sub.gameTime || '00:00',
       teamName: teamName || 'Unknown Team',
       translationKey: 'LIVE_TRACKER.EVENTS.SUB',
       translationParams: { playerIn: playerIn?.name || 'Unknown', playerOut: playerOut?.name || 'Unknown' },
       isHome: isHome,
       type: 'SUB'
    };
  }

  mapTimeoutToEvent(timeout: any): PlayEvent {
    // Assuming timeout is associated with a match level, not specifically player/team in the model
    // but usually we can infer. For now we just show a general timeout.
    return {
       id: timeout.id,
       timestamp: Date.now(),
       timeString: timeout.gameTime || '00:00',
       teamName: 'MATCH',
       translationKey: 'LIVE_TRACKER.EVENTS.TIMEOUT',
       translationParams: { duration: timeout.duration || 'Unknown' },
       isHome: false,
       type: 'TIMEOUT'
    };
  }

  handleScoreUpdate(data: any) {
    if (this.match) {
      this.match.homeTeamScore = data.homeTeamScore;
      this.match.awayTeamScore = data.awayTeamScore;
    }
    if (data.playerScore) {
       this.recentEvents.unshift(this.mapScoreToEvent(data.playerScore));
    }
  }

  addRealScore(team: 'home' | 'away', points: number) {
    if (!this.match || this.isSubmitting) return;
    
    const playerId = team === 'home' ? this.selectedHomePlayerId : this.selectedAwayPlayerId;
    if (!playerId) {
       this.showFeedback("LIVE_TRACKER.FEEDBACK.SELECT_PLAYER", true);
       return;
    }

    this.isSubmitting = true;
    this.matchService.addScore({
       matchId: this.match.id,
       playerId: playerId,
       points: points
    }).subscribe({
       next: (res) => {
         this.isSubmitting = false;
         // Note: SignalR will handle the UI update automatically!
       },
       error: (err) => {
         console.error(err);
         this.isSubmitting = false;
         this.showFeedback("LIVE_TRACKER.FEEDBACK.SCORE_ERROR", true);
       }
    });
  }

  setTab(tab: 'POINTS' | 'FOULS' | 'SUBS' | 'TIMEOUTS' | 'MATCH') {
    this.activeTab = tab;
  }

  addFoul(team: 'home' | 'away') {
    if (!this.match || this.isSubmitting) return;
    const playerId = team === 'home' ? this.selectedHomePlayerId : this.selectedAwayPlayerId;
    if (!playerId) { this.showFeedback("LIVE_TRACKER.FEEDBACK.SELECT_PLAYER", true); return; }

    this.isSubmitting = true;
    this.foulService.createFoul({
      id: 0,
      playerId: playerId,
      player: { id: playerId, name: '', number: 0, teamId: 0 },
      foulType: this.selectedFoulType,
      quarter: this.match.currentQuarter,
      gameTime: this.gameTimeInput || "00:00",
      matchId: this.match.id
    }).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showFeedback("LIVE_TRACKER.FEEDBACK.FOUL_ADDED");
        this.recentEvents.unshift(this.mapFoulToEvent(res || {
          playerId: playerId, foulType: this.selectedFoulType, gameTime: this.gameTimeInput
        }));
        this.cdr.markForCheck();
      },
      error: (err) => { console.error(err); this.isSubmitting = false; this.showFeedback("LIVE_TRACKER.FEEDBACK.FOUL_ERROR", true); }
    });
  }

  recordSub() {
    if (!this.match || this.isSubmitting || !this.selectedPlayerOutId || !this.selectedPlayerInId) return;
    this.isSubmitting = true;
    this.subService.recordSubstitution({
      playerOutId: this.selectedPlayerOutId,
      playerInId: this.selectedPlayerInId,
      quarter: this.match.currentQuarter,
      gameTime: this.gameTimeInput || "00:00",
      matchId: this.match.id
    }).subscribe({
      next: (res: any) => { 
        this.isSubmitting = false; 
        this.showFeedback("LIVE_TRACKER.FEEDBACK.SUB_ADDED"); 
        this.recentEvents.unshift(this.mapSubToEvent(res || {
          playerInId: this.selectedPlayerInId, playerOutId: this.selectedPlayerOutId, gameTime: this.gameTimeInput
        }));
        this.cdr.markForCheck();
      },
      error: (err) => { console.error(err); this.isSubmitting = false; this.showFeedback("LIVE_TRACKER.FEEDBACK.SUB_ERROR", true); }
    });
  }

  callTimeout() {
    if (!this.match || this.isSubmitting) return;
    this.isSubmitting = true;
    this.timeoutService.createTimeoutFromMatch(this.match.id, {
      quarter: this.match.currentQuarter,
      gameTime: this.gameTimeInput || "00:00",
      duration: this.timeoutDuration
    }).subscribe({
      next: (res: any) => { 
        this.isSubmitting = false; 
        this.showFeedback("LIVE_TRACKER.FEEDBACK.TIMEOUT_ADDED"); 
        this.recentEvents.unshift(this.mapTimeoutToEvent(res || {
          duration: this.timeoutDuration, gameTime: this.gameTimeInput
        }));
        this.cdr.markForCheck();
      },
      error: (err) => { console.error(err); this.isSubmitting = false; this.showFeedback("LIVE_TRACKER.FEEDBACK.TIMEOUT_ERROR", true); }
    });
  }

  nextQuarter() {
    if (!this.match || this.isSubmitting) return;
    
    if (this.match.currentQuarter >= 4) {
       if (!confirm("Attention : Le match a déjà atteint les 4 quarts-temps réglementaires. Voulez-vous vraiment lancer les prolongations (Overtime) ?")) {
         return;
       }
    }

    this.isSubmitting = true;
    this.matchService.updateCurrentQuarter(this.match.id, this.match.currentQuarter + 1).subscribe({
      next: () => { 
        this.isSubmitting = false; 
        if (this.match) this.match.currentQuarter++;
        this.cdr.markForCheck(); 
      },
      error: (err) => { console.error(err); this.isSubmitting = false; this.showFeedback("LIVE_TRACKER.FEEDBACK.UPDATE_ERROR", true); }
    });
  }

  finishMatch() {
    if (!this.match || this.isSubmitting) return;
    this.isSubmitting = true;
    this.matchService.updateMatchStatus(this.match.id, true).subscribe({
      next: () => { 
        this.isSubmitting = false; 
        if (this.match) this.match.status = MatchStatus.Finished;
        this.showFeedback("LIVE_TRACKER.FEEDBACK.MATCH_FINISHED");
        this.cdr.markForCheck(); 
      },
      error: (err) => { console.error(err); this.isSubmitting = false; this.showFeedback("LIVE_TRACKER.FEEDBACK.UPDATE_ERROR", true); }
    });
  }

  ngOnDestroy(): void {
    if (this.scoreSubscription) {
      this.scoreSubscription.unsubscribe();
    }
  }
}
