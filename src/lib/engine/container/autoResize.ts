import type { AnyExcalidrawElement, ExcalidrawElement } from '../elements/types';
import { CONTAINER_PADDING } from './constants';
import { isValidContainerType, shouldDetachFromContainer } from './detection';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateRequiredBounds(
  container: ExcalidrawElement,
  children: AnyExcalidrawElement[],
  padding: number = CONTAINER_PADDING
): Bounds {
  if (children.length === 0) {
    return {
      x: container.x,
      y: container.y,
      width: container.originalBounds?.width ?? container.width,
      height: container.originalBounds?.height ?? container.height
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const child of children) {
    minX = Math.min(minX, child.x);
    minY = Math.min(minY, child.y);
    maxX = Math.max(maxX, child.x + child.width);
    maxY = Math.max(maxY, child.y + child.height);
  }

  const requiredX = minX - padding;
  const requiredY = minY - padding;
  const requiredWidth = maxX - minX + padding * 2;
  const requiredHeight = maxY - minY + padding * 2;

  return {
    x: requiredX,
    y: requiredY,
    width: requiredWidth,
    height: requiredHeight
  };
}

export function expandContainer(
  container: ExcalidrawElement,
  requiredBounds: Bounds
): Partial<ExcalidrawElement> {
  const needsExpansion =
    requiredBounds.x < container.x ||
    requiredBounds.y < container.y ||
    requiredBounds.x + requiredBounds.width > container.x + container.width ||
    requiredBounds.y + requiredBounds.height > container.y + container.height;

  if (!needsExpansion) {
    return { id: container.id };
  }

  if (!container.originalBounds) {
    return {
      id: container.id,
      x: Math.min(container.x, requiredBounds.x),
      y: Math.min(container.y, requiredBounds.y),
      width: Math.max(
        container.width,
        requiredBounds.x + requiredBounds.width - Math.min(container.x, requiredBounds.x)
      ),
      height: Math.max(
        container.height,
        requiredBounds.y + requiredBounds.height - Math.min(container.y, requiredBounds.y)
      ),
      originalBounds: {
        width: container.width,
        height: container.height
      },
      isExpanded: true
    };
  }

  return {
    id: container.id,
    x: Math.min(container.x, requiredBounds.x),
    y: Math.min(container.y, requiredBounds.y),
    width: Math.max(
      container.width,
      requiredBounds.x + requiredBounds.width - Math.min(container.x, requiredBounds.x)
    ),
    height: Math.max(
      container.height,
      requiredBounds.y + requiredBounds.height - Math.min(container.y, requiredBounds.y)
    ),
    isExpanded: true
  };
}

export function shrinkContainer(
  container: ExcalidrawElement,
  originalBounds?: { width: number; height: number }
): Partial<ExcalidrawElement> {
  const bounds = originalBounds ?? container.originalBounds;

  if (!bounds) {
    return { id: container.id };
  }

  return {
    id: container.id,
    width: bounds.width,
    height: bounds.height,
    originalBounds: null,
    isExpanded: false
  };
}

export function updateContainerBounds(
  containerId: string,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const container = elements.find(el => el.id === containerId);
  if (!container || !isValidContainerType(container)) {
    return elements;
  }

  const containerElement = container as ExcalidrawElement;
  let children = elements.filter(el => el.parentId === containerId);

  let updatedElements = elements;
  const childrenToDetach: string[] = [];

  for (const child of children) {
    if (shouldDetachFromContainer(child, containerElement)) {
      childrenToDetach.push(child.id);
    }
  }

  if (childrenToDetach.length > 0) {
    updatedElements = updatedElements.map(el => {
      if (childrenToDetach.includes(el.id)) {
        return { ...el, parentId: null };
      }
      if (el.id === containerId && isValidContainerType(el)) {
        const cont = el as ExcalidrawElement;
        return {
          ...cont,
          childrenIds: cont.childrenIds.filter(id => !childrenToDetach.includes(id))
        };
      }
      return el;
    });

    children = children.filter(child => !childrenToDetach.includes(child.id));
  }

  if (children.length === 0 && containerElement.isExpanded) {
    const shrinkUpdate = shrinkContainer(containerElement);
    return updatedElements.map(el => el.id === containerId ? { ...el, ...shrinkUpdate } as AnyExcalidrawElement : el);
  }

  if (children.length > 0) {
    const requiredBounds = calculateRequiredBounds(containerElement, children);
    const expandUpdate = expandContainer(containerElement, requiredBounds);
    return updatedElements.map(el => el.id === containerId ? { ...el, ...expandUpdate } as AnyExcalidrawElement : el);
  }

  return updatedElements;
}
