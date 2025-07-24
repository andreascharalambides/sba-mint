import { ChangeDetectorRef, Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { Basket, DeleteCollectionDialog, TranslocoDateImpurePipe, UserSettingsStore } from '@sinequa/atomic-angular';
import { ButtonComponent } from '@sinequa/ui';

@Component({
  selector: 'Collections',
  imports: [RouterModule, FormsModule, TranslocoPipe, DragDropModule, DeleteCollectionDialog, ButtonComponent],
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.css'],
  providers: [TranslocoDateImpurePipe]
})
export class CollectionsComponent {
  readonly router = inject(Router);
  readonly userSettingsStore = inject(UserSettingsStore);
  readonly transloco = inject(TranslocoService);
  readonly renameInput = viewChild<ElementRef>('renameInput');
  readonly createInput = viewChild<ElementRef>('createInput');

  collectionName = signal<string>('');
  newCollectionName = signal<string>('');
  creating = signal<boolean>(false);
  modifiedIndex = signal<number | undefined>(undefined);

  readonly deleteCollectionDialog = viewChild(DeleteCollectionDialog);

  tmpCollections: Basket[] = [];

  constructor(cdr: ChangeDetectorRef) {
    effect(() => {
      const baskets = this.userSettingsStore.baskets();
      this.tmpCollections = baskets.map(c => Object.assign({}, c));
      cdr.markForCheck();
    });
  }

  dropped(drop: CdkDragDrop<Basket[]>) {
    if (drop.currentIndex === drop.previousIndex) {
      return;
    }
    this.tmpCollections.splice(drop.currentIndex, 0, this.tmpCollections.splice(drop.previousIndex, 1)[0]);
    this.save();
  }

  onClick(collection: Basket): void {
    this.router.navigate(['/search'], { queryParams: { b: collection.name } });
  }

  onEdit(collection: Basket, index: number): void {
    if (this.modifiedIndex() === index) return;

    this.collectionName.set(collection.name);
    this.modifiedIndex.set(index);
    setTimeout(() => {
      this.renameInput()?.nativeElement.focus();
    });
  }

  onCreate(): void {
    if (this.creating()) return this.creating.set(false);

    this.creating.set(true);
    setTimeout(() => {
      this.createInput()?.nativeElement.focus();
    }, 1);
  }

  onBlur(e: Event): void {
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  onSaveEdit(): void {
    if (this.collectionName() && this.modifiedIndex() !== undefined) {
      const collection = this.tmpCollections[this.modifiedIndex()!];
      const modifiedName = collection.name !== this.collectionName();
      if (modifiedName) {
        collection.name = this.collectionName();
        this.save();
      }
    }
    this.modifiedIndex.set(undefined);
  }

  onCancelEdit(): void {
    // Simply exit edit mode without saving
    this.modifiedIndex.set(undefined);
    this.collectionName.set('');
  }

  postCreate(): void {
    if (this.newCollectionName()) {
      const collection: Basket = { name: this.newCollectionName() };
      this.userSettingsStore.createBasket(collection);
      this.newCollectionName.set('');
      this.creating.set(false);
    }
  }

  deleteCollection(collection: Basket, index: number) {
    this.deleteCollectionDialog()?.open(collection, index);
  }

  async create(): Promise<void> {
    if (!this.collectionName()) return;
    await this.userSettingsStore.createBasket({ name: this.collectionName() });
  }

  async save(): Promise<void> {
    await this.userSettingsStore.updateBaskets(this.tmpCollections);
  }
}
