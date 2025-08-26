import { Component, inject, viewChild } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { ButtonComponent, DialogInterface } from '@sinequa/ui';
import { UserSettingsStore } from '@sinequa/atomic-angular';
import { DialogComponent } from './dialog/dialog';
import { DialogTitleComponent } from './dialog/dialog-title';
import { DialogHeaderComponent } from './dialog/dialog-header';
import { DialogFooterComponent } from './dialog/dialog-footer';
import { DialogContentComponent } from './dialog/dialog-content';

@Component({
  selector: 'reset-user-settings-dialog',
  standalone: true,
  imports: [ButtonComponent, DialogComponent, DialogTitleComponent, DialogContentComponent, DialogFooterComponent, DialogHeaderComponent, TranslocoPipe],
  providers: [provideTranslocoScope('dialogs')],
  template: `
    <dialog #dialog>
      <DialogHeader>
        <DialogTitle>{{ 'dialogs.resetUserSettings.title' | transloco }}</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <p>{{ 'dialogs.resetUserSettings.message' | transloco }}</p>
      </DialogContent>

      <DialogFooter>
        <button class="btn btn-secondary" (click)="dialog.close($event)">
          {{ 'cancel' | transloco }}
        </button>

        <button class="btn btn-destructive" (click)="handleResetUserSettings($event)">
          {{ 'delete' | transloco }}
        </button>
      </DialogFooter>
    </dialog>
  `
})
export class ResetUserSettingsDialogComponent implements DialogInterface {
  readonly dialog = viewChild<DialogComponent>(DialogComponent);

  private readonly userSettingsStore = inject(UserSettingsStore);
  private readonly translocoService = inject(TranslocoService);

  open() {
    this.dialog()!.showModal();
  }

  handleResetUserSettings(e: Event) {
    this.dialog()!.close(e);
    this.userSettingsStore.reset().then(() => {
      const message = this.translocoService.translate('dialogs.resetUserSettings.success');
      // notify.success(message, { duration: 2000 });
    });
  }
}
