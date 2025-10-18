import type { ArrowElement, Point } from '../elements/types';

/**
 * Calcule le bounding box d'une flèche en fonction de ses points
 */
export function calculateArrowBoundingBox(arrow: ArrowElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (arrow.points.length === 0) {
    return { x: arrow.x, y: arrow.y, width: 0, height: 0 };
  }

  // Trouver les coordonnées min/max
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of arrow.points) {
    const worldX = arrow.x + point.x;
    const worldY = arrow.y + point.y;

    minX = Math.min(minX, worldX);
    minY = Math.min(minY, worldY);
    maxX = Math.max(maxX, worldX);
    maxY = Math.max(maxY, worldY);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Met à jour le bounding box d'une flèche et ajuste les points en conséquence
 */
export function updateArrowBoundingBox(arrow: ArrowElement): ArrowElement {
  if (arrow.points.length === 0) {
    return arrow;
  }

  const bbox = calculateArrowBoundingBox(arrow);

  // Ajuster les points pour qu'ils soient relatifs au nouveau bounding box
  const newPoints = arrow.points.map(point => ({
    x: arrow.x + point.x - bbox.x,
    y: arrow.y + point.y - bbox.y,
  }));

  return {
    ...arrow,
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    points: newPoints,
  };
}

/**
 * Normalise les points d'une flèche pour que le point (0,0) soit en haut à gauche
 */
export function normalizeArrowPoints(points: Point[]): {
  normalizedPoints: Point[];
  offsetX: number;
  offsetY: number;
} {
  if (points.length === 0) {
    return { normalizedPoints: [], offsetX: 0, offsetY: 0 };
  }

  // Trouver les coordonnées min
  let minX = Infinity;
  let minY = Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
  }

  // Normaliser les points
  const normalizedPoints = points.map(point => ({
    x: point.x - minX,
    y: point.y - minY,
  }));

  return {
    normalizedPoints,
    offsetX: minX,
    offsetY: minY,
  };
}
