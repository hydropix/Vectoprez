import type { ExcalidrawElement, Point } from '../elements/types';

export type LineHandleType = 'start' | 'end';

export interface LineHandle {
  type: LineHandleType;
  position: Point; // Position monde
}

const HANDLE_SIZE = 8; // Rayon du handle en pixels

/**
 * Obtenir tous les handles d'une ligne
 */
export function getLineHandles(line: ExcalidrawElement): LineHandle[] {
  if (line.type !== 'line') return [];

  const handles: LineHandle[] = [];

  // Handle au début (x, y)
  handles.push({
    type: 'start',
    position: {
      x: line.x,
      y: line.y,
    },
  });

  // Handle à la fin (x + width, y + height)
  handles.push({
    type: 'end',
    position: {
      x: line.x + line.width,
      y: line.y + line.height,
    },
  });

  return handles;
}

/**
 * Tester si un point est sur un handle de ligne
 */
export function getLineHandleAtPosition(
  line: ExcalidrawElement,
  point: Point,
  zoom: number
): LineHandle | null {
  if (line.type !== 'line') return null;

  const handles = getLineHandles(line);
  const threshold = HANDLE_SIZE / zoom;

  for (const handle of handles) {
    const dx = point.x - handle.position.x;
    const dy = point.y - handle.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= threshold) {
      return handle;
    }
  }

  return null;
}

/**
 * Render les handles d'une ligne sélectionnée
 */
export function renderLineHandles(
  ctx: CanvasRenderingContext2D,
  line: ExcalidrawElement,
  zoom: number
) {
  if (line.type !== 'line') return;

  const handles = getLineHandles(line);

  ctx.save();

  for (const handle of handles) {
    // Position du handle dans le canvas (déjà transformé)
    const { x, y } = handle.position;

    // Dessiner le handle
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#4dabf7';
    ctx.lineWidth = 2 / zoom;

    ctx.beginPath();
    ctx.arc(x, y, HANDLE_SIZE / zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
