import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule, FormsModule],
  templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit {
  isMenuOpen = false;
  isAdmin = false;
  showAdminModal = false;
  adminKeyInput = '';
  isLoggingIn = false;

  constructor(
    public translate: TranslateService,
    public themeService: ThemeService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.checkAdminStatus();
  }

  checkAdminStatus() {
    const key = localStorage.getItem('adminApiKey');
    if (key) {
      this.http.post(`${environment.apiUrl}/auth/verify`, {}, { headers: { 'X-API-Key': key } }).subscribe({
        next: () => this.isAdmin = true,
        error: () => {
          this.isAdmin = false;
          localStorage.removeItem('adminApiKey');
        }
      });
    }
  }

  promptAdminKey() {
    if (this.isAdmin) {
      if (confirm(this.translate.instant('ADMIN.LOGOUT_CONFIRM'))) {
        localStorage.removeItem('adminApiKey');
        this.isAdmin = false;
        window.location.reload();
      }
      return;
    }

    this.showAdminModal = true;
    this.adminKeyInput = '';
  }

  closeAdminModal() {
    this.showAdminModal = false;
    this.adminKeyInput = '';
  }

  submitAdminKey() {
    if (!this.adminKeyInput.trim()) return;
    
    this.isLoggingIn = true;
    this.http.post(`${environment.apiUrl}/auth/verify`, {}, { headers: { 'X-API-Key': this.adminKeyInput } }).subscribe({
      next: () => {
        localStorage.setItem('adminApiKey', this.adminKeyInput);
        this.isAdmin = true;
        this.showAdminModal = false;
        this.isLoggingIn = false;
        window.location.reload();
      },
      error: () => {
        alert(this.translate.instant('ADMIN.LOGIN_ERROR'));
        this.isLoggingIn = false;
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }
}
