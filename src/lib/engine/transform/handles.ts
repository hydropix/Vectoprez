import type { Point, ExcalidrawElement, TextElement } from '../elements/types';
import type { GroupBounds } from '../selection/groupBounds';

export type ResizeHandleType =
  | 'nw' // north-west (top-left)
  | 'n'  // north (top)
  | 'ne' // north-east (top-right)
  | 'e'  // east (right)
  | 'se' // south-east (bottom-right)
  | 's'  // south (bottom)
  | 'sw' // south-west (bottom-left)
  | 'w'; // west (left)

export type TransformHandleType = ResizeHandleType | 'rotate';

export interface TransformHandle {
  type: TransformHandleType;
  position: Point; // Position world coordinates
}

const HANDLE_SIZE = 8; // Radius in pixels
const ROTATE_HANDLE_DISTANCE = 50; // Distance from top edge in pixels
const HANDLE_MARGIN = 10; // Margin in pixels to offset handles and bounding box from element edges

/**
 * Get all transformation handles for an element
 */
export function getTransformHandles(
  element: ExcalidrawElement | TextElement,
  zoom: number
): TransformHandle[] {
  const handles: TransformHandle[] = [];
  const { x, y, width, height, angle } = element;

  // Calculate center for rotation
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Helper function to rotate a point around the center
  const rotatePoint = (px: number, py: number): Point => {
    if (angle === 0) return { x: px, y: py };

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = px - centerX;
    const dy = py - centerY;

    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
    };
  };

  // Resize handles at corners and midpoints with margin offset
  const margin = HANDLE_MARGIN / zoom;
  const handlePositions: { type: ResizeHandleType; x: number; y: number }[] = [
    { type: 'nw', x: x - margin, y: y - margin },
    { type: 'n', x: x + width / 2, y: y - margin },
    { type: 'ne', x: x + width + margin, y: y - margin },
    { type: 'e', x: x + width + margin, y: y + height / 2 },
    { type: 'se', x: x + width + margin, y: y + height + margin },
    { type: 's', x: x + width / 2, y: y + height + margin },
    { type: 'sw', x: x - margin, y: y + height + margin },
    { type: 'w', x: x - margin, y: y + height / 2 },
  ];

  for (const pos of handlePositions) {
    const rotated = rotatePoint(pos.x, pos.y);
    handles.push({
      type: pos.type,
      position: rotated,
    });
  }

  // Rotation handle above the element
  const rotateHandleY = y - ROTATE_HANDLE_DISTANCE / zoom;
  const rotatePos = rotatePoint(x + width / 2, rotateHandleY);
  handles.push({
    type: 'rotate',
    position: rotatePos,
  });

  return handles;
}

/**
 * Test if a point is on a transform handle
 */
