import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { AnyExcalidrawElement, ArrowElement, TextElement, Theme } from '../elements/types';
import type { ViewportTransform } from './coordinates';
import { getThemedColor } from '$lib/utils/colorInversion';

let rc: RoughCanvas | null = null;

export function renderElements(
  ctx: CanvasRenderingContext2D,
  elements: AnyExcalidrawElement[],
  transform: ViewportTransform,
  options?: { excludeIds?: Set<string>; theme?: Theme }
) {
  if (!rc) {
    rc = rough.canvas(ctx.canvas);
  }

  ctx.save();
  ctx.translate(transform.scrollX, transform.scrollY);
  ctx.scale(transform.zoom, transform.zoom);

  for (const element of elements) {
    // Skip elements being edited
    if (options?.excludeIds?.has(element.id)) continue;

    renderElement(rc, element, ctx, options?.theme || 'light');
  }

  ctx.restore();
}

function renderElement(
  rc: RoughCanvas,
  element: AnyExcalidrawElement,
  ctx: CanvasRenderingContext2D,
  theme: Theme
) {
  // Apply theme-based color inversion
  const themedStrokeColor = getThemedColor(element.strokeColor, theme);
  const themedBgColor = element.backgroundColor === 'transparent'
    ? undefined
    : getThemedColor(element.backgroundColor, theme);

  const options = {
    stroke: themedStrokeColor,
    strokeWidth: element.strokeWidth,
    fill: themedBgColor,
    fillStyle: element.fillStyle,
    roughness: element.roughness,
    seed: element.seed,
  };

  switch (element.type) {
    case 'rectangle':
      rc.rectangle(element.x, element.y, element.width, element.height, options);
      break;
    case 'ellipse':
      rc.ellipse(
        element.x + element.width / 2,
        element.y + element.height / 2,
        element.width,
        element.height,
        options
      );
      break;
    case 'diamond':
      rc.polygon(
        [
          [element.x + element.width / 2, element.y],
          [element.x + element.width, element.y + element.height / 2],
          [element.x + element.width / 2, element.y + element.height],
          [element.x, element.y + element.height / 2],
        ],
        options
      );
      break;
    case 'arrow':
      renderArrow(rc, element as ArrowElement, ctx, theme);
      break;
    case 'text':
      renderText(element as TextElement, ctx, theme);
      break;
  }
}

function renderArrow(
  rc: RoughCanvas,
  arrow: ArrowElement,
  ctx: CanvasRenderingContext2D,
  theme: Theme
) {
  const { x, y, points, strokeWidth } = arrow;
  const themedStrokeColor = getThemedColor(arrow.strokeColor, theme);

  // Dessiner la ligne ou la courbe
  if (points.length === 2) {
    // Ligne droite
    rc.line(
      x + points[0].x,
      y + points[0].y,
      x + points[1].x,
      y + points[1].y,
      {
        stroke: themedStrokeColor,
        strokeWidth,
      }
    );
  } else if (points.length === 3) {
    // Courbe de Bézier quadratique
    const start = points[0];
    const control = points[1];
    const end = points[2];

    const path = `M ${x + start.x} ${y + start.y} Q ${x + control.x} ${y + control.y} ${x + end.x} ${y + end.y}`;
    rc.path(path, { stroke: themedStrokeColor, strokeWidth });
  } else {
    // Multi-points (path linéaire)
    const path = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${x + p.x} ${y + p.y}`
    ).join(' ');
    rc.path(path, { stroke: themedStrokeColor, strokeWidth });
  }

  // Dessiner arrowhead à la fin
  if (arrow.endArrowhead === 'arrow') {
    const lastPoint = points[points.length - 1];
    let secondLastPoint: typeof lastPoint;

    if (points.length === 3) {
      // Pour les courbes, calculer la tangente au point final
      const control = points[1];
      const end = points[2];
      // Tangente à t=1 pour une courbe de Bézier quadratique: 2(1-t)(P1-P0) + 2t(P2-P1)
      // À t=1: 2(P2-P1)
      const tangentX = end.x - control.x;
      const tangentY = end.y - control.y;
      const length = Math.sqrt(tangentX * tangentX + tangentY * tangentY);

      // Créer un point virtuel pour calculer l'angle
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

    const arrowSize = 15;
    const arrowAngle = Math.PI / 6;

    ctx.save();
    ctx.fillStyle = themedStrokeColor;
    ctx.beginPath();
    ctx.moveTo(x + lastPoint.x, y + lastPoint.y);
    ctx.lineTo(
      x + lastPoint.x - arrowSize * Math.cos(angle - arrowAngle),
      y + lastPoint.y - arrowSize * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      x + lastPoint.x - arrowSize * Math.cos(angle + arrowAngle),
      y + lastPoint.y - arrowSize * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Dessiner arrowhead au début si nécessaire
  if (arrow.startArrowhead === 'arrow') {
    const firstPoint = points[0];
    let secondPoint: typeof firstPoint;

    if (points.length === 3) {
      // Pour les courbes, calculer la tangente au point initial
      const start = points[0];
      const control = points[1];
      // Tangente à t=0: 2(P1-P0)
      const tangentX = control.x - start.x;
      const tangentY = control.y - start.y;
      const length = Math.sqrt(tangentX * tangentX + tangentY * tangentY);

      // Créer un point virtuel
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

    const arrowSize = 15;
    const arrowAngle = Math.PI / 6;

    ctx.save();
    ctx.fillStyle = themedStrokeColor;
    ctx.beginPath();
    ctx.moveTo(x + firstPoint.x, y + firstPoint.y);
    ctx.lineTo(
      x + firstPoint.x + arrowSize * Math.cos(angle - arrowAngle),
      y + firstPoint.y + arrowSize * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      x + firstPoint.x + arrowSize * Math.cos(angle + arrowAngle),
      y + firstPoint.y + arrowSize * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function renderText(text: TextElement, ctx: CanvasRenderingContext2D, theme: Theme) {
  ctx.save();

  // Configuration du texte with themed color
  const themedTextColor = getThemedColor(text.strokeColor, theme);
  ctx.font = `${text.fontSize}px ${text.fontFamily}`;
  ctx.fillStyle = themedTextColor;
  ctx.textAlign = text.textAlign;
  ctx.textBaseline = text.verticalAlign === 'top' ? 'top' : 'middle';
  ctx.globalAlpha = text.opacity / 100;

  // Position du texte
  let x = text.x;
  let y = text.y;

  // Ajuster la position selon l'alignement
  if (text.textAlign === 'center') {
    x += text.width / 2;
  } else if (text.textAlign === 'right') {
    x += text.width;
  }

  if (text.verticalAlign === 'middle') {
    y += text.height / 2;
  }

  // Dessiner le texte
  const lines = text.text.split('\n');
  const lineHeight = text.fontSize * 1.2;

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  // Indicateur visuel pour les textes liés (optionnel)
  if (text.binding) {
    ctx.strokeStyle = '#4dabf7';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(text.x - 2, text.y - 2, text.width + 4, text.height + 4);
    ctx.setLineDash([]);
  }

  ctx.restore();
}
