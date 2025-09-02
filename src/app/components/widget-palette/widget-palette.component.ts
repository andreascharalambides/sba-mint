import { Component, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasService } from '../../services/canvas.service';
import { Point } from '../../utils/point';

interface WidgetType {
  id: 'assistant' | 'explore' | 'preview';
  label: string;
  icon: string;
  isVisible: boolean;
}

@Component({
  selector: 'app-widget-palette',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-palette.component.html',
  styleUrls: ['./widget-palette.component.css']
})
export class WidgetPaletteComponent {
  @ViewChild('dragPreview', { static: false }) dragPreview?: ElementRef;

  private canvasService = inject(CanvasService);

  widgetTypes: WidgetType[] = [
    { id: 'assistant', label: 'Assistant', icon: 'message', isVisible: true },
    { id: 'explore', label: 'Explore', icon: 'globe', isVisible: true },
    { id: 'preview', label: 'Preview', icon: 'eye', isVisible: true }
  ];

  editMode$ = this.canvasService.editMode$;

  constructor() {
    this.canvasService.widgets$.subscribe(widgets => {
      this.widgetTypes.forEach(type => {
        const widget = widgets.get(type.id);
        type.isVisible = widget?.visible || false;
      });
    });
  }

  onDragStart(event: DragEvent, widgetType: WidgetType): void {
    if (!widgetType.isVisible) {
      event.dataTransfer!.effectAllowed = 'copy';
      event.dataTransfer!.setData('widgetType', widgetType.id);
      this.canvasService.setDraggedWidgetType(widgetType.id);

      const preview = this.createDragPreview(widgetType);
      document.body.appendChild(preview);
      event.dataTransfer!.setDragImage(preview, 200, 300);

      setTimeout(() => {
        document.body.removeChild(preview);
      }, 0);
    } else {
      event.preventDefault();
    }
  }

  private createDragPreview(widgetType: WidgetType): HTMLElement {
    const preview = document.createElement('div');
    preview.className = 'widget-drag-preview';
    preview.style.position = 'absolute';
    preview.style.top = '-1000px';
    preview.style.left = '-1000px';
    preview.style.width = '400px';
    preview.style.height = '600px';
    preview.style.background = 'var(--glass-background)';
    preview.style.backdropFilter = 'var(--glass-backdrop-blur)';
    preview.style.borderRadius = 'var(--radius-md)';
    preview.style.display = 'flex';
    preview.style.flexDirection = 'column';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';
    preview.style.gap = '8px';
    preview.style.padding = '12px';
    preview.style.boxShadow = 'var(--shadow-lg)';
    preview.style.opacity = '0.9';

    const icon = document.createElement('div');
    icon.innerHTML = this.getIconSvg(widgetType.icon);
    icon.style.width = '24px';
    icon.style.height = '24px';
    icon.style.color = 'var(--primary-02)';

    const label = document.createElement('div');
    label.textContent = widgetType.label;
    label.style.fontSize = '12px';
    label.style.fontWeight = '500';
    label.style.color = 'var(--primary-00)';

    preview.appendChild(icon);
    preview.appendChild(label);

    return preview;
  }

