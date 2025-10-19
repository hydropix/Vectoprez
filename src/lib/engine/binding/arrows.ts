import type { ArrowElement, ExcalidrawElement, Binding, Point, AnyExcalidrawElement } from '../elements/types';

const BINDING_THRESHOLD = 20; // pixels

export function getBindableElementAtPosition(
  elements: AnyExcalidrawElement[],
  point: Point,
  excludeId?: string
): ExcalidrawElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.id === excludeId || el.type === 'arrow') continue;

    if (isPointNearElement(point, el as ExcalidrawElement, BINDING_THRESHOLD)) {
      return el as ExcalidrawElement;
    }
  }
  return null;
}

function isPointNearElement(
  point: Point,
  element: ExcalidrawElement | ArrowElement,
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

export function calculateBinding(
  point: Point,
  element: ExcalidrawElement,
  preserveExactPosition: boolean = true
): Binding {
  const { x, y, width, height } = element;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const dx = point.x - centerX;
  const dy = point.y - centerY;

  const focus = Math.atan2(dy, dx) / Math.PI;

  const binding: Binding = {
    elementId: element.id,
    focus,
    gap: 10,
  };

  if (preserveExactPosition) {
    const calculatedPoint = getBindingPoint(binding, element);
    binding.offset = {
      x: point.x - calculatedPoint.x,
      y: point.y - calculatedPoint.y,
    };
  }

  return binding;
}

export function getBindingPoint(
  binding: Binding,
  element: ExcalidrawElement
): Point {
  const { x, y, width, height } = element;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const angle = binding.focus * Math.PI;

  let px: number, py: number;

  if (element.type === 'ellipse') {
    const rx = width / 2;
    const ry = height / 2;
    px = centerX + rx * Math.cos(angle);
    py = centerY + ry * Math.sin(angle);
  } else {
    const rx = width / 2;
    const ry = height / 2;
    px = centerX + rx * Math.cos(angle);
    py = centerY + ry * Math.sin(angle);

    if (px < x) px = x;
    if (px > x + width) px = x + width;
    if (py < y) py = y;
    if (py > y + height) py = y + height;
  }

  const gapDx = binding.gap * Math.cos(angle);
  const gapDy = binding.gap * Math.sin(angle);

  const point = {
    x: px + gapDx,
    y: py + gapDy,
  };

  if (binding.offset) {
    point.x += binding.offset.x;
    point.y += binding.offset.y;
  }

  return point;
}

export function updateBoundElements(
  elements: AnyExcalidrawElement[],
  movedElementId: string
): AnyExcalidrawElement[] {
  const movedElement = elements.find(el => el.id === movedElementId);
  if (!movedElement || movedElement.type === 'arrow') {
    return elements;
  }

  const movedExcElement = movedElement as ExcalidrawElement;
  if (!movedExcElement.boundElements || movedExcElement.boundElements.length === 0) {
    return elements;
  }

  return elements.map(el => {
    if (el.type !== 'arrow') return el;

    const arrow = el as ArrowElement;
    let updated = false;
    const newPoints = [...arrow.points];

    if (arrow.startBinding?.elementId === movedElementId) {
      const bindingPoint = getBindingPoint(arrow.startBinding, movedExcElement);
      newPoints[0] = {
        x: bindingPoint.x - arrow.x,
        y: bindingPoint.y - arrow.y,
      };
      updated = true;
    }

    if (arrow.endBinding?.elementId === movedElementId) {
      const bindingPoint = getBindingPoint(arrow.endBinding, movedExcElement);
      const lastIdx = newPoints.length - 1;
      newPoints[lastIdx] = {
        x: bindingPoint.x - arrow.x,
        y: bindingPoint.y - arrow.y,
      };
      updated = true;
    }

    return updated ? { ...arrow, points: newPoints } : arrow;
  });
}

/**
 * Recalcule les offsets des bindings d'une flèche quand elle est déplacée manuellement
 */
export function updateArrowBindingOffsets(
  arrowElement: ArrowElement,
  elements: AnyExcalidrawElement[]
): ArrowElement {
  let updatedArrow = { ...arrowElement };
  let hasChanges = false;

  if (updatedArrow.startBinding) {
    const boundElement = elements.find(el => el.id === updatedArrow.startBinding!.elementId);
    if (boundElement && boundElement.type !== 'arrow' && boundElement.type !== 'text') {
      const startPoint = {
        x: updatedArrow.x + updatedArrow.points[0].x,
        y: updatedArrow.y + updatedArrow.points[0].y,
      };
      const newBinding = calculateBinding(startPoint, boundElement as ExcalidrawElement, true);
      updatedArrow.startBinding = newBinding;
      hasChanges = true;
    }
  }

  if (updatedArrow.endBinding) {
    const boundElement = elements.find(el => el.id === updatedArrow.endBinding!.elementId);
    if (boundElement && boundElement.type !== 'arrow' && boundElement.type !== 'text') {
      const lastIdx = updatedArrow.points.length - 1;
      const endPoint = {
        x: updatedArrow.x + updatedArrow.points[lastIdx].x,
        y: updatedArrow.y + updatedArrow.points[lastIdx].y,
      };
      const newBinding = calculateBinding(endPoint, boundElement as ExcalidrawElement, true);
      updatedArrow.endBinding = newBinding;
      hasChanges = true;
    }
  }

  return hasChanges ? updatedArrow : arrowElement;
}
