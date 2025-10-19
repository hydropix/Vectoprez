import type { AnyExcalidrawElement, ArrowElement, TextElement, Theme } from '../elements/types';
import type { ViewportTransform } from './coordinates';
import { getColorFromIndex } from '$lib/utils/colorPalette';

function renderSmoothShape(
  element: AnyExcalidrawElement,
  ctx: CanvasRenderingContext2D,
  strokeColor: string,
  bgColor: string | undefined,
  theme: Theme
) {
  ctx.save();

  ctx.globalAlpha = element.opacity / 100;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const createPath = () => {
    ctx.beginPath();
    switch (element.type) {
      case 'rectangle': {
        const radius = Math.min(element.width, element.height) * 0.12;
        const x = element.x;
        const y = element.y;
        const w = element.width;
        const h = element.height;
        const r = Math.min(radius, w / 2, h / 2);

        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
        break;
      }
      case 'ellipse': {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const radiusX = element.width / 2;
        const radiusY = element.height / 2;

        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        break;
      }
      case 'line': {
        ctx.moveTo(element.x, element.y);
        ctx.lineTo(element.x + element.width, element.y + element.height);
        break;
      }
    }
  };

  if (element.shadowEnabled && (element.type === 'rectangle' || element.type === 'ellipse')) {
    const shadowColor = theme === 'dark'
      ? `rgba(255, 255, 255, ${element.shadowOpacity / 100})`
      : `rgba(0, 0, 0, ${element.shadowOpacity / 100})`;

    if (bgColor) {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = element.shadowBlur;
      ctx.shadowOffsetX = element.shadowOffsetX;
      ctx.shadowOffsetY = element.shadowOffsetY;

      createPath();
      ctx.fillStyle = bgColor;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = element.shadowBlur;
      ctx.shadowOffsetX = element.shadowOffsetX;
      ctx.shadowOffsetY = element.shadowOffsetY;
    }
  }

  createPath();

  if (bgColor && !element.shadowEnabled) {
    ctx.fillStyle = bgColor;
    ctx.fill();
  }

  ctx.stroke();

  ctx.restore();
}

export function renderElements(
  ctx: CanvasRenderingContext2D,
  elements: AnyExcalidrawElement[],
  transform: ViewportTransform,
  options?: { excludeIds?: Set<string>; theme?: Theme }
) {
  ctx.save();
  ctx.translate(transform.scrollX, transform.scrollY);
  ctx.scale(transform.zoom, transform.zoom);

  for (const element of elements) {
    if (options?.excludeIds?.has(element.id)) continue;

    renderElement(element, ctx, options?.theme || 'light');
  }

  ctx.restore();
}

function renderElement(
  element: AnyExcalidrawElement,
  ctx: CanvasRenderingContext2D,
  theme: Theme
) {
  const themedStrokeColor = getColorFromIndex(element.strokeColorIndex, theme);
  const themedBgColor = getColorFromIndex(element.backgroundColorIndex, theme);
  const actualBgColor = themedBgColor === 'transparent' ? undefined : themedBgColor;

  if (element.angle !== 0 && element.type !== 'arrow') {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(element.angle);
    ctx.translate(-centerX, -centerY);
  }

  switch (element.type) {
    case 'rectangle':
    case 'ellipse':
    case 'line':
      renderSmoothShape(element, ctx, themedStrokeColor, actualBgColor, theme);
      break;
    case 'arrow':
      renderArrow(element as ArrowElement, ctx, theme);
      break;
    case 'text':
      renderText(element as TextElement, ctx, theme);
      break;
  }

  if (element.angle !== 0 && element.type !== 'arrow') {
    ctx.restore();
  }
}

