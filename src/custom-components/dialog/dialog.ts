import { Component, computed, ElementRef, inject, input, output, signal } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';

import { DialogEvent } from './dialog.interface';
import { cn } from '@sinequa/ui';

export const dialogVariants = cva(
  '', // Base classes now handled in CSS
  {
    variants: {
      variant: {
        default: '', // Default styling in CSS
        primary: 'bg-primary-dialog border-primary',
        secondary: 'bg-secondary-dialog border-secondary',
        destructive: 'bg-destructive-dialog border-destructive',
        ai: 'dialog-ai',
        outline: 'dialog-outline',
        ghost: 'dialog-ghost',
        none: 'dialog-none'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export type DialogVariants = VariantProps<typeof dialogVariants>;

@Component({
  selector: 'dialog',
  standalone: true,
  templateUrl: './dialog.html',
  styleUrls: ['./dialog.css'],
  host: {
    '[class]': `variants()`,
    '(close)': 'close($event)'
  }
})
export class DialogComponent {
  cn = cn;

  closed = output<DialogEvent>();

  class = input<string>();
  variant = input<DialogVariants['variant']>('default');

  variants = computed(() => {
    return cn(dialogVariants({ variant: this.variant(), class: this.class() }));
  });

  dialog = inject<ElementRef<HTMLDialogElement>>(ElementRef);

  isOpen = signal(false);

  /**
   * Opens the dialog by displaying the modal.
   *
   * @remarks
   * This method triggers the dialog to become visible by calling the `showModal` method.
   *
   * @public
   */
  open() {
    this.showModal();
  }

  /**
   * Opens the dialog modal by setting the `isOpen` state to `true` and invoking the native `showModal()` method
   * on the dialog element, if it exists.
   *
   * @remarks
   * This method assumes that `dialog` is a reference to a native dialog element and `isOpen` is a state management property.
   */
  showModal() {
    this.isOpen.set(true);
    this.dialog?.nativeElement.showModal();
  }

  /**
   * Closes the dialog and emits a close event.
   *
   * This method performs the following actions:
   * - Sets the `isOpen` state to `false`.
   * - Calls the native `close()` method on the dialog element, if available.
   * - Emits the `closed` event with the specified event type.
   * - Dispatches a JavaScript event of the given type on the document.
   *
   * @param eventType - The type of event to emit and dispatch. Defaults to `'dialog-close'`.
   */
  close(e: Event, eventType: DialogEvent = 'dialog-close') {
    this.isOpen.set(false);
    this.dialog?.nativeElement.close();
    this.closed.emit(eventType);
    // dispatch a javascript event
    document.dispatchEvent(new Event(eventType));
  }

  cancel(e: Event, eventType: DialogEvent = 'dialog-cancel') {
    this.close(e, eventType);
  }
}
