import { Component, computed, inject, signal, viewChild, viewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { getState } from '@ngrx/signals';

import { logout, setGlobalConfig } from '@sinequa/atomic';
import {
  AlertsComponent,
  BookmarksComponent,
  CollectionsComponent,
  OverrideUserDialogComponent,
  PrincipalStore,
  UserSettingsStore
} from '@sinequa/atomic-angular';

import {
  AvatarComponent,
  AvatarFallbackComponent,
  AvatarImageComponent,
  ChevronRightIconComponent,
  FlagEnglishIconComponent,
  FlagFrenchIconComponent,
  HorizontalDividerComponent,
  MenuComponent,
  MenuContentComponent,
  MenuItemComponent,
  UserRoundIconComponent
} from '@sinequa/ui';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavbarMenu } from '../navbar/navbar.component';
import { NgIf } from '@angular/common';
import { ResetUserSettingsDialogComponent } from '../../../custom-components/reset-user-settings.dialog';

@Component({
  selector: 'app-user-menu',
  imports: [
    FormsModule,
    MenuComponent,
    MenuContentComponent,
    MenuItemComponent,
    HorizontalDividerComponent,
    TranslocoPipe,
    OverrideUserDialogComponent,
    ResetUserSettingsDialogComponent,
    FlagEnglishIconComponent,
    FlagFrenchIconComponent,
    UserRoundIconComponent,
    ChevronRightIconComponent,
    AvatarComponent,
    AvatarImageComponent,
    AvatarFallbackComponent,
    NgIf
  ],
  templateUrl: './user-menu.html',
  styleUrls: ['./user-menu.css'],
  providers: [provideTranslocoScope('user-menu')]
})
export class UserMenuComponent {
  readonly menus = viewChildren(MenuComponent);
  readonly overrideUserDialog = viewChild(OverrideUserDialogComponent);
  readonly resetUserSettingsDialog = viewChild(ResetUserSettingsDialogComponent);

  private readonly router = inject(Router);
  private readonly principalStore = inject(PrincipalStore);
  private readonly userSettingsStore = inject(UserSettingsStore);
  private readonly transloco = inject(TranslocoService);

  readonly user = computed(() => {
    const principal = getState(this.principalStore).principal;
    return principal;
  });

  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  svgCache = new Map<string, SafeHtml>();

  loadSvg(path: string): void {
    if (!this.svgCache.has(path)) {
      this.http.get(path, { responseType: 'text' }).subscribe(svg => {
        const modifiedSvg = svg.replace(/fill="#[^"]*"/g, 'fill="currentColor"');
        this.svgCache.set(path, this.sanitizer.bypassSecurityTrustHtml(modifiedSvg));
      });
    }
  }

  getSvg(path: string): SafeHtml | null {
    this.loadSvg(path); // Load if not cached
    return this.svgCache.get(path) || null;
  }

  protected readonly userIcon = './../../assets/icons/user.svg';

  readonly allowUserOverride = computed(() => this.principalStore.allowUserOverride());
  readonly isOverridingUser = computed(() => this.principalStore.isOverridingUser());

  changeLanguage(lang: string) {
    this.userSettingsStore.updateLanguage(lang);

    if (this.transloco.getActiveLang() !== lang) this.transloco.setActiveLang(lang);
  }

  navigateToBookmarks() {
    this.router.navigate(['/widgets/bookmarks']);
  }

  navigateToCollections() {
    this.router.navigate(['/widgets/collections']);
  }

  handleLogout() {
    setGlobalConfig({ userOverrideActive: false, userOverride: undefined });
    logout().then(() => this.router.navigate(['/logout']));
  }

  handleOverride() {
    this.overrideUserDialog()?.open();
  }

  handleOverrideUser() {
    this.overrideUserDialog()?.handleOverrideUser();
  }

  handleResetUserSettings() {
    this.resetUserSettingsDialog()?.open();
  }

  openSinequa() {
    window.open('https://sinequa.com', '_blank', 'noopener');
  }
}
