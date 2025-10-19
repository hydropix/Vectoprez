import type { AnyExcalidrawElement, Point } from '../elements/types';
import { rotatePoint } from '../transform/geometry';
import type { GroupBounds } from './groupBounds';

export function translateGroup(
  elements: AnyExcalidrawElement[],
  dx: number,
  dy: number
): Partial<AnyExcalidrawElement>[] {
  return elements.map(element => ({
    id: element.id,
    x: element.x + dx,
    y: element.y + dy,
  }));
}

export function scaleGroup(
  elements: AnyExcalidrawElement[],
  _groupBounds: GroupBounds,
  scaleX: number,
  scaleY: number,
  origin: Point,
  maintainAspectRatio: boolean = true
): Partial<AnyExcalidrawElement>[] {
  if (maintainAspectRatio) {
    const scale = Math.min(Math.abs(scaleX), Math.abs(scaleY));
    scaleX = scale * Math.sign(scaleX);
    scaleY = scale * Math.sign(scaleY);
  }

  const updates: Partial<AnyExcalidrawElement>[] = [];

  for (const element of elements) {
    const elementCenterX = element.x + element.width / 2;
    const elementCenterY = element.y + element.height / 2;

    const relativeX = elementCenterX - origin.x;
    const relativeY = elementCenterY - origin.y;

    const newRelativeX = relativeX * scaleX;
    const newRelativeY = relativeY * scaleY;

    const newCenterX = origin.x + newRelativeX;
    const newCenterY = origin.y + newRelativeY;

    const newWidth = element.width * Math.abs(scaleX);
    const newHeight = element.height * Math.abs(scaleY);

    const newX = newCenterX - newWidth / 2;
    const newY = newCenterY - newHeight / 2;

    const MIN_SIZE = 10;

    updates.push({
      id: element.id,
      x: newX,
      y: newY,
      width: Math.max(MIN_SIZE, newWidth),
      height: Math.max(MIN_SIZE, newHeight),
    });
  }

  return updates;
}

export function rotateGroup(
  elements: AnyExcalidrawElement[],
  groupBounds: GroupBounds,
  angleDelta: number
): Partial<AnyExcalidrawElement>[] {
  const center: Point = {
    x: groupBounds.centerX,
    y: groupBounds.centerY,
  };

  const updates: Partial<AnyExcalidrawElement>[] = [];

  for (const element of elements) {
    const elementCenter: Point = {
      x: element.x + element.width / 2,
      y: element.y + element.height / 2,
    };

    const rotatedCenter = rotatePoint(elementCenter, center, angleDelta);

    const newX = rotatedCenter.x - element.width / 2;
    const newY = rotatedCenter.y - element.height / 2;
    const newAngle = element.angle + angleDelta;

    updates.push({
      id: element.id,
      x: newX,
      y: newY,
      angle: newAngle,
    });
  }

  return updates;
}
