import { v4 as uuid } from 'uuid';
import type { AnyExcalidrawElement, Point, ExcalidrawElement } from '$lib/engine/elements/types';

export function collectElementsWithChildren(
  elementIds: string[],
  allElements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const collected = new Set<string>();
  const result: AnyExcalidrawElement[] = [];

  function collectRecursive(elementId: string) {
    if (collected.has(elementId)) return;

    const element = allElements.find(el => el.id === elementId);
    if (!element) return;

    collected.add(elementId);
    result.push(element);

    if (element.type === 'rectangle' || element.type === 'ellipse' || element.type === 'line') {
      const container = element as ExcalidrawElement;
      for (const childId of container.childrenIds) {
        collectRecursive(childId);
      }
    }
  }

  for (const id of elementIds) {
    collectRecursive(id);
  }

  return result;
}

export function collectElementIdsWithChildren(
  elementIds: string[],
  allElements: AnyExcalidrawElement[]
): string[] {
  const elements = collectElementsWithChildren(elementIds, allElements);
  return elements.map(el => el.id);
}

export function duplicateElements(
  elements: AnyExcalidrawElement[],
  offset: Point = { x: 20, y: 20 }
): AnyExcalidrawElement[] {
  const duplicated: AnyExcalidrawElement[] = [];
  const oldToNewId = new Map<string, string>();

  for (const element of elements) {
    const newId = uuid();
    oldToNewId.set(element.id, newId);
  }

  for (const element of elements) {
    const cloned = structuredClone(element);
    const newId = oldToNewId.get(element.id)!;

    cloned.id = newId;
    cloned.x += offset.x;
    cloned.y += offset.y;
    cloned.seed = Math.floor(Math.random() * 2 ** 31);
    cloned.parentId = element.parentId ? oldToNewId.get(element.parentId) || null : null;

    if (cloned.type === 'rectangle' || cloned.type === 'ellipse' || cloned.type === 'line') {
      const excalidrawElement = cloned as ExcalidrawElement;
      excalidrawElement.childrenIds = excalidrawElement.childrenIds.map(
        childId => oldToNewId.get(childId) || childId
      );
    }

    duplicated.push(cloned);
  }

  return duplicated;
}

export function calculateCenterPoint(elements: AnyExcalidrawElement[]): Point {
  if (elements.length === 0) {
    return { x: 0, y: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
}
