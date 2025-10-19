import type { AnyExcalidrawElement, AppState, ArrowElement, TextElement } from '../engine/elements/types';
import { renderElements } from '../engine/canvas/renderer';
import { getElementsBounds } from './geometry';
import { validateExcalidrawFile } from './validation';
import { DEFAULT_EXPORT_SCALE, DEFAULT_EXPORT_PADDING } from '$lib/constants';

// ===== Export PNG =====

export async function exportToPNG(
  elements: AnyExcalidrawElement[],
  options: {
    backgroundColor?: string;
    scale?: number;
    padding?: number;
  } = {}
): Promise<Blob> {
  const {
    backgroundColor = '#ffffff',
    scale = DEFAULT_EXPORT_SCALE,
    padding = DEFAULT_EXPORT_PADDING
  } = options;

  // Calculate bounding box
  const bounds = getElementsBounds(elements);
  if (!bounds) throw new Error('No elements to export');

  // Create temporary canvas
  const canvas = document.createElement('canvas');
  canvas.width = (bounds.width + padding * 2) * scale;
  canvas.height = (bounds.height + padding * 2) * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  // Apply scale
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

  // Render elements with offset
  renderElements(ctx, elements, {
    scrollX: -bounds.x + padding,
    scrollY: -bounds.y + padding,
    zoom: 1,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
}

// ===== Export SVG =====

export function exportToSVG(
  elements: AnyExcalidrawElement[],
  options: { backgroundColor?: string; padding?: number } = {}
): string {
  const { backgroundColor = 'transparent', padding = DEFAULT_EXPORT_PADDING } = options;

  const bounds = getElementsBounds(elements);
  if (!bounds) return '<svg></svg>';

  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  if (backgroundColor !== 'transparent') {
    svg += `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;
  }

  svg += `<g transform="translate(${-bounds.x + padding}, ${-bounds.y + padding})">`;

  for (const el of elements) {
    svg += elementToSVG(el);
  }

  svg += '</g></svg>';

  return svg;
}

function elementToSVG(element: AnyExcalidrawElement): string {
  const { x, y, width, height, strokeColor, backgroundColor, strokeWidth, opacity } = element;

  const baseStyle = `stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${
    backgroundColor === 'transparent' ? 'none' : backgroundColor
  }" opacity="${opacity / 100}"`;

  switch (element.type) {
    case 'rectangle':
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${baseStyle}/>`;

    case 'ellipse': {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rx = width / 2;
      const ry = height / 2;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${baseStyle}/>`;
    }

    case 'arrow': {
      const arrow = element as ArrowElement;
      if (arrow.points && arrow.points.length >= 2) {
        let pathData: string;

        if (arrow.points.length === 3) {
          // Bezier curve
          const start = arrow.points[0];
          const control = arrow.points[1];
          const end = arrow.points[2];
          pathData = `M ${x + start.x} ${y + start.y} Q ${x + control.x} ${y + control.y} ${x + end.x} ${y + end.y}`;
        } else {
          // Straight line or polyline
          const startX = x + arrow.points[0].x;
          const startY = y + arrow.points[0].y;
          pathData = `M ${startX} ${startY}`;
          for (let i = 1; i < arrow.points.length; i++) {
            pathData += ` L ${x + arrow.points[i].x} ${y + arrow.points[i].y}`;
          }
        }

        return `<path d="${pathData}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity / 100}"/>`;
      }
      return '';
    }

    case 'text': {
      const textEl = element as TextElement;
      const lines = textEl.text.split('\n');
      const lineHeight = textEl.fontSize * 1.2;

      let textSvg = `<text x="${x}" y="${y}" font-family="${textEl.fontFamily}" font-size="${textEl.fontSize}" fill="${strokeColor}" opacity="${opacity / 100}" text-anchor="${textEl.textAlign}">`;
      lines.forEach((line, i) => {
        textSvg += `<tspan x="${x}" dy="${i === 0 ? textEl.fontSize : lineHeight}">${escapeXml(line)}</tspan>`;
      });
      textSvg += '</text>';
      return textSvg;
    }

    default:
      return '';
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ===== Export/Import JSON =====

export interface ExcalidrawFile {
  type: 'excalidraw';
  version: 1;
  elements: AnyExcalidrawElement[];
  appState: Partial<AppState>;
}

export function exportToJSON(
  elements: AnyExcalidrawElement[],
  appState: Partial<AppState>
): string {
  const data: ExcalidrawFile = {
    type: 'excalidraw',
    version: 1,
    elements,
    appState,
  };
  return JSON.stringify(data, null, 2);
}

export function importFromJSON(json: string): ExcalidrawFile {
  const data = JSON.parse(json);

  // Validate the file structure
  validateExcalidrawFile(data);

  return data as ExcalidrawFile;
}

// ===== Utility =====

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
