import type { TextElement, Point } from '../elements/types';
import type { ResizeHandleType } from '../transform/handles';
import { rotatePoint } from '../transform/geometry';
import { updateTextDimensions } from './editing';

export function calculateTextScale(
  originalElement: TextElement,
  handleType: ResizeHandleType,
  startPoint: Point,
  currentPoint: Point,
  ctx: CanvasRenderingContext2D
): Partial<TextElement> {
  const { x, y, width, height, angle, fontSize, fontFamily, text } = originalElement;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const unrotatePoint = (p: Point): Point => {
    if (angle === 0) return p;
    return rotatePoint(p, { x: centerX, y: centerY }, -angle);
  };

  const unrotatedStart = unrotatePoint(startPoint);
  const unrotatedCurrent = unrotatePoint(currentPoint);

  const dx = unrotatedCurrent.x - unrotatedStart.x;
  const dy = unrotatedCurrent.y - unrotatedStart.y;

  let scaleX = 1;
  let scaleY = 1;

  switch (handleType) {
    case 'se':
      scaleX = 1 + dx / width;
      scaleY = 1 + dy / height;
      break;
    case 'nw':
      scaleX = 1 - dx / width;
      scaleY = 1 - dy / height;
      break;
    case 'ne':
      scaleX = 1 + dx / width;
      scaleY = 1 - dy / height;
      break;
    case 'sw':
      scaleX = 1 - dx / width;
      scaleY = 1 + dy / height;
      break;
    case 'n':
      scaleY = 1 - dy / height;
      scaleX = scaleY;
      break;
    case 's':
      scaleY = 1 + dy / height;
      scaleX = scaleY;
      break;
    case 'e':
      scaleX = 1 + dx / width;
      scaleY = scaleX;
      break;
    case 'w':
      scaleX = 1 - dx / width;
      scaleY = scaleX;
      break;
  }

  const scale = Math.min(Math.abs(scaleX), Math.abs(scaleY));
  const finalScale = Math.max(0.1, scale);

  const newFontSize = Math.max(8, Math.round(fontSize * finalScale));

  const newDimensions = updateTextDimensions(text, newFontSize, fontFamily, ctx);

  let newX = x;
  let newY = y;

  switch (handleType) {
    case 'nw':
      newX = x + width - newDimensions.width;
      newY = y + height - newDimensions.height;
      break;
    case 'n':
      newX = x + (width - newDimensions.width) / 2;
      newY = y + height - newDimensions.height;
      break;
    case 'ne':
      newY = y + height - newDimensions.height;
      break;
    case 'e':
      newY = y + (height - newDimensions.height) / 2;
      break;
    case 'se':
      break;
    case 's':
      newX = x + (width - newDimensions.width) / 2;
      break;
    case 'sw':
      newX = x + width - newDimensions.width;
      break;
    case 'w':
      newX = x + width - newDimensions.width;
      newY = y + (height - newDimensions.height) / 2;
      break;
  }

  if (angle !== 0) {
    const originalCenter = { x: centerX, y: centerY };
    const newCenter = {
      x: newX + newDimensions.width / 2,
      y: newY + newDimensions.height / 2,
    };

    const rotatedNewCenter = rotatePoint(newCenter, originalCenter, angle);

    newX = rotatedNewCenter.x - newDimensions.width / 2;
    newY = rotatedNewCenter.y - newDimensions.height / 2;
  }

  return {
    x: newX,
    y: newY,
    width: newDimensions.width,
    height: newDimensions.height,
    fontSize: newFontSize,
  };
}

export function getTextScaleCursor(handleType: ResizeHandleType, elementAngle: number): string {
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

  const baseAngle = handleAngles[handleType];
  const totalAngle = (baseAngle + (elementAngle * 180 / Math.PI)) % 360;

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
