import type { ExcalidrawElement } from '../elements/types';
import type { Bounds } from './autoResize';
import {
  PREVIEW_STROKE_COLOR,
  PREVIEW_FILL_COLOR,
  CONTAINER_BORDER_COLOR,
  ANIMATION_DURATION,
  DROP_TARGET_COLOR,
  DROP_TARGET_FILL,
  DROP_TARGET_WIDTH,
  DROP_TARGET_DASH,
  DETACH_INDICATOR_COLOR,
  DETACH_INDICATOR_WIDTH,
  DETACH_INDICATOR_DASH
} from './constants';

export interface AnimationState {
  startBounds: Bounds;
  endBounds: Bounds;
  startTime: number;
  duration: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function interpolateBounds(
  startBounds: Bounds,
  endBounds: Bounds,
  progress: number
): Bounds {
  const easedProgress = easeOutCubic(progress);

  return {
    x: startBounds.x + (endBounds.x - startBounds.x) * easedProgress,
    y: startBounds.y + (endBounds.y - startBounds.y) * easedProgress,
    width: startBounds.width + (endBounds.width - startBounds.width) * easedProgress,
    height: startBounds.height + (endBounds.height - startBounds.height) * easedProgress
  };
}

function renderRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const radius = Math.min(w, h) * 0.12;
  const r = Math.min(radius, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function renderEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const radiusX = w / 2;
  const radiusY = h / 2;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
}

function renderShape(
  ctx: CanvasRenderingContext2D,
  type: 'rectangle' | 'ellipse',
  bounds: Bounds
) {
  if (type === 'rectangle') {
    renderRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height);
  } else {
    renderEllipse(ctx, bounds.x, bounds.y, bounds.width, bounds.height);
  }
}

export function renderContainerPreview(
  ctx: CanvasRenderingContext2D,
  container: ExcalidrawElement,
  targetBounds: Bounds,
  progress: number = 1
) {
  if (container.type !== 'rectangle' && container.type !== 'ellipse') {
    return;
  }

  const currentBounds: Bounds = {
    x: container.x,
    y: container.y,
    width: container.width,
    height: container.height
  };

  const interpolated = interpolateBounds(currentBounds, targetBounds, progress);

  ctx.save();
  ctx.strokeStyle = PREVIEW_STROKE_COLOR;
  ctx.fillStyle = PREVIEW_FILL_COLOR;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);

  renderShape(ctx, container.type, interpolated);

  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function renderHierarchyIndicator(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement,
  zoom: number
) {
  if (element.childrenIds.length === 0 || (element.type !== 'rectangle' && element.type !== 'ellipse')) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = CONTAINER_BORDER_COLOR;
  ctx.lineWidth = 2.5 / zoom;
  ctx.setLineDash([6 / zoom, 3 / zoom]);

  const padding = 4 / zoom;
  const bounds: Bounds = {
    x: element.x - padding,
    y: element.y - padding,
    width: element.width + padding * 2,
    height: element.height + padding * 2
  };

  renderShape(ctx, element.type, bounds);
  ctx.stroke();
  ctx.restore();
}

export function createAnimationState(
  startBounds: Bounds,
  endBounds: Bounds,
  duration: number = ANIMATION_DURATION
): AnimationState {
  return {
    startBounds,
    endBounds,
    startTime: Date.now(),
    duration
  };
}

export function getAnimationProgress(animation: AnimationState): number {
  const elapsed = Date.now() - animation.startTime;
  return Math.min(1, elapsed / animation.duration);
}

export function isAnimationComplete(animation: AnimationState): boolean {
  return getAnimationProgress(animation) >= 1;
}

export function renderDropTargetHighlight(
  ctx: CanvasRenderingContext2D,
  container: ExcalidrawElement,
  zoom: number
) {
  if (container.type !== 'rectangle' && container.type !== 'ellipse') {
    return;
  }

  ctx.save();
  ctx.strokeStyle = DROP_TARGET_COLOR;
  ctx.fillStyle = DROP_TARGET_FILL;
  ctx.lineWidth = DROP_TARGET_WIDTH / zoom;
  ctx.setLineDash(DROP_TARGET_DASH.map(v => v / zoom));

  const padding = 8 / zoom;
  const bounds: Bounds = {
    x: container.x - padding,
    y: container.y - padding,
    width: container.width + padding * 2,
    height: container.height + padding * 2
  };

  renderShape(ctx, container.type, bounds);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function renderDetachIndicator(
  ctx: CanvasRenderingContext2D,
  container: ExcalidrawElement,
  zoom: number
) {
  if (container.type !== 'rectangle' && container.type !== 'ellipse') {
    return;
  }

  ctx.save();
  ctx.strokeStyle = DETACH_INDICATOR_COLOR;
  ctx.lineWidth = DETACH_INDICATOR_WIDTH / zoom;
  ctx.setLineDash(DETACH_INDICATOR_DASH.map(v => v / zoom));

  const padding = 6 / zoom;
  const bounds: Bounds = {
    x: container.x - padding,
    y: container.y - padding,
    width: container.width + padding * 2,
    height: container.height + padding * 2
  };

  renderShape(ctx, container.type, bounds);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
