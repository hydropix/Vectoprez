import type { AnyExcalidrawElement, Point } from '../elements/types';

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function normalizeSelectionBox(start: Point, end: Point): SelectionBox {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return { x, y, width, height };
}

export function getElementsInSelectionBox(
  elements: AnyExcalidrawElement[],
  box: SelectionBox,
  mode: 'center' | 'intersect' = 'center'
): AnyExcalidrawElement[] {
  const selected: AnyExcalidrawElement[] = [];

  for (const element of elements) {
    if (mode === 'center') {
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;

      if (
        centerX >= box.x &&
        centerX <= box.x + box.width &&
        centerY >= box.y &&
        centerY <= box.y + box.height
      ) {
        selected.push(element);
      }
    } else {
      const intersects =
        element.x < box.x + box.width &&
        element.x + element.width > box.x &&
        element.y < box.y + box.height &&
        element.y + element.height > box.y;

      if (intersects) {
        selected.push(element);
      }
    }
  }

  return selected;
}

export function renderSelectionBox(
  ctx: CanvasRenderingContext2D,
  box: SelectionBox,
  zoom: number
) {
  ctx.save();

  ctx.strokeStyle = '#3b82f6';
  ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([5 / zoom, 3 / zoom]);

  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  ctx.setLineDash([]);
  ctx.restore();
}
