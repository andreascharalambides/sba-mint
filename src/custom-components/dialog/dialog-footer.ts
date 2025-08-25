import { Directive } from '@angular/core';

@Directive({
  selector: 'DialogFooter',
  standalone: true,
  host: {
    class: 'w-full flex justify-end items-center self-strect gap-2'
  }
})
export class DialogFooterComponent {}
