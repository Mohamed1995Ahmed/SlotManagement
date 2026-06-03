import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageSwitcherComponent } from './shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LanguageSwitcherComponent],
  template: `
    <div class="top-bar">
      <app-language-switcher />
    </div>
    <router-outlet />
  `,
  styles: [`
    .top-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 0.5rem 1.5rem;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 100;
    }
  `]
})
export class AppComponent {}
