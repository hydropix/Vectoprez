import type { Point } from '../elements/types';

export interface ViewportTransform {
  scrollX: number;
  scrollY: number;
  zoom: number;
}

// Convertir coordonnées écran → world (canvas virtuel)
export function screenToWorld(
  screenPoint: Point,
  transform: ViewportTransform
): Point {
  return {
    x: (screenPoint.x - transform.scrollX) / transform.zoom,
    y: (screenPoint.y - transform.scrollY) / transform.zoom,
  };
}

// Convertir coordonnées world → écran
export function worldToScreen(
  worldPoint: Point,
  transform: ViewportTransform
): Point {
  return {
    x: worldPoint.x * transform.zoom + transform.scrollX,
    y: worldPoint.y * transform.zoom + transform.scrollY,
  };
}
