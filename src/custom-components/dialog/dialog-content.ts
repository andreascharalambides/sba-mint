import { Directive } from '@angular/core';

@Directive({
  selector: 'DialogContent',
  standalone: true,
  host: {
    class: 'self-stretch'
  }
})
export class DialogContentComponent {}
