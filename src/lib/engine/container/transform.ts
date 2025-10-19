import type { AnyExcalidrawElement } from '../elements/types';
import { getAllDescendants } from './hierarchy';

export function moveWithChildren(
  elementId: string,
  dx: number,
  dy: number,
  elements: AnyExcalidrawElement[]
): AnyExcalidrawElement[] {
  const affectedIds = [elementId, ...getAllDescendants(elementId, elements)];

  return elements.map(el =>
    affectedIds.includes(el.id)
      ? { ...el, x: el.x + dx, y: el.y + dy }
      : el
  );
}
