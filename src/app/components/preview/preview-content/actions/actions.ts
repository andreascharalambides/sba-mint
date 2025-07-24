import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { PreviewService } from '@sinequa/atomic-angular';
import { ButtonComponent } from '@sinequa/ui';

@Component({
  selector: 'preview-actions',
  imports: [TranslocoPipe, ButtonComponent],
  templateUrl: './actions.html',
  styleUrls: ['./actions.css']
})
export class PreviewActionsComponent {
  protected readonly extracts = signal(true);
  protected readonly entities = signal(false);

  private readonly previewService = inject(PreviewService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const controller = new AbortController();

    window.addEventListener(
      'message',
      (event: MessageEvent) => {
        const message = event.data;
        if (message.type === 'selected-position') {
          this.previewService.toggle(this.extracts(), this.entities());
        }

        if (message.type === 'ready') {
          this.previewService.toggle(this.extracts(), this.entities());
        }
      },
      { signal: controller.signal }
    );

    this.destroyRef.onDestroy(() => controller.abort());
  }

  public zoomIn(): void {
    this.previewService.zoomIn();
  }

  public zoomOut(): void {
    this.previewService.zoomOut();
  }

  toggleExtracts() {
    const value = !this.extracts();
    this.extracts.set(value);
    if (value === true) {
      this.entities.set(false);
    }
    this.previewService.toggle(this.extracts(), this.entities());
    this.previewService.sendMessage({ action: 'unselect' });
  }

  toggleEntities() {
    const value = !this.entities();
    this.entities.set(value);
    if (value === true) {
      this.extracts.set(false);
    }
    this.previewService.toggle(this.extracts(), this.entities());
    this.previewService.sendMessage({ action: 'unselect' });
  }
}
