import type { AnyExcalidrawElement, ExcalidrawElement } from '../elements/types';
import { isValidContainerType } from '../container/detection';
import { getAllDescendants } from '../container/hierarchy';

export function ensureChildrenAfterParent(
  parentId: string,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const parent = elements.find(el => el.id === parentId);
  if (!parent || !isValidContainerType(parent)) {
    return elements;
  }

  const container = parent as ExcalidrawElement;
  if (container.childrenIds.length === 0) {
    return elements;
  }

  const allDescendantIds = getAllDescendants(parentId, elements);
  const descendantSet = new Set(allDescendantIds);

  const parentIndex = elements.findIndex(el => el.id === parentId);
  if (parentIndex === -1) {
    return elements;
  }

  const nonDescendants: AnyExcalidrawElement[] = [];
  const descendants: AnyExcalidrawElement[] = [];

  elements.forEach(el => {
    if (el.id === parentId) {
      return;
    }
    if (descendantSet.has(el.id)) {
      descendants.push(el);
    } else {
      nonDescendants.push(el);
    }
  });

  const before = nonDescendants.slice(0, parentIndex);
  const after = nonDescendants.slice(parentIndex);

  return [...before, parent, ...descendants, ...after];
}

export function moveElementAfter(
  elementId: string,
  afterElementId: string,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const elementIndex = elements.findIndex(el => el.id === elementId);
  const afterIndex = elements.findIndex(el => el.id === afterElementId);

  if (elementIndex === -1 || afterIndex === -1) {
    return elements;
  }

  const element = elements[elementIndex];
  const withoutElement = elements.filter((_, i) => i !== elementIndex);

  const adjustedAfterIndex = afterIndex > elementIndex ? afterIndex - 1 : afterIndex;

  return [
    ...withoutElement.slice(0, adjustedAfterIndex + 1),
    element,
    ...withoutElement.slice(adjustedAfterIndex + 1)
  ];
}

export function moveElementToFront(
  elementId: string,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const index = elements.findIndex(el => el.id === elementId);
  if (index === -1 || index === elements.length - 1) {
    return elements;
  }

  const element = elements[index];
  const withoutElement = elements.filter((_, i) => i !== index);

  return [...withoutElement, element];
}

export function moveElementToBack(
  elementId: string,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const index = elements.findIndex(el => el.id === elementId);
  if (index === -1 || index === 0) {
    return elements;
  }

  const element = elements[index];
  const withoutElement = elements.filter((_, i) => i !== index);

  return [element, ...withoutElement];
}

export function bringForward(
  elementId: string,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const index = elements.findIndex(el => el.id === elementId);
  if (index === -1 || index === elements.length - 1) {
    return elements;
  }

  const result = [...elements];
  [result[index], result[index + 1]] = [result[index + 1], result[index]];

  return result;
}

export function sendBackward(
  elementId: string,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const index = elements.findIndex(el => el.id === elementId);
  if (index === -1 || index === 0) {
    return elements;
  }

  const result = [...elements];
  [result[index], result[index - 1]] = [result[index - 1], result[index]];

  return result;
}
