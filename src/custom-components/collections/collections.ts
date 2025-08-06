import { Component, computed, effect, inject, InjectionToken, input, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { ButtonComponent, HorizontalDividerComponent, ListItemComponent, PopoverComponent, PopoverContentComponent } from '@sinequa/ui';

import { DeleteCollectionDialog } from './dialogs/delete.dialog';
import { Basket, DrawerStackService, UserSettingsStore } from '@sinequa/atomic-angular';

export type CollectionsConfig = {
  itemsPerPage?: number;
  showLoadMore?: boolean;
  routerLink?: string;
};

export const COLLECTIONS_OPTIONS: CollectionsConfig = {
  itemsPerPage: 10,
  showLoadMore: false,
  routerLink: '/widgets/collections'
};

export const COLLECTIONS_CONFIG = new InjectionToken<CollectionsConfig>('Collections options', {
  factory: () => COLLECTIONS_OPTIONS
});

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [TranslocoPipe, RouterLink, HorizontalDividerComponent, DeleteCollectionDialog, ButtonComponent, ListItemComponent, PopoverContentComponent],
  templateUrl: './collections.html',
  styleUrls: ['../list-widget.component.css'],
  providers: [provideTranslocoScope('collections')]
})
export class CollectionsComponent {
  floating = inject(PopoverComponent, { skipSelf: true, optional: true });

  private readonly userSettingsStore = inject(UserSettingsStore);
  private readonly drawerStack = inject(DrawerStackService);
  private readonly router = inject(Router);

  options = input<CollectionsConfig>();
  config = inject(COLLECTIONS_CONFIG);

  public range = signal<number>(10);
  protected collections = computed<Basket[]>(() => this.userSettingsStore.baskets());
  public paginatedCollections = computed<Basket[]>(() => this.collections().slice(0, this.range()));
  public hasMore = computed<boolean>(() => this.collections().length > 0 && this.range() < this.collections().length);

  readonly deleteCollectionDialog = viewChild(DeleteCollectionDialog);

  constructor() {
    effect(() => {
      if (this.options()) {
        this.config = { ...this.config, ...this.options() };
        this.range.set(this.config.itemsPerPage ?? 10);
      }
    });
  }

  onClick(collection: Basket): void {
    this.drawerStack.closeAll();
    this.router.navigate(['/widgets'], { queryParams: { b: collection.name } });
  }

  public onDelete(collection: Basket, index: number, e: Event) {
    e.stopPropagation();
    this.deleteCollectionDialog()?.open(collection, index);
  }

  loadMore(e: Event) {
    e.stopPropagation();
    this.range.set(this.range() + (this.config.itemsPerPage ?? 10));
  }
}
