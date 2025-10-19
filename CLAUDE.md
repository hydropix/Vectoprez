# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vectoprez is an Excalidraw-inspired vector drawing application built with SvelteKit, TypeScript, and Rough.js. It features hand-drawn style graphics, a parent-child container system, multi-element selection and transformation, text editing, shadow effects, theme-aware color palettes, undo/redo, and export capabilities. The app runs as a web application and optionally as a Tauri desktop app.

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

- `ExcalidrawElement`: Rectangles, ellipses, lines (can act as containers)
- `ArrowElement`: Arrows with start/end arrowheads and control points
- `TextElement`: Text elements with font properties

All elements share a `BaseElement` interface with:
- Position and dimensions (`x`, `y`, `width`, `height`)
- Rotation (`angle` in radians)
- Color indices for stroke and background (theme-independent)
- Style properties (`fillStyle`, `strokeWidth`, `strokeStyle`, `roughness`, `opacity`)
- Shadow properties (`shadowEnabled`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`, `shadowOpacity`)
- Container-related properties (`parentId`, `childrenIds` for containers, `originalBounds`, `isExpanded`)
- `locked` flag to prevent modifications
- `seed` for Rough.js rendering consistency

The factory pattern in [src/lib/engine/elements/factory.ts](src/lib/engine/elements/factory.ts) creates elements with unique IDs and default properties.

### Container System

The app features a parent-child container system ([src/lib/engine/container/](src/lib/engine/container/)):

- Rectangles and ellipses can act as containers for other elements
- Child elements are tracked via `parentId` and `childrenIds` properties
- Automatic hierarchy detection based on overlap percentage (see `OVERLAP_THRESHOLD`)
- Container auto-resize to fit children ([src/lib/engine/container/autoResize.ts](src/lib/engine/container/autoResize.ts))
- Visual feedback with highlight on potential drop ([src/lib/engine/container/feedback.ts](src/lib/engine/container/feedback.ts))
- Children move with their parent container
- Containers can be expanded/collapsed to show/hide children

### Rendering Pipeline

Rendering happens in [src/lib/engine/canvas/renderer.ts](src/lib/engine/canvas/renderer.ts):

1. Canvas context is transformed (translate for pan, scale for zoom)
2. Elements are rendered respecting z-index layering ([src/lib/engine/rendering/layering.ts](src/lib/engine/rendering/layering.ts))
3. Elements are rendered using Rough.js with theme-aware colors from color palette
4. Arrows support straight lines (2 points) or quadratic Bezier curves (3 points)
5. Shadow effects are applied when enabled

The renderer runs in `requestAnimationFrame` loop in [Canvas.svelte](src/lib/components/Canvas.svelte).

### History System

Undo/redo is implemented in [src/lib/engine/history/undoRedo.ts](src/lib/engine/history/undoRedo.ts):

- Uses `structuredClone()` for deep copying element snapshots
- Maintains separate `past` and `future` stacks
- Limited to `MAX_HISTORY` entries (defined in constants.ts)
- New actions clear the future stack
- Call `history.record($elements)` after each modification

### Color Management

The app uses a color index system for theme-aware colors:

- **Storage**: Elements store color indices (numbers), not direct color values
- **Display**: Color indices are resolved to actual colors based on current theme
- [src/lib/utils/colorPalette.ts](src/lib/utils/colorPalette.ts): Defines color palettes (LUT) for light and dark themes
- `getColorFromIndex(index, theme)`: Converts color index to actual color string
- Each theme has its own color lookup table for consistent theming
- Theme switching happens via [src/lib/utils/theme.ts](src/lib/utils/theme.ts)

### Coordinate System

[src/lib/engine/canvas/coordinates.ts](src/lib/engine/canvas/coordinates.ts) handles transformations:

- `screenToWorld()`: Converts mouse coordinates to canvas world coordinates
- Accounts for pan (`scrollX`, `scrollY`) and zoom
- All element positions are in world coordinates
- Mouse events require conversion before collision detection or element creation

### Selection and Transformation

Multi-element selection and transformation system:

- Selection box for multiple elements ([src/lib/engine/selection/selectionBox.ts](src/lib/engine/selection/selectionBox.ts))
- Group bounding box calculation ([src/lib/engine/selection/groupBounds.ts](src/lib/engine/selection/groupBounds.ts))
- Transform handles for resize and rotate ([src/lib/engine/transform/handles.ts](src/lib/engine/transform/handles.ts))
- Geometric transformations applied to groups ([src/lib/engine/transform/geometry.ts](src/lib/engine/transform/geometry.ts))
- Group transformations preserve relative positions ([src/lib/engine/selection/groupTransform.ts](src/lib/engine/selection/groupTransform.ts))

### Main Component Flow

**[Canvas.svelte](src/lib/components/Canvas.svelte)** is the core component:

1. **Mouse Events**:
   - `handleMouseDown`: Detects tool mode, starts drawing/dragging/panning
   - `handleMouseMove`: Updates element dimensions or positions during interaction
   - `handleMouseUp`: Finalizes changes, records history
   - Double-click: Edits text or adds/removes arrow control points

2. **Tools** (see `ToolType` in types.ts):
   - Selection: Select and drag elements, show transform handles
   - Rectangle/Ellipse: Create shapes on mouseDown, resize on mouseMove
   - Arrow/Line: Create with start point, update end point on mouseMove
   - Text: Create element and immediately enter edit mode
   - Draw: Free-hand drawing tool
   - Eraser: Remove elements
   - Hand: Pan the canvas viewport

3. **Arrow and Line Editing**:
   - Selected arrows/lines show handles (start, end, control points)
   - Drag handles to reposition points
   - Arrow handles defined in [src/lib/engine/arrows/handles.ts](src/lib/engine/arrows/handles.ts)
   - Line handles defined in [src/lib/engine/lines/handles.ts](src/lib/engine/lines/handles.ts)

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

**Components:**
- [src/lib/components/Canvas.svelte](src/lib/components/Canvas.svelte): Main canvas with event handling
- [src/lib/components/Toolbar.svelte](src/lib/components/Toolbar.svelte): Tool selection and actions
- [src/lib/components/PropertiesPanel.svelte](src/lib/components/PropertiesPanel.svelte): Element property editing

**State Management:**
- [src/lib/stores/appState.ts](src/lib/stores/appState.ts): Application state store
- [src/lib/stores/elements.ts](src/lib/stores/elements.ts): Elements store
- [src/lib/stores/library.ts](src/lib/stores/library.ts): Library store

**Core Engine:**
- [src/lib/engine/elements/types.ts](src/lib/engine/elements/types.ts): Type definitions
- [src/lib/engine/elements/factory.ts](src/lib/engine/elements/factory.ts): Element creation
- [src/lib/engine/canvas/renderer.ts](src/lib/engine/canvas/renderer.ts): Rough.js rendering logic
- [src/lib/engine/canvas/coordinates.ts](src/lib/engine/canvas/coordinates.ts): Coordinate transformations
- [src/lib/engine/collision/detection.ts](src/lib/engine/collision/detection.ts): Hit detection

**Container System:**
- [src/lib/engine/container/detection.ts](src/lib/engine/container/detection.ts): Container hierarchy detection
- [src/lib/engine/container/transform.ts](src/lib/engine/container/transform.ts): Container transformations
- [src/lib/engine/container/autoResize.ts](src/lib/engine/container/autoResize.ts): Auto-resize logic
- [src/lib/engine/container/hierarchy.ts](src/lib/engine/container/hierarchy.ts): Hierarchy management

**Text & Editing:**
- [src/lib/engine/text/editing.ts](src/lib/engine/text/editing.ts): Text editing logic
- [src/lib/engine/text/transform.ts](src/lib/engine/text/transform.ts): Text transformations

**Selection & Transform:**
- [src/lib/engine/selection/selectionBox.ts](src/lib/engine/selection/selectionBox.ts): Selection box logic
- [src/lib/engine/selection/groupBounds.ts](src/lib/engine/selection/groupBounds.ts): Group bounding box
- [src/lib/engine/transform/handles.ts](src/lib/engine/transform/handles.ts): Transform handles
- [src/lib/engine/transform/geometry.ts](src/lib/engine/transform/geometry.ts): Geometric transforms

**Utilities:**
- [src/lib/utils/colorPalette.ts](src/lib/utils/colorPalette.ts): Color palette and theming
- [src/lib/utils/theme.ts](src/lib/utils/theme.ts): Theme management
- [src/lib/utils/export.ts](src/lib/utils/export.ts): Export/import functions
- [src/lib/engine/history/undoRedo.ts](src/lib/engine/history/undoRedo.ts): Undo/redo implementation

## Common Patterns

### Creating a New Element

```typescript
import { createElement } from '../engine/elements/factory';

const element = createElement('rectangle', x, y, width, height, {
  strokeColorIndex: $appState.currentStrokeColorIndex,
  backgroundColorIndex: $appState.currentBackgroundColorIndex,
  fillStyle: $appState.currentFillStyle,
  strokeWidth: $appState.currentStrokeWidth,
  strokeStyle: $appState.currentStrokeStyle,
  roughness: $appState.currentRoughness,
  opacity: $appState.currentOpacity,
});
addElement(element);
history.record($elements);
```

### Working with Containers

```typescript
import { findPotentialContainer } from '$lib/engine/container/detection';
import { updateContainerHierarchy } from '$lib/engine/container/hierarchy';

// Find container for an element
const container = findPotentialContainer(element, $elements);

// Update hierarchy after moving elements
const updatedElements = updateContainerHierarchy($elements, movedElementId);
elements.set(updatedElements);
```

### Theme-Aware Color Usage

Always use color indices instead of direct color values:

```typescript
import { getColorFromIndex } from '$lib/utils/colorPalette';

// Get actual color from index for rendering
const strokeColor = getColorFromIndex(element.strokeColorIndex, $appState.theme);

// Store color index in element properties
element.strokeColorIndex = COLOR_INDICES.NAVY;
```
