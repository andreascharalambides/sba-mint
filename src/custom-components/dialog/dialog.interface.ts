import { OutputEmitterRef } from '@angular/core';

export type DialogEvent = 'dialog-close' | 'dialog-cancel' | 'dialog-confirm' | 'dialog-no' | 'dialog-yes';

export type DialogResult = DialogEvent | { type: DialogEvent; [key: string]: any };

export interface DialogInterface {
  open(...args: any[]): void;
  closed?: OutputEmitterRef<DialogResult>;
}
