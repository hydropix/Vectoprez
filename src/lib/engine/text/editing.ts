import type { TextElement } from '../elements/types';

export interface TextEditingState {
  isEditing: boolean;
  element: TextElement | null;
  textareaRef: HTMLTextAreaElement | null;
}

export function createTextEditingState(): TextEditingState {
  return {
    isEditing: false,
    element: null,
    textareaRef: null,
  };
}

export function updateTextDimensions(
  text: string,
  fontSize: number,
  fontFamily: string,
  ctx: CanvasRenderingContext2D
): { width: number; height: number } {
  ctx.save();
  ctx.font = `${fontSize}px ${fontFamily}`;

  const lines = text.split('\n');
  let maxWidth = 0;

  for (const line of lines) {
    const metrics = ctx.measureText(line);
    maxWidth = Math.max(maxWidth, metrics.width);
  }

  const lineHeight = fontSize * 1.2;
  const lineCount = Math.max(1, lines.length);
  const textHeight = lineHeight * lineCount;

  ctx.restore();

  const padding = 10;

  return {
    width: maxWidth + padding,
    height: textHeight,
  };
}

export function shouldDeleteEmptyText(text: string): boolean {
  return text.trim() === '';
}

export function getTextareaPosition(
  element: TextElement,
  scrollX: number,
  scrollY: number,
  zoom: number
) {
  return {
    left: element.x * zoom + scrollX,
    top: element.y * zoom + scrollY,
    width: element.width * zoom,
    minHeight: element.height * zoom,
    fontSize: element.fontSize * zoom,
  };
}