export function getHandleAtPosition(
  element: ExcalidrawElement | TextElement,
  point: Point,
  zoom: number
): TransformHandle | null {
  const handles = getTransformHandles(element, zoom);
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
 * Render transformation handles for a selected element
 */
export function renderTransformHandles(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement | TextElement,
  zoom: number
) {
  const handles = getTransformHandles(element, zoom);
  const { x, y, width, height } = element;

  ctx.save();

  // Draw bounding box with modern style and margin
  const margin = HANDLE_MARGIN / zoom;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  if (element.angle !== 0) {
    ctx.translate(centerX, centerY);
    ctx.rotate(element.angle);
    ctx.translate(-centerX, -centerY);
  }

  // Glow effect for bounding box
  ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
  ctx.shadowBlur = 8 / zoom;

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([8 / zoom, 4 / zoom]);
  // Draw bounding box with margin offset
  ctx.strokeRect(x - margin, y - margin, width + margin * 2, height + margin * 2);
  ctx.setLineDash([]);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.restore();

  // Draw handles in world coordinates (they are already positioned with rotation)
  ctx.save();

  // Draw handles
  for (const handle of handles) {
    const { x: hx, y: hy } = handle.position;

    if (handle.type === 'rotate') {
      // Rotation handle: circle with a line connecting to the element
      const topMiddle = handles.find(h => h.type === 'n')!;

      // Draw connecting line
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(topMiddle.position.x, topMiddle.position.y);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      // Draw rotation handle (larger circle)
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.arc(hx, hy, (HANDLE_SIZE + 2) / zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw rotation icon (circular arrow indicator)
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5 / zoom;
      ctx.beginPath();
      ctx.arc(hx, hy, 4 / zoom, 0.2, Math.PI * 1.8);
      ctx.stroke();
    } else {
      // Resize handle: square
      const size = HANDLE_SIZE / zoom;

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / zoom;

      ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
    }
  }

  ctx.restore();
}

/**
 * Get cursor type for a given handle
 */
export function getCursorForHandle(
  handleType: TransformHandleType,
  elementAngle: number
): string {
  if (handleType === 'rotate') {
    return 'grab';
  }

  // Calculate effective angle considering element rotation
  const handleAngles: Record<ResizeHandleType, number> = {
    'n': 0,
    'ne': 45,
    'e': 90,
    'se': 135,
    's': 180,
    'sw': 225,
    'w': 270,
    'nw': 315,
  };

  const baseAngle = handleAngles[handleType as ResizeHandleType];
  const totalAngle = (baseAngle + (elementAngle * 180 / Math.PI)) % 360;

  // Map angle to cursor
  if (totalAngle >= 337.5 || totalAngle < 22.5) return 'ns-resize';
  if (totalAngle >= 22.5 && totalAngle < 67.5) return 'nesw-resize';
  if (totalAngle >= 67.5 && totalAngle < 112.5) return 'ew-resize';
  if (totalAngle >= 112.5 && totalAngle < 157.5) return 'nwse-resize';
  if (totalAngle >= 157.5 && totalAngle < 202.5) return 'ns-resize';
  if (totalAngle >= 202.5 && totalAngle < 247.5) return 'nesw-resize';
  if (totalAngle >= 247.5 && totalAngle < 292.5) return 'ew-resize';
  if (totalAngle >= 292.5 && totalAngle < 337.5) return 'nwse-resize';

  return 'default';
}

export function getGroupTransformHandles(
  groupBounds: GroupBounds,
  zoom: number
): TransformHandle[] {
  const handles: TransformHandle[] = [];
  const { x, y, width, height } = groupBounds;

  const margin = HANDLE_MARGIN / zoom;
  const handlePositions: { type: ResizeHandleType; x: number; y: number }[] = [
    { type: 'nw', x: x - margin, y: y - margin },
    { type: 'ne', x: x + width + margin, y: y - margin },
    { type: 'se', x: x + width + margin, y: y + height + margin },
    { type: 'sw', x: x - margin, y: y + height + margin },
  ];

  for (const pos of handlePositions) {
    handles.push({
      type: pos.type,
      position: { x: pos.x, y: pos.y },
    });
  }

  const rotateHandleY = y - ROTATE_HANDLE_DISTANCE / zoom;
  handles.push({
    type: 'rotate',
    position: { x: x + width / 2, y: rotateHandleY },
  });

  return handles;
}

export function getGroupHandleAtPosition(
  groupBounds: GroupBounds,
  point: Point,
  zoom: number
): TransformHandle | null {
  const handles = getGroupTransformHandles(groupBounds, zoom);
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

export function renderGroupTransformHandles(
  ctx: CanvasRenderingContext2D,
  groupBounds: GroupBounds,
  zoom: number
) {
  const handles = getGroupTransformHandles(groupBounds, zoom);
  const { x, y, width, height } = groupBounds;

  ctx.save();

  const margin = HANDLE_MARGIN / zoom;

  ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
  ctx.shadowBlur = 8 / zoom;

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([8 / zoom, 4 / zoom]);
  ctx.strokeRect(x - margin, y - margin, width + margin * 2, height + margin * 2);
  ctx.setLineDash([]);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.restore();

  ctx.save();

  for (const handle of handles) {
    const { x: hx, y: hy } = handle.position;

    if (handle.type === 'rotate') {
      const topMiddleY = y - margin;
      const topMiddleX = x + width / 2;

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(topMiddleX, topMiddleY);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.arc(hx, hy, (HANDLE_SIZE + 2) / zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5 / zoom;
      ctx.beginPath();
      ctx.arc(hx, hy, 4 / zoom, 0.2, Math.PI * 1.8);
      ctx.stroke();
    } else {
      const size = HANDLE_SIZE / zoom;

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / zoom;

      ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
    }
  }

  ctx.restore();
}
