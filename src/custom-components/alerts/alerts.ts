import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { Query } from '@sinequa/atomic';
import { ButtonComponent, DialogService, HorizontalDividerComponent, ListItemComponent, PopoverComponent } from '@sinequa/ui';

import { AlertDialog } from './dialogs/alert.dialog';
import { Alert, buildQuery, UserSettingsStore } from '@sinequa/atomic-angular';

@Component({
  selector: 'Alerts',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, HorizontalDividerComponent, ListItemComponent, DragDropModule],
  templateUrl: './alerts.html',
  providers: [provideTranslocoScope('alerts')]
})
export class AlertsComponent {
  floating = inject(PopoverComponent, { skipSelf: true, optional: true });
  private readonly userSettingsStore = inject(UserSettingsStore);
  modal = inject(DialogService);

  readonly alertFormDialog = viewChild(AlertDialog);

  reordering = signal<boolean>(false);
  protected alerts = computed<Alert[]>(() => this.userSettingsStore.alerts());

  tmpAlerts: Alert[] = [];
  query: Query;

  constructor() {
    this.query = buildQuery();

    effect(() => {
      this.tmpAlerts = this.alerts()?.map(a => Object.assign({}, a));
    });
  }

  onClick(index: number): void {
    this.floating?.close();
    this.modal.open(AlertDialog, index).then(v => console.log('result', v));
  }

  createAlert(): void {
    this.floating?.close();
    this.modal.open(AlertDialog).then(v => console.log('result', v));
  }

  deleteAlert(event: Event, index: number) {
    event.stopPropagation();
    this.userSettingsStore.deleteAlert(index);
  }

  async reorder() {
    if (this.reordering()) {
      await this.userSettingsStore.updateAlerts(this.tmpAlerts);
      this.reordering.set(false);
    } else {
      this.reordering.set(true);
    }
  }

  dropped(drop: CdkDragDrop<Alert[]>) {
    if (drop.currentIndex === drop.previousIndex) {
      return;
    }
    this.tmpAlerts.splice(drop.currentIndex, 0, this.tmpAlerts.splice(drop.previousIndex, 1)[0]);
  }
}
