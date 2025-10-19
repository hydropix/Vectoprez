import type { AnyExcalidrawElement, ExcalidrawElement, Point } from '../elements/types';
import { isValidContainerType, findPotentialContainer, shouldDetachFromContainer } from './detection';
import { ensureChildrenAfterParent } from '../rendering/layering';

export function getAllDescendants(
  elementId: string,
  elements: AnyExcalidrawElement[]
): string[] {
  const element = elements.find(el => el.id === elementId);
  if (!element || !isValidContainerType(element)) {
    return [];
  }

  const descendants: string[] = [];
  const queue = [...(element as ExcalidrawElement).childrenIds];

  while (queue.length > 0) {
    const childId = queue.shift()!;
    descendants.push(childId);

    const child = elements.find(el => el.id === childId);
    if (child && isValidContainerType(child)) {
      queue.push(...(child as ExcalidrawElement).childrenIds);
    }
  }

  return descendants;
}

export function getAncestors(
  elementId: string,
  elements: AnyExcalidrawElement[]
): string[] {
  const ancestors: string[] = [];
  let currentId: string | null = elementId;

  while (currentId) {
    const element = elements.find(el => el.id === currentId);
    if (!element) break;

    if (element.parentId) {
      ancestors.push(element.parentId);
      currentId = element.parentId;
    } else {
      break;
    }
  }

  return ancestors;
}

export function attachToContainer(
  childId: string,
  parentId: string,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const child = elements.find(el => el.id === childId);
  if (!child) {
    return elements;
  }

  let updatedElements = elements;

  if (child.parentId) {
    updatedElements = detachFromContainer(childId, updatedElements);
  }

  updatedElements = updatedElements.map(el => {
    if (el.id === childId) {
      return { ...el, parentId };
    }

    if (el.id === parentId && isValidContainerType(el)) {
      const container = el as ExcalidrawElement;
      if (!container.childrenIds.includes(childId)) {
        return {
          ...container,
          childrenIds: [...container.childrenIds, childId]
        };
      }
    }

    return el;
  });

  updatedElements = ensureChildrenAfterParent(parentId, updatedElements);

  return updatedElements;
}

export function detachFromContainer(
  childId: string,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const child = elements.find(el => el.id === childId);
  if (!child || !child.parentId) {
    return elements;
  }

  const parentId = child.parentId;

  return elements.map(el => {
    if (el.id === childId) {
      return { ...el, parentId: null };
    }

    if (el.id === parentId && isValidContainerType(el)) {
      const container = el as ExcalidrawElement;
      return {
        ...container,
        childrenIds: container.childrenIds.filter(id => id !== childId)
      };
    }

    return el;
  });
}

export function updateHierarchy(
  draggingElementId: string,
  _worldPos: Point,
  elements: AnyExcalidrawElement[]
): {
  elements: AnyExcalidrawElement[];
  potentialContainer: ExcalidrawElement | null;
  shouldDetach: boolean;
} {
  const draggingElement = elements.find(el => el.id === draggingElementId);
  if (!draggingElement) {
    return { elements, potentialContainer: null, shouldDetach: false };
  }

  const descendants = getAllDescendants(draggingElementId, elements);
  const excludeIds = [draggingElementId, ...descendants];

  const potentialContainer = findPotentialContainer(draggingElement, elements, excludeIds);

  let shouldDetach = false;
  if (draggingElement.parentId) {
    const currentParent = elements.find(el => el.id === draggingElement.parentId);
    if (currentParent) {
      shouldDetach = shouldDetachFromContainer(draggingElement, currentParent);

      if (shouldDetach && potentialContainer?.id === draggingElement.parentId) {
        return {
          elements,
          potentialContainer: null,
          shouldDetach: true
        };
      }
    }
  }

  return {
    elements,
    potentialContainer,
    shouldDetach
  };
}

export function finalizeHierarchyChange(
  elementId: string,
  potentialContainer: ExcalidrawElement | null,
  shouldDetach: boolean,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  let updatedElements = elements;

  if (shouldDetach) {
    updatedElements = detachFromContainer(elementId, updatedElements);
  }

  if (potentialContainer && potentialContainer.id !== elements.find(el => el.id === elementId)?.parentId) {
    updatedElements = attachToContainer(elementId, potentialContainer.id, updatedElements);
  }

  return updatedElements;
}
