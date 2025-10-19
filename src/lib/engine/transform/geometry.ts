import type { Point, ExcalidrawElement, TextElement } from '../elements/types';
import type { ResizeHandleType } from './handles';

/**
 * Calculate new dimensions when resizing from a specific handle
 */
export function calculateResize(
  element: ExcalidrawElement | TextElement,
  handleType: ResizeHandleType,
  startPoint: Point,
  currentPoint: Point,
  maintainAspectRatio: boolean = false
): { x: number; y: number; width: number; height: number } {
  const { x, y, width, height, angle } = element;

  // Calculate delta in world coordinates
  let dx = currentPoint.x - startPoint.x;
  let dy = currentPoint.y - startPoint.y;

  // If element is rotated, transform the delta
  if (angle !== 0) {
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const rotatedDx = dx * cos - dy * sin;
    const rotatedDy = dx * sin + dy * cos;
    dx = rotatedDx;
    dy = rotatedDy;
  }

  let newX = x;
  let newY = y;
  let newWidth = width;
  let newHeight = height;

  // Calculate minimum size
  const MIN_SIZE = 10;

  switch (handleType) {
    case 'nw':
      newX = x + dx;
      newY = y + dy;
      newWidth = width - dx;
      newHeight = height - dy;
      break;
    case 'n':
      newY = y + dy;
      newHeight = height - dy;
      break;
    case 'ne':
      newY = y + dy;
      newWidth = width + dx;
      newHeight = height - dy;
      break;
    case 'e':
      newWidth = width + dx;
      break;
    case 'se':
      newWidth = width + dx;
      newHeight = height + dy;
      break;
    case 's':
      newHeight = height + dy;
      break;
    case 'sw':
      newX = x + dx;
      newWidth = width - dx;
      newHeight = height + dy;
      break;
    case 'w':
      newX = x + dx;
      newWidth = width - dx;
      break;
  }

  // Maintain aspect ratio if requested (Shift key)
  if (maintainAspectRatio && (handleType === 'nw' || handleType === 'ne' || handleType === 'se' || handleType === 'sw')) {
    const aspectRatio = width / height;
    const newAspectRatio = Math.abs(newWidth / newHeight);

    if (newAspectRatio > aspectRatio) {
      // Width is proportionally larger, adjust it
      const adjustedWidth = Math.abs(newHeight) * aspectRatio;
      if (handleType === 'nw' || handleType === 'sw') {
        newX = x + width - adjustedWidth;
      }
      newWidth = adjustedWidth * Math.sign(newWidth);
    } else {
      // Height is proportionally larger, adjust it
      const adjustedHeight = Math.abs(newWidth) / aspectRatio;
      if (handleType === 'nw' || handleType === 'ne') {
        newY = y + height - adjustedHeight;
      }
      newHeight = adjustedHeight * Math.sign(newHeight);
    }
  }

  // Handle negative dimensions (flipping)
  if (newWidth < 0) {
    newX = newX + newWidth;
    newWidth = -newWidth;
  }
  if (newHeight < 0) {
    newY = newY + newHeight;
    newHeight = -newHeight;
  }

  // Enforce minimum size
  if (newWidth < MIN_SIZE) {
    newWidth = MIN_SIZE;
  }
  if (newHeight < MIN_SIZE) {
    newHeight = MIN_SIZE;
  }

  return { x: newX, y: newY, width: newWidth, height: newHeight };
}

/**
 * Calculate rotation angle from mouse position
 */
export function calculateRotation(
  element: ExcalidrawElement | TextElement,
  currentPoint: Point
): number {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;

  // Calculate angle from center to mouse position
  const angle = Math.atan2(currentPoint.y - centerY, currentPoint.x - centerX);

  // Adjust for initial rotation (handle is at top, which is -PI/2)
  return angle + Math.PI / 2;
}

/**
 * Snap rotation to 15-degree increments if shift is pressed
 */
export function snapRotation(angle: number, snapToGrid: boolean = false): number {
  if (!snapToGrid) return angle;

  const snapIncrement = (15 * Math.PI) / 180; // 15 degrees in radians
  return Math.round(angle / snapIncrement) * snapIncrement;
}

/**
 * Apply rotation snapping with automatic 90-degree snap and optional Shift snap
 * - Automatically snaps to 90° when within 5° tolerance
 * - When Shift is pressed, snaps to 15° increments
 */
export function applyRotationSnapping(angle: number, shiftPressed: boolean = false): number {
  if (shiftPressed) {
    const snapIncrement = (15 * Math.PI) / 180;
    return Math.round(angle / snapIncrement) * snapIncrement;
  }

  const snap90Increment = (90 * Math.PI) / 180;
  const tolerance = (5 * Math.PI) / 180;

  const nearestSnap90 = Math.round(angle / snap90Increment) * snap90Increment;
  const distanceToSnap = Math.abs(angle - nearestSnap90);

  if (distanceToSnap <= tolerance) {
    return nearestSnap90;
  }

  return angle;
}

/**
 * Transform a point by rotating it around a center
 */
export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Get the bounding box of a rotated rectangle
 */
export function getRotatedBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number
): { x: number; y: number; width: number; height: number } {
  if (angle === 0) {
    return { x, y, width, height };
  }

  const center = { x: x + width / 2, y: y + height / 2 };
  const corners = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];

  const rotatedCorners = corners.map(corner => rotatePoint(corner, center, angle));

  const minX = Math.min(...rotatedCorners.map(c => c.x));
  const maxX = Math.max(...rotatedCorners.map(c => c.x));
  const minY = Math.min(...rotatedCorners.map(c => c.y));
  const maxY = Math.max(...rotatedCorners.map(c => c.y));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
