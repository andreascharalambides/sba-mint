import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Point } from '../../utils/point';
import { CanvasService, GRID_SIZE, snapPointToGrid } from '../../services/canvas.service';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasContent') canvasContent!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasBackground') canvasBackground!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private isDragging = false;
  private dragStartPosition: Point | null = null;
  private isMovingWidget = false;
  private widgetStartPosition: Point | null = null;

  editMode$ = this.canvasService.editMode$;
  translation$ = this.canvasService.translation$;
  scale$ = this.canvasService.scale$;

  constructor(private canvasService: CanvasService) {}

  ngAfterViewInit(): void {
    this.setupTransformations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupTransformations(): void {
    this.canvasService.translation$.pipe(takeUntil(this.destroy$)).subscribe(translation => this.applyTransform());

    this.canvasService.scale$.pipe(takeUntil(this.destroy$)).subscribe(scale => this.applyTransform());
  }

  private applyTransform(): void {
    if (!this.canvasContent || !this.canvasBackground) return;

    const translation = this.canvasService.getTranslation();
    const scale = this.canvasService.getScale();

    const transform = `translate3d(${translation.x}px, ${translation.y}px, 0) scale3d(${scale}, ${scale}, 1)`;
    this.canvasContent.nativeElement.style.transform = transform;

    // Update background for parallax effect
    const bgX = translation.x;
    const bgY = translation.y;
    this.canvasBackground.nativeElement.style.backgroundPosition = `${bgX}px ${bgY}px`;

    const gridSize = Math.max(8, 20 * scale);
    this.canvasBackground.nativeElement.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();

    const isTrackpad = Math.abs(event.deltaY) <= 40 || event.deltaX !== 0;
    const oldScale = this.canvasService.getScale();
    const translation = this.canvasService.getTranslation();

    const mousePos = new Point(event.clientX, event.clientY);
    const zoomOrigin = mousePos.sub(translation);

    let newScale = oldScale;
    if (isTrackpad) {
      if (event.ctrlKey) {
        newScale -= oldScale * event.deltaY * 0.005;
      } else {
        this.canvasService.updateTranslation(translation.sub(event.deltaX, event.deltaY));
        return;
      }
    } else {
      newScale -= oldScale * (event.deltaY > 0 ? 1 : -1) * 0.1;
    }

    this.canvasService.updateScale(newScale);
    this.canvasService.updateTranslation(translation.add(zoomOrigin.mul(1 - newScale / oldScale)));
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;

    const position = new Point(event.clientX, event.clientY);
    this.dragStartPosition = position;

    const element = event.target as HTMLElement;
    const widgetElement = element.closest('.widget-wrapper');

    if (widgetElement) {
      const widgetId = widgetElement.getAttribute('data-widget-id');
      if (widgetId && this.canvasService.getEditMode()) {
        this.canvasService.selectWidget(widgetId);
        this.isMovingWidget = true;
        // Get widget start position
        const widgets = this.canvasService['widgetsSubject'].value;
        const widget = widgets.get(widgetId);
        if (widget) {
          this.widgetStartPosition = new Point(widget.position.x, widget.position.y);
        }
      }
    } else {
      if (this.canvasService.getEditMode()) {
        this.canvasService.selectWidget(null);
      }
      this.isDragging = true;
      document.body.style.cursor = 'grabbing';
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.dragStartPosition) return;

    const currentPosition = new Point(event.clientX, event.clientY);
    const delta = currentPosition.sub(this.dragStartPosition);

    if (this.isDragging) {
      const translation = this.canvasService.getTranslation();
      this.canvasService.updateTranslation(translation.add(delta));
      this.dragStartPosition = currentPosition;
    } else if (this.isMovingWidget && this.widgetStartPosition && this.canvasService.getEditMode()) {
      const scale = this.canvasService.getScale();
      const canvasDelta = delta.div(scale);
      const newPosition = this.widgetStartPosition.add(canvasDelta);

      const selectedWidget = this.canvasService['selectedWidgetSubject'].value;
      if (selectedWidget) {
        this.canvasService.updateWidget(selectedWidget, newPosition);
      }
    }
  }

  onMouseUp(): void {
    if (this.isMovingWidget && this.canvasService.getEditMode()) {
      const selectedWidget = this.canvasService['selectedWidgetSubject'].value;
      if (selectedWidget) {
        const widgets = this.canvasService['widgetsSubject'].value;
        const widget = widgets.get(selectedWidget);
        if (widget) {
          const snappedPosition = snapPointToGrid(widget.position);
          this.canvasService.updateWidget(selectedWidget, snappedPosition);
        }
      }
    }

    this.isDragging = false;
    this.dragStartPosition = null;
    this.isMovingWidget = false;
    this.widgetStartPosition = null;
    document.body.style.cursor = 'default';
  }

  onMouseLeave(): void {
    this.onMouseUp();
  }
}
