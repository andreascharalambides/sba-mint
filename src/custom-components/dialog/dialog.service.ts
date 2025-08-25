import { ApplicationRef, ComponentRef, createComponent, Injectable, Type } from '@angular/core';
import { DialogInterface, DialogResult } from './dialog.interface';

/**
 * Service for dynamically creating and managing dialog components.
 *
 * The `DialogService` allows you to open dialog components at runtime,
 * attach them to the DOM, and handle their lifecycle and close events.
 *
 * @example
 * ```typescript
 * const result = await dialogService.open(MyDialogComponent, { data: 'example' });
 * ```
 *
 * @template U - The type of dialog component that implements `DialogInterface`.
 */
@Injectable({
  providedIn: 'root'
})
export class DialogService {
  protected dialogRef?: ComponentRef<DialogInterface>;

  constructor(private appRef: ApplicationRef) {}

  open<T extends DialogResult>(componentType: Type<DialogInterface>, args?: unknown): Promise<T> {
    this.removeDialog();

    this.dialogRef = createComponent(componentType, {
      environmentInjector: this.appRef.injector
    });

    document.body.appendChild(this.dialogRef.location.nativeElement);
    this.appRef.attachView(this.dialogRef.hostView);

    this.dialogRef.instance.open(args);

    return new Promise<T>(resolve => {
      const subscription = this.dialogRef?.instance.closed?.subscribe((e: DialogResult) => {
        this.removeDialog();
        resolve(e as T);
        subscription?.unsubscribe();
      });
    });
  }

  protected removeDialog() {
    // remove previous dialog if exists
    if (this.dialogRef) {
      this.appRef.detachView(this.dialogRef.hostView);
      this.dialogRef.destroy();
      this.dialogRef.changeDetectorRef.detectChanges();
    }
  }
}
