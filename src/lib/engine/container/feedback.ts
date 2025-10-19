import type { ExcalidrawElement, Theme } from '../elements/types';
import type { Bounds } from './autoResize';
import {
  PREVIEW_STROKE_COLOR,
  PREVIEW_FILL_COLOR,
  CONTAINER_BORDER_COLOR,
  CONTAINER_BORDER_WIDTH,
  ANIMATION_DURATION
} from './constants';

export interface AnimationState {
  startBounds: Bounds;
  endBounds: Bounds;
  startTime: number;
  duration: number;
}

export function easeOutCubic(t: number): number {
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

export function renderContainerPreview(
  ctx: CanvasRenderingContext2D,
  container: ExcalidrawElement,
  targetBounds: Bounds,
  progress: number = 1
) {
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

  if (container.type === 'rectangle') {
    const radius = Math.min(interpolated.width, interpolated.height) * 0.12;
    const x = interpolated.x;
    const y = interpolated.y;
    const w = interpolated.width;
    const h = interpolated.height;
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
  } else if (container.type === 'ellipse') {
    const centerX = interpolated.x + interpolated.width / 2;
    const centerY = interpolated.y + interpolated.height / 2;
    const radiusX = interpolated.width / 2;
    const radiusY = interpolated.height / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  }

  ctx.fill();
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
}

export function renderHierarchyIndicator(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement,
  _theme: Theme,
  zoom: number
) {
  if (element.childrenIds.length === 0) {
    return;
  }

  ctx.save();

  ctx.strokeStyle = CONTAINER_BORDER_COLOR;
  ctx.lineWidth = CONTAINER_BORDER_WIDTH / zoom;
  ctx.setLineDash([]);

  const padding = 4 / zoom;
  const x = element.x - padding;
  const y = element.y - padding;
  const w = element.width + padding * 2;
  const h = element.height + padding * 2;

  if (element.type === 'rectangle') {
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
    ctx.stroke();
  } else if (element.type === 'ellipse') {
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const radiusX = w / 2;
    const radiusY = h / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
  }

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
