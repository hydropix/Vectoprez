// UI & Interaction Constants
export const DOUBLE_CLICK_THRESHOLD = 300; // milliseconds
export const DISTANCE_THRESHOLD = 5; // pixels for double-click detection

// Binding & Snapping
export const BINDING_THRESHOLD = 20; // pixels - proximity threshold for element binding
export const BINDING_GAP = 10; // pixels - standard gap between arrow and bound element

// Arrow Handles
export const HANDLE_SIZE = 8; // pixels - radius of arrow control handles
export const ARROW_HIT_THRESHOLD = 10; // pixels - tolerance for clicking on arrows
export const ARROW_SIZE = 15; // pixels - size of arrowhead
export const ARROW_ANGLE = Math.PI / 6; // radians - angle of arrowhead

// Bezier Curves
export const CURVE_OFFSET_RATIO = 0.2; // 20% of arrow length for initial curve offset
export const BEZIER_SAMPLES = 20; // number of samples for bezier curve calculations

// Zoom & Viewport
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3.0;
export const ZOOM_STEP = 1.2; // multiplier for zoom in/out
export const DEFAULT_ZOOM = 1.0;

// Grid
export const DEFAULT_GRID_SIZE = 20; // pixels

// Element Constraints
export const MIN_ELEMENT_SIZE_SCREEN = 32; // pixels - minimum size in screen space for visibility

// Export
export const DEFAULT_EXPORT_SCALE = 2; // for PNG export
export const DEFAULT_EXPORT_PADDING = 20; // pixels

// Storage & History
export const AUTOSAVE_INTERVAL = 5000; // milliseconds - 5 seconds
export const MAX_HISTORY = 50; // maximum undo/redo entries
export const STORAGE_KEY_AUTOSAVE = 'excalidraw-autosave';
export const STORAGE_KEY_LIBRARY = 'excalidraw-library';
export const STORAGE_KEY_THEME = 'theme';

// Text
export const DEFAULT_FONT_SIZE = 20;
export const DEFAULT_FONT_FAMILY = 'Virgil, Segoe UI Emoji';
export const TEXT_LINE_HEIGHT = 1.2;
export const TEXT_MIN_WIDTH = 100;
export const TEXT_PADDING = 10; // padding for text binding

// Rendering
export const SELECTION_STROKE_COLOR = '#4dabf7';
export const SELECTION_LINE_WIDTH = 2;
export const SELECTION_DASH_PATTERN = [5, 5];

// Colors
export const DEFAULT_STROKE_COLOR_LIGHT = '#000000';
export const DEFAULT_STROKE_COLOR_DARK = '#ffffff';
export const DEFAULT_BACKGROUND_COLOR = 'transparent';

// Luminance thresholds for color inversion
export const LUMINANCE_DARK_THRESHOLD = 0.2; // 20%
export const LUMINANCE_LIGHT_THRESHOLD = 0.8; // 80%
export const COLOR_INVERSION_BOOST = 100; // RGB boost for inverted dark colors
export const COLOR_DARKEN_AMOUNT = 200; // RGB reduction for inverted light colors
