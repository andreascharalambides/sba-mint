import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Point } from '../utils/point';

export interface WidgetData {
  id: string;
  position: Point;
  width: number;
  height: number;
}

export const GRID_SIZE = 20;

export const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

export const snapPointToGrid = (point: Point): Point => {
  return new Point(snapToGrid(point.x), snapToGrid(point.y));
};

// Responsive configuration
interface ResponsiveConfig {
  widgetWidthPercent: number; // Percentage of viewport width
  widgetHeightPercent: number; // Percentage of viewport height
  minWidgetWidth: number; // Minimum widget width
  maxWidgetWidth: number; // Maximum widget width
  minWidgetHeight: number; // Minimum widget height
  maxWidgetHeight: number; // Maximum widget height
  paddingPercent: number; // Padding as percentage of widget width
}

const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  widgetWidthPercent: 0.3, // 28% of viewport width
  widgetHeightPercent: 0.85, // 75% of viewport height
  minWidgetWidth: 320, // Minimum 320px width
  maxWidgetWidth: 600, // Maximum 600px width
  minWidgetHeight: 400, // Minimum 400px height
  maxWidgetHeight: 1000, // Maximum 1000px height
  paddingPercent: 0.05 // 5% of widget width as padding
};

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  private editModeSubject = new BehaviorSubject<boolean>(false);
  private translationSubject = new BehaviorSubject<Point>(new Point(window.innerWidth / 2, window.innerHeight / 2));
  private scaleSubject = new BehaviorSubject<number>(1);
  private selectedWidgetSubject = new BehaviorSubject<string | null>(null);
  private widgetsSubject = new BehaviorSubject<Map<string, WidgetData>>(new Map());

  private responsiveConfig: ResponsiveConfig = DEFAULT_RESPONSIVE_CONFIG;

  public editMode$ = this.editModeSubject.asObservable();
  public translation$ = this.translationSubject.asObservable();
  public scale$ = this.scaleSubject.asObservable();
  public selectedWidget$ = this.selectedWidgetSubject.asObservable();
  public widgets$ = this.widgetsSubject.asObservable();

  constructor() {
    // Initialize widget positions
    this.initializeWidgetPositions();

    // Listen for window resize events to update layout
    this.setupResponsiveHandling();
  }

  private setupResponsiveHandling(): void {
    fromEvent(window, 'resize')
      .pipe(debounceTime(250)) // Debounce resize events
      .subscribe(() => {
        this.updateResponsiveLayout();
      });
  }

  private calculateResponsiveDimensions(): { width: number; height: number; padding: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate base dimensions
    let widgetWidth = viewportWidth * this.responsiveConfig.widgetWidthPercent;
    let widgetHeight = viewportHeight * this.responsiveConfig.widgetHeightPercent;

    // Apply min/max constraints
    widgetWidth = Math.max(this.responsiveConfig.minWidgetWidth, Math.min(this.responsiveConfig.maxWidgetWidth, widgetWidth));
    widgetHeight = Math.max(this.responsiveConfig.minWidgetHeight, Math.min(this.responsiveConfig.maxWidgetHeight, widgetHeight));

    // Snap to grid
    widgetWidth = snapToGrid(widgetWidth);
    widgetHeight = snapToGrid(widgetHeight);

    // Calculate padding
    const padding = Math.max(GRID_SIZE * 2, widgetWidth * this.responsiveConfig.paddingPercent);

    return {
      width: widgetWidth,
      height: widgetHeight,
      padding: snapToGrid(padding)
    };
  }

  private initializeWidgetPositions(): void {
    const viewportCenterX = 0;
    const viewportCenterY = 0;
    const dimensions = this.calculateResponsiveDimensions();

    const widgets = new Map<string, WidgetData>();

    // Assistant widget - left side
    widgets.set('assistant', {
      id: 'assistant',
      position: new Point(snapToGrid(viewportCenterX - dimensions.width * 1.5 - dimensions.padding), snapToGrid(viewportCenterY - dimensions.height / 2)),
      width: dimensions.width,
      height: dimensions.height
    });

    // Explore widget - center
    widgets.set('explore', {
      id: 'explore',
      position: new Point(snapToGrid(viewportCenterX - dimensions.width / 2), snapToGrid(viewportCenterY - dimensions.height / 2)),
      width: dimensions.width,
      height: dimensions.height
    });

    // Preview widget - right side
    widgets.set('preview', {
      id: 'preview',
      position: new Point(snapToGrid(viewportCenterX + dimensions.width * 0.5 + dimensions.padding), snapToGrid(viewportCenterY - dimensions.height / 2)),
      width: dimensions.width,
      height: dimensions.height
    });

    this.widgetsSubject.next(widgets);
  }

  private updateResponsiveLayout(): void {
    const dimensions = this.calculateResponsiveDimensions();
    const widgets = new Map(this.widgetsSubject.value);
    const viewportCenterX = 0;
    const viewportCenterY = 0;

    // Update each widget's dimensions and positions relative to their original layout
    widgets.forEach((widget, id) => {
      widget.width = dimensions.width;
      widget.height = dimensions.height;

      // Recalculate positions to maintain relative layout
      switch (id) {
        case 'assistant':
          widget.position = new Point(
            snapToGrid(viewportCenterX - dimensions.width * 1.5 - dimensions.padding),
            snapToGrid(viewportCenterY - dimensions.height / 2)
          );
          break;
        case 'explore':
          widget.position = new Point(snapToGrid(viewportCenterX - dimensions.width / 2), snapToGrid(viewportCenterY - dimensions.height / 2));
          break;
        case 'preview':
          widget.position = new Point(
            snapToGrid(viewportCenterX + dimensions.width * 0.5 + dimensions.padding),
            snapToGrid(viewportCenterY - dimensions.height / 2)
          );
          break;
      }
    });

    this.widgetsSubject.next(widgets);
  }

  // Method to update responsive configuration if needed
  updateResponsiveConfig(config: Partial<ResponsiveConfig>): void {
    this.responsiveConfig = { ...this.responsiveConfig, ...config };
    this.updateResponsiveLayout();
  }

  // Method to get current responsive dimensions (useful for other components)
  getCurrentDimensions(): { width: number; height: number; padding: number } {
    return this.calculateResponsiveDimensions();
  }

  toggleEditMode(): void {
    const currentMode = this.editModeSubject.value;
    this.editModeSubject.next(!currentMode);
    if (!currentMode) {
      this.selectedWidgetSubject.next(null);
    }
  }

  setEditMode(mode: boolean): void {
    this.editModeSubject.next(mode);
    if (!mode) {
      this.selectedWidgetSubject.next(null);
    }
  }

  updateTranslation(translation: Point): void {
    this.translationSubject.next(translation);
  }

  updateScale(scale: number): void {
    const boundedScale = Math.min(Math.max(scale, 0.1), 7.5);
    this.scaleSubject.next(boundedScale);
  }

  selectWidget(widgetId: string | null): void {
    this.selectedWidgetSubject.next(widgetId);
  }

  updateWidget(widgetId: string, position: Point, size?: { width: number; height: number }): void {
    const widgets = new Map(this.widgetsSubject.value);
    const widget = widgets.get(widgetId);
    if (widget) {
      widget.position = position;
      if (size) {
        widget.width = size.width;
        widget.height = size.height;
      }
      widgets.set(widgetId, widget);
      this.widgetsSubject.next(widgets);
    }
  }

  getTranslation(): Point {
    return this.translationSubject.value;
  }

  getScale(): number {
    return this.scaleSubject.value;
  }

  getEditMode(): boolean {
    return this.editModeSubject.value;
  }
}