function renderArrow(
  arrow: ArrowElement,
  ctx: CanvasRenderingContext2D,
  theme: Theme
) {
  const { x, y, points, strokeWidth } = arrow;
  const themedStrokeColor = getColorFromIndex(arrow.strokeColorIndex, theme);

  ctx.save();
  ctx.globalAlpha = arrow.opacity / 100;
  ctx.strokeStyle = themedStrokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  if (points.length === 2) {
    ctx.moveTo(x + points[0].x, y + points[0].y);
    ctx.lineTo(x + points[1].x, y + points[1].y);
  } else if (points.length === 3) {
    const start = points[0];
    const control = points[1];
    const end = points[2];

    ctx.moveTo(x + start.x, y + start.y);
    ctx.quadraticCurveTo(
      x + control.x,
      y + control.y,
      x + end.x,
      y + end.y
    );
  } else {
    ctx.moveTo(x + points[0].x, y + points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(x + points[i].x, y + points[i].y);
    }
  }
  ctx.stroke();
  ctx.restore();

  if (arrow.endArrowhead === 'arrow') {
    const lastPoint = points[points.length - 1];
    let secondLastPoint: typeof lastPoint;

    if (points.length === 3) {
      const control = points[1];
      const end = points[2];
      const tangentX = end.x - control.x;
      const tangentY = end.y - control.y;
      const length = Math.sqrt(tangentX * tangentX + tangentY * tangentY);

      secondLastPoint = {
        x: lastPoint.x - (tangentX / length) * 10,
        y: lastPoint.y - (tangentY / length) * 10,
      };
    } else {
      secondLastPoint = points[points.length - 2] || points[0];
    }

    const angle = Math.atan2(
      lastPoint.y - secondLastPoint.y,
      lastPoint.x - secondLastPoint.x
    );

    const arrowLength = Math.max(strokeWidth * 3, 10);
    const arrowWidth = Math.PI / 6;

    ctx.save();
    ctx.strokeStyle = themedStrokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = arrow.opacity / 100;

    ctx.beginPath();
    ctx.moveTo(
      x + lastPoint.x - arrowLength * Math.cos(angle - arrowWidth),
      y + lastPoint.y - arrowLength * Math.sin(angle - arrowWidth)
    );
    ctx.lineTo(x + lastPoint.x, y + lastPoint.y);
    ctx.lineTo(
      x + lastPoint.x - arrowLength * Math.cos(angle + arrowWidth),
      y + lastPoint.y - arrowLength * Math.sin(angle + arrowWidth)
    );
    ctx.stroke();
    ctx.restore();
  }

  if (arrow.startArrowhead === 'arrow') {
    const firstPoint = points[0];
    let secondPoint: typeof firstPoint;

    if (points.length === 3) {
      const start = points[0];
      const control = points[1];
      const tangentX = control.x - start.x;
      const tangentY = control.y - start.y;
      const length = Math.sqrt(tangentX * tangentX + tangentY * tangentY);

      secondPoint = {
        x: firstPoint.x + (tangentX / length) * 10,
        y: firstPoint.y + (tangentY / length) * 10,
      };
    } else {
      secondPoint = points[1] || points[0];
    }

    const angle = Math.atan2(
      secondPoint.y - firstPoint.y,
      secondPoint.x - firstPoint.x
    );

    const arrowLength = Math.max(strokeWidth * 3, 10);
    const arrowWidth = Math.PI / 6;

    ctx.save();
    ctx.strokeStyle = themedStrokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = arrow.opacity / 100;

    ctx.beginPath();
    ctx.moveTo(
      x + firstPoint.x + arrowLength * Math.cos(angle - arrowWidth),
      y + firstPoint.y + arrowLength * Math.sin(angle - arrowWidth)
    );
    ctx.lineTo(x + firstPoint.x, y + firstPoint.y);
    ctx.lineTo(
      x + firstPoint.x + arrowLength * Math.cos(angle + arrowWidth),
      y + firstPoint.y + arrowLength * Math.sin(angle + arrowWidth)
    );
    ctx.stroke();
    ctx.restore();
  }
}

function renderText(text: TextElement, ctx: CanvasRenderingContext2D, theme: Theme) {
  ctx.save();

  const themedTextColor = getColorFromIndex(text.strokeColorIndex, theme);
  ctx.font = `${text.fontSize}px ${text.fontFamily}`;
  ctx.fillStyle = themedTextColor;
  ctx.textAlign = text.textAlign;
  ctx.textBaseline = text.verticalAlign === 'top' ? 'top' : 'middle';
  ctx.globalAlpha = text.opacity / 100;

  let x = text.x;
  let y = text.y;

  if (text.textAlign === 'center') {
    x += text.width / 2;
  } else if (text.textAlign === 'right') {
    x += text.width;
  }

  if (text.verticalAlign === 'middle') {
    y += text.height / 2;
  }

  const lines = text.text.split('\n');
  const lineHeight = text.fontSize * 1.2;

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  ctx.restore();
}
