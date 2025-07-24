import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { PageHeaderComponent } from '@sinequa/ui';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AppSidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'widgets-layout',
  imports: [RouterOutlet, PageHeaderComponent, NavbarComponent, AppSidebarComponent],
  template: `
    <app-navbar class="navbar" />

    <router-outlet />
  `,
  styleUrls: ['./layout.css'],
  host: {
    class: 'widgets-layout'
  },
  providers: [provideTranslocoScope('bookmarks', 'saved-searches', 'recent-searches', 'collections', 'alerts')]
})
export class WidgetsLayoutComponent {}
