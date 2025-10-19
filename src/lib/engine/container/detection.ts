import type { AnyExcalidrawElement, ExcalidrawElement } from '../elements/types';
import { OVERLAP_THRESHOLD } from './constants';

export function isValidContainerType(element: AnyExcalidrawElement): element is ExcalidrawElement {
  return element.type === 'rectangle' || element.type === 'ellipse';
}

export function calculateOverlapPercentage(
  child: AnyExcalidrawElement,
  parent: AnyExcalidrawElement
): number {
  const childLeft = child.x;
  const childRight = child.x + child.width;
  const childTop = child.y;
  const childBottom = child.y + child.height;

  const parentLeft = parent.x;
  const parentRight = parent.x + parent.width;
  const parentTop = parent.y;
  const parentBottom = parent.y + parent.height;

  const overlapLeft = Math.max(childLeft, parentLeft);
  const overlapRight = Math.min(childRight, parentRight);
  const overlapTop = Math.max(childTop, parentTop);
  const overlapBottom = Math.min(childBottom, parentBottom);

  if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
    return 0;
  }

  const overlapWidth = overlapRight - overlapLeft;
  const overlapHeight = overlapBottom - overlapTop;
  const overlapArea = overlapWidth * overlapHeight;

  const childArea = child.width * child.height;

  return childArea > 0 ? overlapArea / childArea : 0;
}

export function shouldBecomeChild(
  element: AnyExcalidrawElement,
  container: AnyExcalidrawElement,
  threshold: number = OVERLAP_THRESHOLD
): boolean {
  if (!isValidContainerType(element) || !isValidContainerType(container)) {
    return false;
  }

  if (element.id === container.id) {
    return false;
  }

  if (element.parentId === container.id) {
    return true;
  }

  const overlapPercentage = calculateOverlapPercentage(element, container);
  return overlapPercentage >= threshold;
}

export function findPotentialContainer(
  element: AnyExcalidrawElement,
  allElements: AnyExcalidrawElement[],
  excludeDescendants: string[] = []
): ExcalidrawElement | null {
  if (!isValidContainerType(element)) {
    return null;
  }

  let bestContainer: ExcalidrawElement | null = null;
  let smallestArea = Infinity;

  for (const potentialContainer of allElements) {
    if (!isValidContainerType(potentialContainer)) continue;
    if (potentialContainer.id === element.id) continue;
    if (excludeDescendants.includes(potentialContainer.id)) continue;

    if (shouldBecomeChild(element, potentialContainer)) {
      const containerArea = potentialContainer.width * potentialContainer.height;

      if (containerArea < smallestArea) {
        smallestArea = containerArea;
        bestContainer = potentialContainer;
      }
    }
  }

  return bestContainer;
}

export function shouldDetachFromContainer(
  element: AnyExcalidrawElement,
  container: AnyExcalidrawElement,
  threshold: number = OVERLAP_THRESHOLD
): boolean {
  const overlapPercentage = calculateOverlapPercentage(element, container);
  return overlapPercentage < threshold;
}
