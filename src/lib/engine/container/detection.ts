import type { AnyExcalidrawElement, ExcalidrawElement } from '../elements/types';
import { OVERLAP_THRESHOLD } from './constants';

export function isValidContainerType(element: AnyExcalidrawElement): element is ExcalidrawElement {
  return element.type === 'rectangle' || element.type === 'ellipse';
}

export function calculateOverlapPercentage(
  child: AnyExcalidrawElement,
  parent: AnyExcalidrawElement
): number {
  let childWidth = child.width;
  let childHeight = child.height;

  if (isValidContainerType(child)) {
    const containerChild = child as ExcalidrawElement;
    if (containerChild.originalBounds) {
      childWidth = containerChild.originalBounds.width;
      childHeight = containerChild.originalBounds.height;
    }
  }

  const overlapLeft = Math.max(child.x, parent.x);
  const overlapRight = Math.min(child.x + childWidth, parent.x + parent.width);
  const overlapTop = Math.max(child.y, parent.y);
  const overlapBottom = Math.min(child.y + childHeight, parent.y + parent.height);

  if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
    return 0;
  }

  const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
  const childArea = childWidth * childHeight;

  return childArea > 0 ? overlapArea / childArea : 0;
}

export function shouldBecomeChild(
  element: AnyExcalidrawElement,
  container: AnyExcalidrawElement,
  threshold: number = OVERLAP_THRESHOLD
): boolean {
  if (!isValidContainerType(element) || !isValidContainerType(container) || element.id === container.id) {
    return false;
  }

  if (element.parentId === container.id) {
    return true;
  }

  return calculateOverlapPercentage(element, container) >= threshold;
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
