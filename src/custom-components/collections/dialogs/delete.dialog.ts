import { Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideTranslocoScope, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  ButtonComponent,
  DialogComponent,
  DialogContentComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
  DialogInterface,
  DialogTitleComponent
} from '@sinequa/ui';
import { Basket, UserSettingsStore } from '@sinequa/atomic-angular';

@Component({
  selector: 'delete-collection-dialog',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoPipe,
    ButtonComponent,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogContentComponent,
    DialogFooterComponent
  ],
  providers: [provideTranslocoScope('collections')],
  template: `
    <dialog #dialog>
      <DialogHeader>
        <DialogTitle>{{ 'collections.deleteCollection' | transloco }}</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <p>{{ 'collections.confirmDelete' | transloco }} {{ collection()?.name }}?</p>
      </DialogContent>

      <DialogFooter>
        <button variant="outline" (click)="dialog.cancel($event)">
          {{ 'cancel' | transloco }}
        </button>

        <button variant="destructive" (click)="deleteCollection($event)">
          {{ 'delete' | transloco }}
        </button>
      </DialogFooter>
    </dialog>
  `
})
export class DeleteCollectionDialog implements DialogInterface {
  readonly dialog = viewChild<DialogComponent>(DialogComponent);

  private readonly userSettingsStore = inject(UserSettingsStore);
  private readonly translocoService = inject(TranslocoService);

  collection = signal<Basket | undefined>(undefined);
  index = signal<number | undefined>(undefined);

  open(collection: Basket, index: number) {
    this.collection.set(collection);
    this.index.set(index);
    this.dialog()!.showModal();
  }

  async deleteCollection(e: Event): Promise<void> {
    this.dialog()!.close(e);
    await this.userSettingsStore.deleteBasket(this.index()!);
    const message = this.translocoService.translate('collections.deleted');
    // notify.success(message, { duration: 2000 });
  }
}
