import type {
  TextElement,
  ExcalidrawElement,
  TextBinding,
  Point,
  AnyExcalidrawElement,
} from '../elements/types';

const BINDING_THRESHOLD = 20;

export function getBindableElementForText(
  elements: AnyExcalidrawElement[],
  point: Point,
  excludeId?: string
): ExcalidrawElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.id === excludeId || el.type === 'arrow' || el.type === 'text') continue;

    if (isPointNearElement(point, el as ExcalidrawElement, BINDING_THRESHOLD)) {
      return el as ExcalidrawElement;
    }
  }
  return null;
}

function isPointNearElement(
  point: Point,
  element: ExcalidrawElement,
  threshold: number
): boolean {
  const { x, y, width, height } = element;
  return (
    point.x >= x - threshold &&
    point.x <= x + width + threshold &&
    point.y >= y - threshold &&
    point.y <= y + height + threshold
  );
}

export function calculateTextBinding(
  point: Point,
  element: ExcalidrawElement,
  textWidth: number = 100,
  textHeight: number = 24,
  preserveExactPosition: boolean = true
): TextBinding {
  const { x, y, width, height } = element;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const dx = point.x - centerX;
  const dy = point.y - centerY;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let position: TextBinding['position'];

  if (absDx < width / 4 && absDy < height / 4) {
    position = 'center';
  } else if (absDx > absDy) {
    position = dx > 0 ? 'right' : 'left';
  } else {
    position = dy > 0 ? 'bottom' : 'top';
  }

  const binding: TextBinding = {
    elementId: element.id,
    position,
  };

  if (preserveExactPosition) {
    const calculatedPosition = getTextBindingPosition(binding, element, textWidth, textHeight);
    binding.offset = {
      x: point.x - calculatedPosition.x,
      y: point.y - calculatedPosition.y,
    };
  }

  return binding;
}

export function getTextBindingPosition(
  binding: TextBinding,
  element: ExcalidrawElement,
  textWidth: number,
  textHeight: number
): Point {
  const { x, y, width, height } = element;
  const gap = 10;

  let px: number, py: number;

  switch (binding.position) {
    case 'top':
      px = x + width / 2 - textWidth / 2;
      py = y - textHeight - gap;
      break;
    case 'bottom':
      px = x + width / 2 - textWidth / 2;
      py = y + height + gap;
      break;
    case 'left':
      px = x - textWidth - gap;
      py = y + height / 2 - textHeight / 2;
      break;
    case 'right':
      px = x + width + gap;
      py = y + height / 2 - textHeight / 2;
      break;
    case 'center':
      px = x + width / 2 - textWidth / 2;
      py = y + height / 2 - textHeight / 2;
      break;
  }

  if (binding.offset) {
    px += binding.offset.x;
    py += binding.offset.y;
  }

  return { x: px, y: py };
}

export function updateBoundTextElements(
  elements: AnyExcalidrawElement[],
  movedElementId: string,
  ctx?: CanvasRenderingContext2D
): AnyExcalidrawElement[] {
  const movedElement = elements.find((el) => el.id === movedElementId);
  if (!movedElement || movedElement.type === 'arrow' || movedElement.type === 'text') {
    return elements;
  }

  const movedExcElement = movedElement as ExcalidrawElement;
  if (!movedExcElement.boundElements || movedExcElement.boundElements.length === 0) {
    return elements;
  }

  return elements.map((el) => {
    if (el.type !== 'text') return el;

    const textEl = el as TextElement;
    if (!textEl.binding || textEl.binding.elementId !== movedElementId) {
      return el;
    }

    const textMetrics = measureText(textEl, ctx);
    const newPosition = getTextBindingPosition(
      textEl.binding,
      movedExcElement,
      textMetrics.width,
      textMetrics.height
    );

    return {
      ...textEl,
      x: newPosition.x,
      y: newPosition.y,
    };
  });
}

function measureText(
  textEl: TextElement,
  ctx?: CanvasRenderingContext2D
): { width: number; height: number } {
  if (!ctx) {
    const charWidth = textEl.fontSize * 0.6;
    return {
      width: textEl.text.length * charWidth,
      height: textEl.fontSize * 1.2,
    };
  }

  ctx.save();
  ctx.font = `${textEl.fontSize}px ${textEl.fontFamily}`;
  const metrics = ctx.measureText(textEl.text);
  ctx.restore();

  return {
    width: metrics.width,
    height: textEl.fontSize * 1.2,
  };
}

export function updateTextBindingOffset(
  textElement: TextElement,
  boundElement: ExcalidrawElement,
  ctx?: CanvasRenderingContext2D
): TextElement {
  if (!textElement.binding) return textElement;

  const textMetrics = measureText(textElement, ctx);
  const calculatedPosition = getTextBindingPosition(
    textElement.binding,
    boundElement,
    textMetrics.width,
    textMetrics.height
  );

  const newOffset = {
    x: textElement.x - calculatedPosition.x,
    y: textElement.y - calculatedPosition.y,
  };

  return {
    ...textElement,
    binding: {
      ...textElement.binding,
      offset: newOffset,
    },
  };
}

export function isBindingValid(
  textElement: TextElement,
  elements: AnyExcalidrawElement[]
): boolean {
  if (!textElement.binding) return true;

  const boundElement = elements.find((el) => el.id === textElement.binding?.elementId);
  return boundElement !== undefined && boundElement.type !== 'arrow' && boundElement.type !== 'text';
}
