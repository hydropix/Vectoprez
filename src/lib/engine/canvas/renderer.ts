import type { AnyExcalidrawElement, ArrowElement, TextElement, Theme } from '../elements/types';
import type { ViewportTransform } from './coordinates';
import { getThemedColor } from '$lib/utils/colorInversion';

// Rendu lisse avec canvas natif pour un style moderne
function renderSmoothShape(
  element: AnyExcalidrawElement,
  ctx: CanvasRenderingContext2D,
  strokeColor: string,
  bgColor: string | undefined
) {
  ctx.save();

  ctx.globalAlpha = element.opacity / 100;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();

  switch (element.type) {
    case 'rectangle': {
      // Rectangle avec coins arrondis
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
      // Ellipse lisse
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const radiusX = element.width / 2;
      const radiusY = element.height / 2;

      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      break;
    }
  }

  // Remplissage
  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fill();
  }

  // Contour
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
    // Skip elements being edited
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
  // Apply theme-based color inversion
  const themedStrokeColor = getThemedColor(element.strokeColor, theme);
  const themedBgColor = element.backgroundColor === 'transparent'
    ? undefined
    : getThemedColor(element.backgroundColor, theme);

  // Utiliser le rendu lisse pour toutes les formes (style moderne)
  switch (element.type) {
    case 'rectangle':
    case 'ellipse':
      renderSmoothShape(element, ctx, themedStrokeColor, themedBgColor);
      break;
    case 'arrow':
      renderArrow(element as ArrowElement, ctx, theme);
      break;
    case 'text':
      renderText(element as TextElement, ctx, theme);
      break;
  }
}

function renderArrow(
  arrow: ArrowElement,
  ctx: CanvasRenderingContext2D,
  theme: Theme
) {
  const { x, y, points, strokeWidth } = arrow;
  const themedStrokeColor = getThemedColor(arrow.strokeColor, theme);

  // Utiliser le canvas natif pour un rendu lisse et moderne
  ctx.save();
  ctx.globalAlpha = arrow.opacity / 100;
  ctx.strokeStyle = themedStrokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Dessiner la ligne ou la courbe
  ctx.beginPath();
  if (points.length === 2) {
    // Ligne droite
    ctx.moveTo(x + points[0].x, y + points[0].y);
    ctx.lineTo(x + points[1].x, y + points[1].y);
  } else if (points.length === 3) {
    // Courbe de Bézier quadratique
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
    // Multi-points (path linéaire)
    ctx.moveTo(x + points[0].x, y + points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(x + points[i].x, y + points[i].y);
    }
  }
  ctx.stroke();
  ctx.restore();

  // Dessiner arrowhead à la fin avec un design moderne et minimaliste
  if (arrow.endArrowhead === 'arrow') {
    const lastPoint = points[points.length - 1];
    let secondLastPoint: typeof lastPoint;

    if (points.length === 3) {
      // Pour les courbes, calculer la tangente au point final
      const control = points[1];
      const end = points[2];
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

    // Design moderne: flèche simple et épurée
    const arrowLength = Math.max(strokeWidth * 3, 10);
    const arrowWidth = Math.PI / 6; // Angle de 30 degrés pour un look épuré

    ctx.save();
    ctx.strokeStyle = themedStrokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = arrow.opacity / 100;

    // Dessiner les deux lignes de la pointe (style ouvert, non rempli)
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

  // Dessiner arrowhead au début si nécessaire avec un design moderne et minimaliste
  if (arrow.startArrowhead === 'arrow') {
    const firstPoint = points[0];
    let secondPoint: typeof firstPoint;

    if (points.length === 3) {
      // Pour les courbes, calculer la tangente au point initial
      const start = points[0];
      const control = points[1];
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

    // Design moderne: flèche simple et épurée
    const arrowLength = Math.max(strokeWidth * 3, 10);
    const arrowWidth = Math.PI / 6; // Angle de 30 degrés pour un look épuré

    ctx.save();
    ctx.strokeStyle = themedStrokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = arrow.opacity / 100;

    // Dessiner les deux lignes de la pointe (style ouvert, non rempli)
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
