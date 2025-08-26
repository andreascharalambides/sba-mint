import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Point } from '../../utils/point';
import { CanvasService, WidgetData, snapToGrid } from '../../services/canvas.service';

@Component({
  selector: 'app-widget-wrapper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-wrapper.component.html',
  styleUrls: ['./widget-wrapper.component.css']
})
export class WidgetWrapperComponent implements AfterViewInit, OnDestroy {
  @Input() widgetId!: string;
  @ViewChild('widgetElement') widgetElement!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private isResizing = false;
  private resizeStartPos: Point | null = null;
  private initialSize = { width: 0, height: 0 };

  widget?: WidgetData;
  isSelected = false;
  editMode = false;

  constructor(private canvasService: CanvasService) {}

  ngAfterViewInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    this.canvasService.widgets$.pipe(takeUntil(this.destroy$)).subscribe(widgets => {
      this.widget = widgets.get(this.widgetId);
      this.updatePosition();
    });

    this.canvasService.selectedWidget$.pipe(takeUntil(this.destroy$)).subscribe(selectedId => {
      this.isSelected = selectedId === this.widgetId;
    });

    this.canvasService.editMode$.pipe(takeUntil(this.destroy$)).subscribe(editMode => {
      this.editMode = editMode;
    });
  }

  private updatePosition(): void {
    if (!this.widget || !this.widgetElement) return;

    const element = this.widgetElement.nativeElement;
    element.style.transform = `translate(${this.widget.position.x}px, ${this.widget.position.y}px)`;
    element.style.width = `${this.widget.width}px`;
    element.style.height = `${this.widget.height}px`;
  }

  onResizeStart(event: MouseEvent): void {
    if (!this.editMode || !this.widget) return;

    event.stopPropagation();
    this.isResizing = true;
    this.resizeStartPos = new Point(event.clientX, event.clientY);
    this.initialSize = { width: this.widget.width, height: this.widget.height };
    document.body.style.cursor = 'nwse-resize';

    const handleResize = (e: MouseEvent) => {
      if (!this.isResizing || !this.resizeStartPos || !this.widget) return;

      const currentPos = new Point(e.clientX, e.clientY);
      const delta = currentPos.sub(this.resizeStartPos);
      const scale = this.canvasService.getScale();
      const scaledDelta = delta.div(scale);

      const minSize = snapToGrid(100);
      const newWidth = Math.max(this.initialSize.width + scaledDelta.x, minSize);
      const newHeight = Math.max(this.initialSize.height + scaledDelta.y, minSize);

      this.canvasService.updateWidget(this.widgetId, this.widget.position, { width: newWidth, height: newHeight });
    };

    const handleResizeEnd = () => {
      if (this.isResizing && this.widget) {
        const snappedWidth = snapToGrid(this.widget.width);
        const snappedHeight = snapToGrid(this.widget.height);
        this.canvasService.updateWidget(this.widgetId, this.widget.position, { width: snappedWidth, height: snappedHeight });
      }

      this.isResizing = false;
      this.resizeStartPos = null;
      document.body.style.cursor = 'default';

      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  }
}
