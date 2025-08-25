import { Component, inject } from '@angular/core';

import { DialogComponent } from './dialog';
import { XMarkIConComponent } from '@sinequa/ui';

@Component({
  selector: 'DialogHeader',
  standalone: true,
  imports: [XMarkIConComponent],
  template: `
    <div class="header-container">
      <h1 class="header-title"><ng-content select="DialogTitle" /></h1>
      <button size="icon" class="close-button" (click)="dialog.close($event)">
        <xmark class="close-icon" />
      </button>
    </div>
    <ng-content />
  `,
  styles: [
    `
      /* Host styles */
      :host {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: var(--spacing-sm);
        align-self: stretch;
      }

      /* Header container */
      .header-container {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
      }

      /* Header title */
      .header-title {
        font-size: var(--text-2xl);
        font-weight: var(--font-medium);
        letter-spacing: 0;
        color: var(--grays-00);
      }

      /* Close button */
      .close-button {
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .close-button:hover {
        transform: scale(1.1);
      }

      .close-button:active {
        transform: scale(0.95);
      }

      /* Close icon */
      .close-icon {
        width: 1.5rem;
        height: 1.5rem;
        color: var(--grays-00) !important;
      }
    `
  ]
})
export class DialogHeaderComponent {
  dialog = inject(DialogComponent);
}
