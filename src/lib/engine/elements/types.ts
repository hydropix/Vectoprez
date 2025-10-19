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

export interface Binding {
  elementId: string;  // ID de l'élément lié
  focus: number;      // Position sur le périmètre (-1 à 1)
  gap: number;        // Espace entre flèche et shape
  offset?: { x: number; y: number };  // Offset personnalisé par rapport au point calculé
}

export interface TextBinding {
  elementId: string;  // ID de l'élément lié
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';  // Position relative à l'élément
  offset?: { x: number; y: number };  // Offset optionnel
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
}

export interface ExcalidrawElement extends BaseElement {
  type: 'rectangle' | 'ellipse' | 'line';
  boundElements: { id: string; type: 'arrow' | 'text' }[];
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle';
  binding: TextBinding | null;  // Accrochage à un élément
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  points: Point[];
  startBinding: Binding | null;
  endBinding: Binding | null;
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

  // Sélection
  selectedElementIds: Set<string>;
  hoveredElementId: string | null;

  // UI
  viewBackgroundColor: string;
  gridSize: number | null;
  isLibraryOpen: boolean;
  isPropertiesPanelOpen: boolean;
  theme: Theme;
}
