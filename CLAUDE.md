# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vectoprez is an Excalidraw-inspired vector drawing application built with SvelteKit, TypeScript, and Rough.js. It features hand-drawn style graphics, arrow binding, text editing, undo/redo, and export capabilities. The app runs as a web application and optionally as a Tauri desktop app.

## Code Comments Policy

**IMPORTANT**: Code comments should be extremely rare and used only when absolutely necessary. When comments are added, they MUST be in English only. The code should be self-documenting through clear naming conventions, well-structured functions, and appropriate type definitions. Only add comments to explain complex algorithms, non-obvious business logic, or important architectural decisions that cannot be expressed through code structure alone.

## Development Commands

```bash
# Start development server (web)
npm run dev                    # Runs on http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check                  # One-time type check
npm run check:watch            # Watch mode

# Tauri desktop app (optional)
npm run tauri:dev              # Development mode
npm run tauri:build            # Production build
```

## Architecture Overview

### State Management

The app uses Svelte stores for reactive state management:

- **[src/lib/stores/appState.ts](src/lib/stores/appState.ts)**: Global application state (viewport, tools, theme, selection)
- **[src/lib/stores/elements.ts](src/lib/stores/elements.ts)**: Canvas elements collection with CRUD helpers
- **[src/lib/stores/library.ts](src/lib/stores/library.ts)**: Reusable component library

State updates propagate reactively through the component tree. The Canvas component reacts to store changes via `$appState` and `$elements` subscriptions.

### Element System

Elements are defined in [src/lib/engine/elements/types.ts](src/lib/engine/elements/types.ts):

- `ExcalidrawElement`: Rectangles, ellipses, diamonds
- `ArrowElement`: Arrows with start/end bindings and control points
- `TextElement`: Text with optional binding to other elements

All elements share a `BaseElement` interface with properties like position, dimensions, stroke, fill, opacity, and a seed for Rough.js consistency.

The factory pattern in [src/lib/engine/elements/factory.ts](src/lib/engine/elements/factory.ts) creates elements with unique IDs and default properties.

### Binding System

Two binding systems allow elements to connect:

**Arrow Binding** ([src/lib/engine/binding/arrows.ts](src/lib/engine/binding/arrows.ts)):
- Arrows attach to shapes at start/end points
- `Binding` interface: `{ elementId, focus, gap, offset? }`
- `focus`: Normalized position (-1 to 1) around shape perimeter
- `gap`: Distance between arrow and shape (default 10px)
- `offset`: Custom position adjustment after calculation
- When shapes move, `updateBoundElements()` recalculates arrow endpoints

**Text Binding** ([src/lib/engine/binding/text.ts](src/lib/engine/binding/text.ts)):
- Text can attach to shapes at predefined positions (top, bottom, left, right, center)
- `TextBinding` interface: `{ elementId, position, offset? }`
- When bound shapes move, text follows using `updateBoundTextElements()`

### Rendering Pipeline

Rendering happens in [src/lib/engine/canvas/renderer.ts](src/lib/engine/canvas/renderer.ts):

1. Canvas context is transformed (translate for pan, scale for zoom)
2. Elements are rendered in order using Rough.js
3. Arrows support straight lines (2 points) or quadratic Bezier curves (3 points)
4. Theme-aware color inversion converts stored canonical colors to display colors

The renderer runs in `requestAnimationFrame` loop in [Canvas.svelte](src/lib/components/Canvas.svelte).

### History System

Undo/redo is implemented in [src/lib/engine/history/undoRedo.ts](src/lib/engine/history/undoRedo.ts):

- Uses `structuredClone()` for deep copying element snapshots
- Maintains separate `past` and `future` stacks
- Limited to `MAX_HISTORY` entries (defined in constants.ts)
- New actions clear the future stack
- Call `history.record($elements)` after each modification

### Color Management

The app handles theme-aware colors using a canonical storage format:

- **Storage**: Colors stored in canonical format (light theme representation)
- **Display**: Colors inverted when rendering in dark theme
- [src/lib/utils/colorInversion.ts](src/lib/utils/colorInversion.ts): `getCanonicalColor()` and `getThemedColor()`
- When creating elements, convert display colors to canonical using `getCanonicalColor(color, theme)`
- When rendering, convert canonical to display using `getThemedColor(color, theme)`

### Coordinate System

[src/lib/engine/canvas/coordinates.ts](src/lib/engine/canvas/coordinates.ts) handles transformations:

- `screenToWorld()`: Converts mouse coordinates to canvas world coordinates
- Accounts for pan (`scrollX`, `scrollY`) and zoom
- All element positions are in world coordinates
- Mouse events require conversion before collision detection or element creation

