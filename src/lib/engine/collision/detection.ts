import type { AnyExcalidrawElement, Point, ArrowElement } from '../elements/types';
import { distanceToLineSegment } from '$lib/utils/geometry';


/**
 * Teste si un point est sur une courbe de Bézier quadratique
 */
function distanceToBezierCurve(
  point: Point,
  start: Point,
  control: Point,
  end: Point,
  samples: number = 20
): number {
  let minDistance = Infinity;

  // Échantillonner la courbe
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const oneMinusT = 1 - t;

    // Point sur la courbe de Bézier
    const x = oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x;
    const y = oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y;

    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

export function hitTest(
  element: AnyExcalidrawElement,
  point: Point
): boolean {
  const { x, y, width, height, type } = element;

  switch (type) {
    case 'rectangle':
    case 'text':
      return (
        point.x >= x &&
        point.x <= x + width &&
        point.y >= y &&
        point.y <= y + height
      );

    case 'ellipse':
      // Test ellipse avec équation
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const rx = width / 2;
      const ry = height / 2;
      return (
        ((point.x - centerX) ** 2) / (rx ** 2) +
          ((point.y - centerY) ** 2) / (ry ** 2) <=
        1
      );

    case 'line': {
      // Test basé sur la distance au segment de ligne
      const threshold = 10; // pixels de tolérance
      const start = { x, y };
      const end = { x: x + width, y: y + height };
      return distanceToLineSegment(point, start, end) <= threshold;
    }

    case 'arrow': {
      // Test basé sur la distance au path de la flèche
      const arrow = element as ArrowElement;
      const threshold = 10; // pixels de tolérance

      if (arrow.points.length === 2) {
        // Ligne droite
        const start = { x: x + arrow.points[0].x, y: y + arrow.points[0].y };
        const end = { x: x + arrow.points[1].x, y: y + arrow.points[1].y };
        return distanceToLineSegment(point, start, end) <= threshold;
      } else if (arrow.points.length === 3) {
        // Courbe de Bézier
        const start = { x: x + arrow.points[0].x, y: y + arrow.points[0].y };
        const control = { x: x + arrow.points[1].x, y: y + arrow.points[1].y };
        const end = { x: x + arrow.points[2].x, y: y + arrow.points[2].y };
        return distanceToBezierCurve(point, start, control, end) <= threshold;
      } else {
        // Multi-points: tester chaque segment
        for (let i = 0; i < arrow.points.length - 1; i++) {
          const start = { x: x + arrow.points[i].x, y: y + arrow.points[i].y };
          const end = { x: x + arrow.points[i + 1].x, y: y + arrow.points[i + 1].y };
          if (distanceToLineSegment(point, start, end) <= threshold) {
            return true;
          }
        }
        return false;
      }
    }

    default:
      return false;
  }
}

export function getElementAtPosition(
  elements: AnyExcalidrawElement[],
  point: Point
): AnyExcalidrawElement | null {
  // Parcourir dans l'ordre inverse (top-most first)
  for (let i = elements.length - 1; i >= 0; i--) {
    if (hitTest(elements[i], point)) {
      return elements[i];
    }
  }
  return null;
}
