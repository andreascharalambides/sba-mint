import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { getState } from '@ngrx/signals';

import { CCApp, getHelpIndexUrl } from '@sinequa/atomic';
import { AppStore, PrincipalStore } from '@sinequa/atomic-angular';
import { cn, SidebarComponent, SidebarItemComponent } from '@sinequa/ui';

import { APP_FEATURES } from '../../tokens';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, SidebarComponent, SidebarItemComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class AppSidebarComponent {
  cn = cn;
  private readonly appStore = inject(AppStore);
  private readonly principalStore = inject(PrincipalStore);
  private readonly transloco = inject(TranslocoService);
  private readonly appFeatures = inject(APP_FEATURES);
  private readonly router = inject(Router);
  isSlideUp = signal(false);
  private hoverTimeout?: ReturnType<typeof setTimeout>;

  readonly isAdmin = computed(() => this.principalStore.principal().isAdministrator || this.principalStore.principal().isDelegatedAdmin);

  readonly instanceId = computed(() => {
    const {
      assistant: { usePrefixName = true }
    } = this.appFeatures;
    if (usePrefixName) {
      const { name } = getState(this.appStore) as CCApp;
      return `${name}-standalone-assistant`;
    } else {
      return 'standalone-assistant';
    }
  });

  protected readonly allowAI = computed(() => {
    return !!this.appStore.isAssistantAllowed(this.instanceId());
  });

  // Detect page type for different sidebar behaviors
  readonly pageType = computed(() => {
    const currentUrl = this.router.url;

    if (currentUrl === '/home' || currentUrl.startsWith('/home')) {
      return 'home';
    } else if (currentUrl.startsWith('/search')) {
      return 'search';
    } else if (currentUrl.startsWith('/assistant')) {
      return 'assistant';
    }

    return 'other';
  });

  // Determine if sidebar should have slide behavior
  readonly shouldSlide = computed(() => {
    return this.pageType() === 'search' || this.pageType() === 'assistant';
  });

  // Mouse event handlers for slide behavior
  onMouseEnter() {
    if (!this.shouldSlide()) return;

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = undefined;
    }
    this.isSlideUp.set(true);
  }

  onMouseLeave() {
    if (!this.shouldSlide()) return;

    this.hoverTimeout = setTimeout(() => {
      this.isSlideUp.set(false);
    }, 300); // Shorter delay for better UX
  }

  openHelp() {
    const url = getHelpIndexUrl(this.transloco.getActiveLang(), {
      folder: 'mint-search',
      path: '/r/_sinequa/webpackages/help',
      indexFile: 'olh-index.html',
      useLocale: true,
      useLocaleAsPrefix: true
    });
    window.open(url, '_blank', 'noopener');
  }

  openAdmin() {
    window.open(`${window.location.origin}/admin`, '_blank', 'noopener');
  }
}
