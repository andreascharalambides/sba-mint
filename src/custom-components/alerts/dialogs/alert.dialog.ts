import { Component, computed, inject, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import {
  ButtonComponent,
  ChevronRightIconComponent,
  CircleCheckIconComponent,
  DialogComponent,
  DialogContentComponent,
  DialogEvent,
  DialogFooterComponent,
  DialogHeaderComponent,
  DialogInterface,
  DialogTitleComponent,
  InputComponent,
  LoadingCircleIconComponent
} from '@sinequa/ui';
import { Alert, QueryParamsStore, QueryService, UserSettingsStore } from '@sinequa/atomic-angular';

@Component({
  selector: 'alert-dialog, alertdialog, AlertDialog',
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
    InputComponent,
    ChevronRightIconComponent,
    LoadingCircleIconComponent,
    CircleCheckIconComponent
  ],
  providers: [provideTranslocoScope('alerts')],
  template: `
    <dialog #dialog>
      <DialogHeader class="px-1">
        <DialogTitle>{{ 'alerts.createAlert' | transloco }}</DialogTitle>
      </DialogHeader>

      <DialogContent class="flex flex-col gap-2 overflow-auto px-1">
        <div class="mb-2">
          <label for="alertName" class="mb-1 block text-sm font-medium text-gray-700">{{ 'alerts.alertName' | transloco }}</label>
          <input
            id="alertName"
            name="alertName"
            type="text"
            autocomplete="off"
            spellcheck="false"
            [attr.aria-label]="'alerts.alertName' | transloco"
            [attr.placeholder]="'alerts.placeholder' | transloco"
            [ngModel]="alertName()"
            (ngModelChange)="alertName.set($event)" />
        </div>

        <div class="mb-2">
          <label class="mb-1 block text-sm font-medium text-gray-700" for="frequency">{{ 'alerts.alertFrequency' | transloco }}</label>
          <div class="relative">
            <select
              id="frequency"
              name="frequency"
              class="hover:outline-primary focus:outline-primary h-8 w-full appearance-none rounded-md border border-gray-200 bg-neutral-50 px-2 pr-8 hover:bg-white hover:outline focus:bg-white focus:outline"
              id="alertFrequency"
              [ngModel]="alertFrequency()"
              (ngModelChange)="alertFrequency.set($event)">
              @for (frequencyValue of frequencies; track $index) {
                <option [value]="frequencyValue">{{ 'alerts.frequency.' + frequency[frequencyValue] | transloco }}</option>
              }
            </select>
            <ChevronRight width="16" height="16" class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rotate-90 transform text-gray-400" />
          </div>
        </div>

        <div class="mb-2">
          <p class="mb-2 block text-sm font-medium text-gray-700">{{ 'alerts.repeatOn' | transloco }}</p>
          <div class="weekdays-grid gap-1.5 px-2.5 py-0">
            @for (day of weekdays; track $index) {
              <div>
                <input class="me-1" type="checkbox" id="day_{{ day.value }}" [checked]="dayChecked(day.value)" (change)="dayChange($event, day.value)" />
                <label role="button" for="day_{{ day.value }}" class="form-check-label user-select-none cursor-pointer">{{
                  'alerts.weekdays.' + day.key | transloco
                }}</label>
              </div>
            }
          </div>
        </div>

        <div class="mb-6">
          <label class="mb-1 block text-sm font-medium text-gray-700" for="alertTimes">Time</label>
          <input
            type="time"
            id="alertTimes"
            name="alertTimes"
            class="inline-block w-full"
            autocomplete="off"
            spellcheck="off"
            [value]="alertTimes()"
            [ngModel]="alertTimes()"
            (ngModelChange)="alertTimes.set($event)" />
        </div>

        <div class="mb-6">
          <input class="me-1" type="checkbox" id="alertActive" [checked]="alertActive()" (change)="alertActive.set(!alertActive())" />
          <label role="button" for="alertActive" class="form-check-label user-select-none cursor-pointer">{{ 'alerts.alertActive' | transloco }}</label>
        </div>
      </DialogContent>

      <DialogFooter class="flex-col">
        @if (alert || canUpdateQuery()) {
          <div class="flex w-full flex-col gap-2">
            @if (alert) {
              <button variant="outline" (click)="execute($event)" [disabled]="!canUpdateQuery()">
                {{ 'alerts.execute' | transloco }}
              </button>
            }
            @if (canUpdateQuery()) {
              <button [disabled]="updateStatus() !== 'idle'" variant="outline" (click)="updateQuery()">
                @switch (updateStatus()) {
                  @case ('updating') {
                    <LoadingCircle class="size-4 animate-spin" width="16" height="16" />
                    {{ 'alerts.updateQuery' | transloco }}
                  }
                  @case ('updated') {
                    <CircleCheck width="16" height="16" />
                    {{ 'alerts.queryUpdated' | transloco }}
                  }
                  @default {
                    {{ 'alerts.updateQuery' | transloco }}
                  }
                }
              </button>
            }
          </div>
        }
        <div class="ml-auto flex justify-end gap-2">
          <button variant="outline" (click)="dialog.cancel($event)">
            {{ 'cancel' | transloco }}
          </button>
          <button (click)="confirm($event)" [disabled]="invalidForm()">
            {{ 'confirm' | transloco }}
          </button>
        </div>
      </DialogFooter>
    </dialog>
  `,
  styles: `
    .weekdays-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
  `
})
export class AlertDialog implements DialogInterface {
  private readonly queryService = inject(QueryService);
  private readonly queryParamsStore = inject(QueryParamsStore);
  private readonly userSettingsStore = inject(UserSettingsStore);
  readonly dialog = viewChild<DialogComponent>(DialogComponent);

