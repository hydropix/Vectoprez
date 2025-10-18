import type { ArrowElement, Point } from '../elements/types';

/**
 * Ajouter un point de contrôle au milieu d'une flèche
 */
export function addControlPoint(arrow: ArrowElement): ArrowElement {
  if (arrow.points.length !== 2) {
    // Déjà une courbe ou autre
    return arrow;
  }

  const start = arrow.points[0];
  const end = arrow.points[1];

  // Calculer le point milieu
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Calculer un offset perpendiculaire pour créer une courbe
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Direction perpendiculaire
  const perpX = -dy / length;
  const perpY = dx / length;

  // Offset de 20% de la longueur
  const offset = length * 0.2;

  const controlPoint: Point = {
    x: midX + perpX * offset,
    y: midY + perpY * offset,
  };

  return {
    ...arrow,
    points: [start, controlPoint, end],
  };
}

/**
 * Supprimer un point de contrôle (remettre en ligne droite)
 */
export function removeControlPoint(arrow: ArrowElement, pointIndex: number): ArrowElement {
  if (arrow.points.length <= 2 || pointIndex === 0 || pointIndex === arrow.points.length - 1) {
    // Ne pas supprimer les points de début et fin
    return arrow;
  }

  const newPoints = arrow.points.filter((_, i) => i !== pointIndex);

  return {
    ...arrow,
    points: newPoints,
  };
}

/**
 * Calculer les points d'une courbe de Bézier quadratique
 */
export function getQuadraticBezierPoints(
  start: Point,
  control: Point,
  end: Point,
  segments: number = 20
): Point[] {
  const points: Point[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const oneMinusT = 1 - t;

    const x =
      oneMinusT * oneMinusT * start.x +
      2 * oneMinusT * t * control.x +
      t * t * end.x;

    const y =
      oneMinusT * oneMinusT * start.y +
      2 * oneMinusT * t * control.y +
      t * t * end.y;

    points.push({ x, y });
  }

  return points;
}

/**
 * Vérifier si une flèche est courbe
 */
export function isCurvedArrow(arrow: ArrowElement): boolean {
  return arrow.points.length > 2;
}
