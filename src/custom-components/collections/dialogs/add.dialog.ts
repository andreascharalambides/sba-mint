import { Component, computed, ElementRef, inject, linkedSignal, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { getState } from '@ngrx/signals';

import { Article, bisect } from '@sinequa/atomic';
import { Basket, QueryParamsStore, UserSettingsStore } from '@sinequa/atomic-angular';
import { ButtonComponent, InputComponent, ListItemComponent } from '@sinequa/ui';
import { DialogTitleComponent } from '../../dialog/dialog-title';
import { DialogComponent } from '../../dialog/dialog';
import { DialogHeaderComponent } from '../../dialog/dialog-header';
import { DialogContentComponent } from '../../dialog/dialog-content';
import { DialogFooterComponent } from '../../dialog/dialog-footer';
import { DialogInterface, DialogResult } from '../../dialog/dialog.interface';

@Component({
  selector: 'add-to-collection-dialog',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoPipe,
    ButtonComponent,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogContentComponent,
    DialogFooterComponent,
    ListItemComponent,
    InputComponent
  ],
  providers: [provideTranslocoScope('collections')],
  template: `
    <dialog #dialog (closed)="closeBtn.click()">
      <DialogHeader>
        <DialogTitle>{{ 'collections.addToCollection' | transloco }}</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <ul class="flex flex-col" role="list">
          @for (collection of collections(); track $index) {
            <li role="listitem" (click)="addToCollection(collection, $index)">
              @if (collectionsMap()[collection.name] === 'all') {
                <i class="fa-fw fa-regular fa-square-check"></i>
              } @else if (collectionsMap()[collection.name] === 'some') {
                <i class="fa-fw fa-regular fa-square-minus"></i>
              } @else {
                <i class="fa-fw fa-regular fa-square"></i>
              }
              {{ collection.name }}
            </li>
          } @empty {
            <li class="py-4 text-center text-neutral-500">
              {{ 'collections.noCollections' | transloco }}
            </li>
          }
        </ul>

        @if (creating()) {
          <input
            #createInput
            class="mt-2"
            type="text"
            autocomplete="off"
            spellcheck="false"
            [attr.aria-label]="'collections.collectionName' | transloco"
            [attr.placeholder]="'collections.collectionName' | transloco"
            [ngModel]="newCollectionName()"
            (ngModelChange)="newCollectionName.set($event)"
            (keydown.escape)="$event.preventDefault(); creating.set(false)"
            (keydown.enter)="createCollection()" />
        }
      </DialogContent>

      <DialogFooter class="flex flex-col">
        <div class="flex w-full gap-1">
          <button
            variant="outline"
            class="grow"
            tabindex="0"
            [attr.title]="(creating() ? 'collections.cancelCreation' : 'collections.createCollection') | transloco"
            (click)="onCreate()">
            {{ (creating() ? 'collections.cancelCreation' : 'collections.createCollection') | transloco }}
          </button>
          @if (creating()) {
            <button class="grow" tabindex="0" [attr.title]="'collections.create' | transloco" [disabled]="!newCollectionName()" (click)="createCollection()">
              {{ 'collections.create' | transloco }}
            </button>
          }
        </div>
        <button #closeBtn (click)="onClose($event)" class="self-end">
          {{ 'collections.close' | transloco }}
        </button>
      </DialogFooter>
    </dialog>
  `
})
export class CollectionsDialog implements DialogInterface {
  readonly closed = output<DialogResult>();

  readonly createInputElement = viewChild<ElementRef<HTMLInputElement>>('createInput');
  readonly dialogElement = viewChild<DialogComponent>(DialogComponent);

  private readonly queryParamStore = inject(QueryParamsStore);
  private readonly userSettingsStore = inject(UserSettingsStore);

  readonly collection = signal<string | undefined>(undefined);

  readonly article = signal<Article[]>([]);
  readonly newCollectionName = signal<string>('');
  readonly creating = signal<boolean>(false);
  readonly removedFromCollection = signal<boolean>(false);
  readonly collections = computed<Basket[]>(() => this.userSettingsStore.baskets());
  // Compute map of collection names to their article inclusion status
  readonly collectionsMap = linkedSignal(() =>
    this.collections().reduce<Record<string, 'all' | 'some' | 'none'>>((acc, collection) => {
      acc[collection.name] = this.containsArticle(collection);
      return acc;
    }, {})
  );

  open(article: Article | Article[]): void {
    if (!Array.isArray(article)) this.article.set([article]);
    else this.article.set(article);

    const { basket } = getState(this.queryParamStore);
    this.collection.set(basket);

    this.dialogElement()!.showModal();
  }

  containsArticleByName(collectionName: string): boolean {
    const collection = this.collections().find(c => c.name === collectionName);
    return !!collection && this.containsArticle(collection) !== 'none';
  }

  containsArticle(collection: Basket): 'all' | 'some' | 'none' {
    let b = bisect(this.article(), a => !!collection.ids?.includes(a.id));

    if (b.false.length === 0) return 'all';
    else if (b.true.length === 0) return 'none';

    return 'some';
  }

  onCreate(): void {
    if (this.creating()) return this.creating.set(false);

    this.creating.set(true);

    // Focus the input element with a delay because the input element is not yet rendered
    setTimeout(() => {
      this.createInputElement()?.nativeElement.focus();
    }, 1);
  }

  async onClose(e: Event) {
    this.dialogElement()!.close(e);

    // if we removed the article from the current collection,
    // we notify it using the "dialog-confirm" event which can
    // be caught by the app to trigger a refresh
    if (this.removedFromCollection()) {
      this.closed.emit('dialog-confirm');
    }
  }

  async addToCollection(collection: Basket, collectionIndex: number): Promise<void> {
    const ids = this.article()
      .map(article => article.id)
      .filter(id => !!id);

    if (!ids || ids.length === 0) return;

    if (this.containsArticle(collection) !== 'none') {
      // remove it
      const articleIds = this.article().map(a => a.id);
      collection.ids = collection.ids?.filter(id => !articleIds.includes(id)) ?? [];
    } else {
      // add it
      if (!collection.ids) collection.ids = [];

      const uniqueIds = new Set([...(collection.ids ?? []), ...this.article().map(x => x.id)]);
      collection.ids.push(...Array.from(uniqueIds));
    }

    try {
      await this.userSettingsStore.updateBasket(collection, collectionIndex);
      this.removedFromCollection.set(!!this.collection() && !this.containsArticleByName(this.collection()!));
    } catch (e) {
      console.error('Error updating collection:', e);
    }
  }

  createCollection(): void {
    if (!this.newCollectionName()) return;

    const collection: Basket = { name: this.newCollectionName() };
    this.userSettingsStore.createBasket(collection);
    this.newCollectionName.set('');
    this.creating.set(false);
  }
}
