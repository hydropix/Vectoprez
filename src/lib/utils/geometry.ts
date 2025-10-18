import type { Point, AnyExcalidrawElement } from '../engine/elements/types';

/**
 * Calculate the distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the distance from a point to a line segment
 */
export function distanceToLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Line start and end are the same point
    const px = point.x - lineStart.x;
    const py = point.y - lineStart.y;
    return Math.sqrt(px * px + py * py);
  }

  // Project point onto the line
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t)); // Clamp between 0 and 1

  // Find closest point on the segment
  const closestX = lineStart.x + t * dx;
  const closestY = lineStart.y + t * dy;

  // Calculate distance
  const distX = point.x - closestX;
  const distY = point.y - closestY;
  return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Calculate the bounding box for a set of elements
 */
export function getElementsBounds(elements: AnyExcalidrawElement[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRect(
  point: Point,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if a point is inside an ellipse
 */
export function isPointInEllipse(
  point: Point,
  ellipse: { x: number; y: number; width: number; height: number }
): boolean {
  const centerX = ellipse.x + ellipse.width / 2;
  const centerY = ellipse.y + ellipse.height / 2;
  const rx = ellipse.width / 2;
  const ry = ellipse.height / 2;

  return (
    ((point.x - centerX) ** 2) / (rx ** 2) +
      ((point.y - centerY) ** 2) / (ry ** 2) <=
    1
  );
}

/**
 * Calculate angle between two points
 */
export function angleBetweenPoints(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Rotate a point around a center
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
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two points
 */
export function lerpPoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize a vector (make it unit length)
 */
export function normalizeVector(vector: Point): Point {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (length === 0) return { x: 0, y: 0 };
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

/**
 * Get the midpoint between two points
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calculate perpendicular vector
 */
export function perpendicular(vector: Point): Point {
  return { x: -vector.y, y: vector.x };
}

/**
 * Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap point to grid
 */
export function snapPointToGrid(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}
