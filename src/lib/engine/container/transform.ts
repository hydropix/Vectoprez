import type { AnyExcalidrawElement, Point } from '../elements/types';
import { getAllDescendants } from './hierarchy';
import { updateContainerBounds } from './autoResize';

export function moveWithChildren(
  elementId: string,
  dx: number,
  dy: number,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const descendants = getAllDescendants(elementId, elements);
  const affectedIds = [elementId, ...descendants];

  let updatedElements = elements.map(el => {
    if (affectedIds.includes(el.id)) {
      return {
        ...el,
        x: el.x + dx,
        y: el.y + dy
      };
    }
    return el;
  });

  const element = elements.find(el => el.id === elementId);
  if (element && element.parentId) {
    updatedElements = updateContainerBounds(element.parentId, updatedElements);
  }

  return updatedElements;
}

export function scaleWithChildren(
  elementId: string,
  scaleX: number,
  scaleY: number,
  origin: Point,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const descendants = getAllDescendants(elementId, elements);
  const affectedIds = [elementId, ...descendants];

  return elements.map(el => {
    if (affectedIds.includes(el.id)) {
      const elementCenterX = el.x + el.width / 2;
      const elementCenterY = el.y + el.height / 2;

      const relativeX = elementCenterX - origin.x;
      const relativeY = elementCenterY - origin.y;

      const newRelativeX = relativeX * scaleX;
      const newRelativeY = relativeY * scaleY;

      const newCenterX = origin.x + newRelativeX;
      const newCenterY = origin.y + newRelativeY;

      const newWidth = el.width * Math.abs(scaleX);
      const newHeight = el.height * Math.abs(scaleY);

      const newX = newCenterX - newWidth / 2;
      const newY = newCenterY - newHeight / 2;

      const MIN_SIZE = 10;

      return {
        ...el,
        x: newX,
        y: newY,
        width: Math.max(MIN_SIZE, newWidth),
        height: Math.max(MIN_SIZE, newHeight)
      };
    }
    return el;
  });
}

export function rotateWithChildren(
  elementId: string,
  angleDelta: number,
  center: Point,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const descendants = getAllDescendants(elementId, elements);
  const affectedIds = [elementId, ...descendants];

  return elements.map(el => {
    if (affectedIds.includes(el.id)) {
      const elementCenter: Point = {
        x: el.x + el.width / 2,
        y: el.y + el.height / 2
      };

      const cos = Math.cos(angleDelta);
      const sin = Math.sin(angleDelta);

      const dx = elementCenter.x - center.x;
      const dy = elementCenter.y - center.y;

      const rotatedX = center.x + (dx * cos - dy * sin);
      const rotatedY = center.y + (dx * sin + dy * cos);

      const newX = rotatedX - el.width / 2;
      const newY = rotatedY - el.height / 2;
      const newAngle = el.angle + angleDelta;

      return {
        ...el,
        x: newX,
        y: newY,
        angle: newAngle
      };
    }
    return el;
  });
}
