import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'nba_livescore_favorites';
  private favoritesSubject = new BehaviorSubject<number[]>(this.loadFavorites());

  public favorites$ = this.favoritesSubject.asObservable();

  constructor() { }

  private loadFavorites(): number[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveFavorites(favorites: number[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    this.favoritesSubject.next(favorites);
  }

  public getFavorites(): number[] {
    return this.favoritesSubject.getValue();
  }

  public addFavorite(teamId: number): void {
    const current = this.getFavorites();
    if (!current.includes(teamId)) {
      this.saveFavorites([...current, teamId]);
    }
  }

  public removeFavorite(teamId: number): void {
    const current = this.getFavorites();
    this.saveFavorites(current.filter(id => id !== teamId));
  }

  public toggleFavorite(teamId: number): void {
    if (this.isFavorite(teamId)) {
      this.removeFavorite(teamId);
    } else {
      this.addFavorite(teamId);
    }
  }

  public isFavorite(teamId: number): boolean {
    return this.getFavorites().includes(teamId);
  }
}
