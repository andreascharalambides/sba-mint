import { Component, inject, HostBinding } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';

import { PageHeaderComponent } from '@sinequa/ui';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AppSidebarComponent } from '../../components/sidebar/sidebar.component';
import { CanvasService } from '../../services/canvas.service';

@Component({
  selector: 'app-search-layout',
  imports: [CommonModule, RouterOutlet, PageHeaderComponent, NavbarComponent, AppSidebarComponent],
  template: `
    <app-navbar class="navbar" [showEditToggle]="true" [editMode]="(editMode$ | async) || false" (toggleEditMode)="toggleEditMode()" />

    <router-outlet />

    <div class="bottom-bar-container">
      <app-sidebar />
    </div>
  `,
  styleUrls: ['./layout.css'],
  host: {
    class: 'search-layout-host'
  },
  providers: [provideTranslocoScope('bookmarks', 'saved-searches', 'recent-searches', 'collections', 'alerts')]
})
export class SearchLayoutComponent {
  private canvasService = inject(CanvasService);

  editMode$ = this.canvasService.editMode$;

  @HostBinding('class.edit-mode')
  get isEditMode(): boolean {
    return this.canvasService.getEditMode();
  }

  toggleEditMode(): void {
    this.canvasService.toggleEditMode();
  }
}
