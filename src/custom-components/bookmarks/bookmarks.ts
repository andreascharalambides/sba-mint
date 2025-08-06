import { Component, computed, DestroyRef, effect, inject, InjectionToken, input, signal } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { RouterLink } from '@angular/router';
import { LegacyFilter, Query } from '@sinequa/atomic';
import { ButtonComponent, HorizontalDividerComponent, ListItemComponent, PopoverContentComponent } from '@sinequa/ui';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppStore, Bookmark, DrawerStackService, QueryService, UserSettingsStore } from '@sinequa/atomic-angular';

export type BookmarksConfig = {
  itemsPerPage?: number;
  showLoadMore?: boolean;
  routerLink?: string;
};

export const BOOKMARKS_OPTIONS: BookmarksConfig = {
  itemsPerPage: 10,
  showLoadMore: true,
  routerLink: '/widgets/bookmarks'
};

export const BOOKMARKS_CONFIG = new InjectionToken<BookmarksConfig>('Bookmarks options', {
  factory: () => BOOKMARKS_OPTIONS
});

@Component({
  selector: 'bookmarks, Bookmarks',
  standalone: true,
  imports: [TranslocoPipe, RouterLink, ButtonComponent, HorizontalDividerComponent, ListItemComponent],
  providers: [provideTranslocoScope('bookmarks')],
  templateUrl: './bookmarks.html',
  styleUrls: ['../list-widget.component.css']
})
export class BookmarksComponent {
  floating = inject(PopoverContentComponent, { skipSelf: true, optional: true });

  private readonly drawerStack = inject(DrawerStackService);
  private readonly queryService = inject(QueryService);
  private readonly userSettingsStore = inject(UserSettingsStore);
  private readonly appStore = inject(AppStore);

  private destroyRef = inject(DestroyRef);

  options = input<BookmarksConfig>();
  config = inject(BOOKMARKS_CONFIG);

  public range = signal<number>(10);
  protected bookmarks = computed<Bookmark[]>(() => this.userSettingsStore.bookmarks());
  public paginatedBookmarks = computed<Bookmark[]>(() => this.bookmarks().slice(0, this.range()));
  public hasMore = computed<boolean>(() => this.bookmarks().length > 0 && this.range() < this.bookmarks().length);

  constructor() {
    effect(() => {
      if (this.options()) {
        this.config = { ...this.config, ...this.options() };
        this.range.set(this.config.itemsPerPage ?? 10);
      }
    });
  }

  public onClick(bookmark: Bookmark): void {
    const query: Partial<Query> = {
      name: bookmark.queryName,
      filters: {
        field: 'id',
        value: bookmark.id
      } as LegacyFilter
    };

    if (!bookmark.queryName) {
      this.performSecondSearch(query);
      return;
    }

    this.queryService
      .search(query, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result.records || result.records.length === 0) {
          this.performSecondSearch(query);
          return;
        }

        this.drawerStack.replace(result.records[0]);
      });
  }

  private performSecondSearch(query: Partial<Query>): void {
    query.name = this.appStore.getDefaultQuery()?.name;
    this.queryService
      .search(query, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result.records || result.records.length === 0) {
          // notify.warning('This bookmark is outdated and cannot be opened', { description: 'no record found!', duration: 2000 });
          return;
        }

        this.drawerStack.replace(result.records[0]);
      });
  }

  public onDelete(bookmark: Bookmark, e: Event) {
    e.stopPropagation();
    this.userSettingsStore.unbookmark(bookmark.id);
    // notify.success('Bookmark removed', { duration: 2000 });
  }

  loadMore(e: Event) {
    e.stopPropagation();
    this.range.set(this.range() + (this.config.itemsPerPage ?? 10));
  }
}
