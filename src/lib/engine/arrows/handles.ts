import type { ArrowElement, Point } from '../elements/types';

export type ArrowHandleType = 'start' | 'end' | 'mid';

export interface ArrowHandle {
  type: ArrowHandleType;
  pointIndex: number;
  position: Point; // Position monde
}

const HANDLE_SIZE = 8; // Rayon du handle en pixels

/**
 * Obtenir tous les handles d'une flèche
 */
export function getArrowHandles(arrow: ArrowElement): ArrowHandle[] {
  const handles: ArrowHandle[] = [];

  // Handle au début
  handles.push({
    type: 'start',
    pointIndex: 0,
    position: {
      x: arrow.x + arrow.points[0].x,
      y: arrow.y + arrow.points[0].y,
    },
  });

  // Handle à la fin
  const lastIdx = arrow.points.length - 1;
  handles.push({
    type: 'end',
    pointIndex: lastIdx,
    position: {
      x: arrow.x + arrow.points[lastIdx].x,
      y: arrow.y + arrow.points[lastIdx].y,
    },
  });

  // Handles intermédiaires (pour courbes)
  for (let i = 1; i < arrow.points.length - 1; i++) {
    handles.push({
      type: 'mid',
      pointIndex: i,
      position: {
        x: arrow.x + arrow.points[i].x,
        y: arrow.y + arrow.points[i].y,
      },
    });
  }

  return handles;
}

/**
 * Tester si un point est sur un handle
 */
export function getHandleAtPosition(
  arrow: ArrowElement,
  point: Point,
  zoom: number
): ArrowHandle | null {
  const handles = getArrowHandles(arrow);
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
 * Render les handles d'une flèche sélectionnée
 */
export function renderArrowHandles(
  ctx: CanvasRenderingContext2D,
  arrow: ArrowElement,
  zoom: number
) {
  const handles = getArrowHandles(arrow);

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

    // Indicateur visuel pour le type de handle
    if (handle.type === 'mid') {
      // Handle intermédiaire: carré
      const size = (HANDLE_SIZE * 0.6) / zoom;
      ctx.fillStyle = '#4dabf7';
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }

  ctx.restore();
}
