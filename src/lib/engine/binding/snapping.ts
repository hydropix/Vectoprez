export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(
  point: { x: number; y: number },
  gridSize: number
): { x: number; y: number } {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}