### Main Component Flow

**[Canvas.svelte](src/lib/components/Canvas.svelte)** is the core component:

1. **Mouse Events**:
   - `handleMouseDown`: Detects tool mode, starts drawing/dragging/panning
   - `handleMouseMove`: Updates element dimensions or positions during interaction
   - `handleMouseUp`: Finalizes changes, records history
   - Double-click: Edits text or adds/removes arrow control points

2. **Drawing Tools**:
   - Shapes: Create element on mouseDown, resize on mouseMove
   - Arrows: Create with start binding, update end point and binding on mouseMove
   - Text: Create element and immediately enter edit mode
   - Selection: Drag existing elements or handles

3. **Arrow Editing**:
   - Selected arrows show handles (start, end, control points)
   - Drag handles to reposition points and update bindings
   - Double-click straight arrow to add control point (convert to curve)
   - Double-click control point handle to remove it
   - Handles defined in [src/lib/engine/arrows/handles.ts](src/lib/engine/arrows/handles.ts)

4. **Text Editing**:
   - When text tool creates element or double-clicking text, a textarea overlay appears
   - Input updates element dimensions based on measured text width
   - Blur or Escape finalizes editing
   - Empty text elements are deleted

## TypeScript Configuration

The project uses strict TypeScript mode with:
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

All code must satisfy these constraints. The type checker can be run via `npm run check`.

## Export/Import

[src/lib/utils/export.ts](src/lib/utils/export.ts) provides export functions:

- `exportToPNG()`: Renders elements to off-screen canvas, returns Blob
- `exportToSVG()`: Converts elements to SVG markup
- `exportToJSON()`: Serializes elements and app state to JSON (.excalidraw format)
- `importFromJSON()`: Deserializes .excalidraw files

## Key Files Reference

- [src/lib/components/Canvas.svelte](src/lib/components/Canvas.svelte): Main canvas with event handling
- [src/lib/components/Toolbar.svelte](src/lib/components/Toolbar.svelte): Tool selection and actions
- [src/lib/components/PropertiesPanel.svelte](src/lib/components/PropertiesPanel.svelte): Element property editing
- [src/lib/stores/appState.ts](src/lib/stores/appState.ts): Application state store
- [src/lib/stores/elements.ts](src/lib/stores/elements.ts): Elements store
- [src/lib/engine/elements/types.ts](src/lib/engine/elements/types.ts): Type definitions
- [src/lib/engine/canvas/renderer.ts](src/lib/engine/canvas/renderer.ts): Rough.js rendering logic
- [src/lib/engine/binding/arrows.ts](src/lib/engine/binding/arrows.ts): Arrow binding system
- [src/lib/engine/binding/text.ts](src/lib/engine/binding/text.ts): Text binding system
- [src/lib/engine/history/undoRedo.ts](src/lib/engine/history/undoRedo.ts): Undo/redo implementation
- [src/lib/utils/colorInversion.ts](src/lib/utils/colorInversion.ts): Theme-aware color conversion

## Common Patterns

### Creating a New Element

```typescript
import { createElement } from '../engine/elements/factory';
import { getCanonicalColor } from '$lib/utils/colorInversion';

const canonicalColor = getCanonicalColor(displayColor, $appState.theme);
const element = createElement('rectangle', x, y, width, height, {
  strokeColor: canonicalColor,
  backgroundColor: canonicalBgColor,
  fillStyle: $appState.currentFillStyle,
  strokeWidth: $appState.currentStrokeWidth,
  roughness: $appState.currentRoughness,
});
addElement(element);
history.record($elements);
```

### Updating Element with Bindings

```typescript
// Update element position
updateElement(elementId, { x: newX, y: newY });

// Update all bound arrows
let updatedElements = updateBoundElements($elements, elementId);

// Update bound text
updatedElements = updateBoundTextElements(updatedElements, elementId, ctx);

// Apply updates
elements.set(updatedElements);
```

### Adding Arrow Control Points

Arrows with 2 points are straight lines. Use `addControlPoint()` from [src/lib/engine/arrows/curves.ts](src/lib/engine/arrows/curves.ts) to convert to quadratic Bezier curves (3 points). Always call `updateArrowBoundingBox()` after modifying arrow points.

### Theme-Aware Rendering

When rendering, always convert canonical colors to themed colors:

```typescript
const themedColor = getThemedColor(element.strokeColor, theme);
```

When creating elements, convert display colors to canonical:

```typescript
const canonicalColor = getCanonicalColor($appState.currentStrokeColor, $appState.theme);
```