  frequencies = [Alert.Frequency.Daily, Alert.Frequency.Hourly, Alert.Frequency.Immediate];
  frequency = Alert.Frequency;
  weekdays = [
    { key: 'monday', value: Alert.Days.Monday },
    { key: 'tuesday', value: Alert.Days.Tuesday },
    { key: 'wednesday', value: Alert.Days.Wednesday },
    { key: 'thursday', value: Alert.Days.Thursday },
    { key: 'friday', value: Alert.Days.Friday },
    { key: 'saturday', value: Alert.Days.Saturday },
    { key: 'sunday', value: Alert.Days.Sunday }
  ];

  index?: number;
  alert?: Alert;

  alertName = signal<string>('');
  alertFrequency = signal<Alert.Frequency>(Alert.Frequency.Daily);
  alertDays = signal<Alert.Days>(Alert.Days.None);
  alertTimes = signal<string>('09:00');
  alertActive = signal<boolean>(true);
  canUpdateQuery = signal<boolean>(false);

  updateStatus = signal<'updating' | 'updated' | 'idle'>('idle');

  invalidForm = computed(() => !this.alertName() || !this.alertTimes());

  closed = output<DialogEvent>();

  open(index: number): void {
    this.showModal(index);
  }

  async showModal(index?: number) {
    this.index = index;

    if (index !== undefined) {
      this.alert = this.userSettingsStore.alerts()[index];
      if (this.alert) {
        this.alertName.set(this.alert.name);
        this.alertFrequency.set(this.alert.frequency);
        this.alertDays.set(this.alert.days);
        this.alertTimes.set(this.alert.times);
        this.alertActive.set(this.alert.active);

        const q = this.queryParamsStore.getQuery();
        const response = await firstValueFrom(this.queryService.search(q, false));
        this.canUpdateQuery.set(response.records?.length > 0);
      }
    } else {
      this.alertName.set('');
      this.alertFrequency.set(Alert.Frequency.Daily);
      this.alertDays.set(Alert.Days.None);
      this.alertTimes.set('09:00');
      this.alertActive.set(true);
    }

    this.dialog()!.open();
  }

  async confirm(e: Event): Promise<void> {
    if (this.alert) {
      this.update();
    } else {
      this.create();
    }
    this.dialog()!.close(e);
  }

  private async create(): Promise<void> {
    const alert: Alert = {
      name: this.alertName(),
      description: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      query: this.queryParamsStore.getQuery(),
      frequency: this.alertFrequency(),
      days: this.alertDays(),
      interval: 1,
      index: 1,
      times: this.alertTimes(),
      active: this.alertActive(),
      combine: true,
      respectTabSelection: false
    };

    this.userSettingsStore.createAlert(alert);
  }

  private async update(): Promise<void> {
    this.alert!.name = this.alertName();
    this.alert!.frequency = this.alertFrequency();
    this.alert!.days = this.alertDays();
    this.alert!.times = this.alertTimes();
    this.alert!.active = this.alertActive();

    this.userSettingsStore.updateAlert(this.alert!, this.index!);
  }

  dayChecked(day: Alert.Days): boolean {
    return (this.alertDays() & day) !== 0;
  }

  dayChange(event: Event, day: Alert.Days) {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.alertDays.set(this.alertDays() | day);
    } else {
      this.alertDays.set(this.alertDays() & ~day);
    }
  }

  updateQuery() {
    this.updateStatus.set('updating');
    this.alert!.query = this.queryParamsStore.getQuery();
    this.userSettingsStore
      .updateAlert(this.alert!, this.index!)
      .then(() => {
        setTimeout(() => {
          this.updateStatus.set('updated');
        }, 500); // 500ms delay before setting to 'updated'
      })
      .then(() => {
        setTimeout(() => {
          this.updateStatus.set('idle');
        }, 2000);
      });
  }

  execute(e: Event) {
    const q = this.alert!.query;
    const filters = Array.isArray(q.filters) ? q.filters : undefined;
    this.queryParamsStore.patch({ text: q.text, tab: q.tab, basket: q.basket, sort: q.sort, filters, name: q.name });
    this.dialog()!.close(e);
  }
}
