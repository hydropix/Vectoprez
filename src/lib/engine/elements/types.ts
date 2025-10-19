import type { ColorIndex } from '$lib/utils/colorPalette';

export type ToolType =
  | 'selection'
  | 'rectangle'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'draw'
  | 'text'
  | 'eraser'
  | 'hand';

export type FillStyle = 'hachure' | 'cross-hatch' | 'solid';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type Roughness = 0 | 1 | 2; // Architect, Artist, Cartoonist
export type Theme = 'light' | 'dark';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // radians
  strokeColorIndex: ColorIndex;
  backgroundColorIndex: ColorIndex;
  fillStyle: FillStyle;
  strokeWidth: 1 | 2 | 4;
  strokeStyle: StrokeStyle;
  roughness: Roughness;
  opacity: number; // 0-100
  locked: boolean;
  seed: number; // Pour Rough.js consistency
  parentId: string | null;
  originalBounds: { width: number; height: number } | null;
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
}

export interface ExcalidrawElement extends BaseElement {
  type: 'rectangle' | 'ellipse' | 'line';
  childrenIds: string[];
  isExpanded: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle';
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  points: Point[];
  startArrowhead: 'arrow' | 'bar' | 'dot' | null;
  endArrowhead: 'arrow' | 'bar' | 'dot' | null;
}

export type AnyExcalidrawElement = ExcalidrawElement | ArrowElement | TextElement;

export interface AppState {
  // Viewport
  scrollX: number;
  scrollY: number;
  zoom: number; // 0.1 à 3.0

  // Outil actif
  activeTool: ToolType;

  // Propriétés actuelles
  currentStrokeColorIndex: ColorIndex;
  currentBackgroundColorIndex: ColorIndex;
  currentFillStyle: FillStyle;
  currentStrokeWidth: 1 | 2 | 4;
  currentStrokeStyle: StrokeStyle;
  currentRoughness: Roughness;
  currentOpacity: number;
  currentShadowEnabled: boolean;
  currentShadowBlur: number;
  currentShadowOffsetX: number;
  currentShadowOffsetY: number;
  currentShadowOpacity: number;

  // Sélection
  selectedElementIds: Set<string>;
  hoveredElementId: string | null;

  // UI
  viewBackgroundColor: string;
  gridSize: number | null;
  isLibraryOpen: boolean;
  isPropertiesPanelOpen: boolean;
  theme: Theme;

  // Clipboard
  clipboard: AnyExcalidrawElement[];
  mousePosition: Point | null;
}