  private getIconSvg(type: string): string {
    switch (type) {
      case 'message':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4.3677 19.6879C3.76259 19.8166 3.24667 19.2392 3.44239 18.6523L4.17411 16.4584C4.25283 16.2223 4.21494 15.9643 4.08599 15.7515C2.03689 12.3701 2.98681 8.14241 6.39736 5.72365C9.92063 3.22596 14.9807 3.43069 18.2332 6.20302C21.4856 8.97634 21.9253 13.4594 19.2614 16.6901C16.653 19.8534 11.8577 20.8577 7.94531 19.0965C7.78303 19.0234 7.60184 19.0002 7.42777 19.0372L4.3677 19.6879Z" fill="currentColor" stroke="currentColor" stroke-width="1"/>
        </svg>`;
      case 'globe':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15.924 13.8C15.996 13.206 16.05 12.612 16.05 12C16.05 11.388 15.996 10.794 15.924 10.2H18.966C19.11 10.776 19.2 11.379 19.2 12C19.2 12.621 19.11 13.224 18.966 13.8M14.331 18.804C14.871 17.805 15.285 16.725 15.573 15.6H18.228C17.3561 17.1014 15.9727 18.2388 14.331 18.804ZM14.106 13.8H9.894C9.804 13.206 9.75 12.612 9.75 12C9.75 11.388 9.804 10.785 9.894 10.2H14.106C14.187 10.785 14.25 11.388 14.25 12C14.25 12.612 14.187 13.206 14.106 13.8ZM12 19.164C11.253 18.084 10.65 16.887 10.281 15.6H13.719C13.35 16.887 12.747 18.084 12 19.164ZM8.4 8.4H5.772C6.63478 6.89433 8.01719 5.75512 9.66 5.196C9.12 6.195 8.715 7.275 8.4 8.4ZM5.772 15.6H8.4C8.715 16.725 9.12 17.805 9.66 18.804C8.02044 18.2391 6.63986 17.1014 5.772 15.6ZM5.034 13.8C4.89 13.224 4.8 12.621 4.8 12C4.8 11.379 4.89 10.776 5.034 10.2H8.076C8.004 10.794 7.95 11.388 7.95 12C7.95 12.612 8.004 13.206 8.076 13.8M12 4.827C12.747 5.907 13.35 7.113 13.719 8.4H10.281C10.65 7.113 11.253 5.907 12 4.827ZM18.228 8.4H15.573C15.2909 7.28545 14.8738 6.20949 14.331 5.196C15.987 5.763 17.364 6.906 18.228 8.4ZM12 3C7.023 3 3 7.05 3 12C3 14.3869 3.94821 16.6761 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C14.3869 21 16.6761 20.0518 18.364 18.364C20.0518 16.6761 21 14.3869 21 12C21 10.8181 20.7672 9.64778 20.3149 8.55585C19.8626 7.46392 19.1997 6.47177 18.364 5.63604C17.5282 4.80031 16.5361 4.13738 15.4442 3.68508C14.3522 3.23279 13.1819 3 12 3Z" fill="currentColor"/>
        </svg>`;
      case 'eye':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 21C4.45 21 3.97933 20.8043 3.588 20.413C3.19667 20.0217 3.00067 19.5507 3 19V5C3 4.45 3.196 3.97933 3.588 3.588C3.98 3.19667 4.45067 3.00067 5 3H19C19.55 3 20.021 3.196 20.413 3.588C20.805 3.98 21.0007 4.45067 21 5V19C21 19.55 20.8043 20.021 20.413 20.413C20.0217 20.805 19.5507 21.0007 19 21H5ZM5 19H19V7H5V19ZM12 17C10.6333 17 9.41267 16.6293 8.338 15.888C7.26333 15.1467 6.484 14.184 6 13C6.48333 11.8167 7.26267 10.8543 8.338 10.113C9.41333 9.37167 10.634 9.00067 12 9C13.366 8.99933 14.587 9.37033 15.663 10.113C16.739 10.8557 17.518 11.818 18 13C17.5167 14.1833 16.7377 15.146 15.663 15.888C14.5883 16.63 13.3673 17.0007 12 17ZM12 14.5C11.5833 14.5 11.2293 14.3543 10.938 14.063C10.6467 13.7717 10.5007 13.4173 10.5 13C10.4993 12.5827 10.6453 12.2287 10.938 11.938C11.2307 11.6473 11.5847 11.5013 12 11.5C12.4153 11.4987 12.7697 11.6447 13.063 11.938C13.3563 12.2313 13.502 12.5853 13.5 13C13.498 13.4147 13.3523 13.769 13.063 14.063C12.7737 14.357 12.4193 14.5027 12 14.5ZM12 15.5C12.7 15.5 13.2917 15.2583 13.775 14.775C14.2583 14.2917 14.5 13.7 14.5 13C14.5 12.3 14.2583 11.7083 13.775 11.225C13.2917 10.7417 12.7 10.5 12 10.5C11.3 10.5 10.7083 10.7417 10.225 11.225C9.74167 11.7083 9.5 12.3 9.5 13C9.5 13.7 9.74167 14.2917 10.225 14.775C10.7083 15.2583 11.3 15.5 12 15.5Z" fill="currentColor"/>
        </svg>`;
      default:
        return '';
    }
  }

  onDragEnd(): void {
    this.canvasService.setDraggedWidgetType(null);
  }

  addWidget(widgetType: WidgetType): void {
    if (!widgetType.isVisible) {
      this.canvasService.addWidget(widgetType.id);
    }
  }
}
