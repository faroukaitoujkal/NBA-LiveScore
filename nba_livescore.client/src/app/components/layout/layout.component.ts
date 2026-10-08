import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {
  isMenuOpen = false;

  constructor(
    public translate: TranslateService,
    public themeService: ThemeService
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }
}
