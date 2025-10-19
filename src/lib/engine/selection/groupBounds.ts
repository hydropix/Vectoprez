import type { AnyExcalidrawElement } from '../elements/types';
import { getRotatedBoundingBox } from '../transform/geometry';

export interface GroupBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export function getGroupBoundingBox(elements: AnyExcalidrawElement[]): GroupBounds | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    if (element.angle === 0) {
      minX = Math.min(minX, element.x);
      minY = Math.min(minY, element.y);
      maxX = Math.max(maxX, element.x + element.width);
      maxY = Math.max(maxY, element.y + element.height);
    } else {
      const rotatedBounds = getRotatedBoundingBox(
        element.x,
        element.y,
        element.width,
        element.height,
        element.angle
      );

      minX = Math.min(minX, rotatedBounds.x);
      minY = Math.min(minY, rotatedBounds.y);
      maxX = Math.max(maxX, rotatedBounds.x + rotatedBounds.width);
      maxY = Math.max(maxY, rotatedBounds.y + rotatedBounds.height);
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    x: minX,
    y: minY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

export function isPointInBounds(point: { x: number; y: number }, bounds: GroupBounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}
