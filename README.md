# Vectoprez

A vector drawing application inspired by Excalidraw, built with SvelteKit, TypeScript, and Rough.js for hand-drawn style graphics.

## Features

- **Hand-drawn style graphics** using Rough.js with customizable roughness
- **Multiple drawing tools**: rectangles, ellipses, arrows, lines, freehand, text, eraser
- **Parent-child container system**: organize elements in hierarchical structures
- **Multi-element selection**: select and transform multiple elements together
- **Transform handles**: resize, rotate, and manipulate elements and groups
- **Shadow effects**: add depth with customizable shadows
- **Theme-aware color palette**: automatic color adaptation for light/dark themes
- **Text editing**: rich text support with font customization
- **Pan and zoom**: navigate large canvases with hand tool
- **Undo/Redo system**: full history management
- **Dark/light theme support**: seamless theme switching
- **Local storage persistence**: auto-save your work
- **Export capabilities**: PNG, SVG, and JSON formats
- **Component library**: reusable element collections

## Tech Stack

- **Frontend Framework**: Svelte 4 + SvelteKit 2
- **Language**: TypeScript (strict mode)
- **Rendering**: HTML Canvas + Rough.js
- **Desktop**: Tauri 2 (optional)
- **Testing**: Vitest + Testing Library
- **Build Tool**: Vite

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- (Optional) Rust for Tauri desktop builds

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/hydropix/Vectoprez.git
cd Vectoprez

# Install dependencies
npm install
```

### Development

```bash
# Start development server (web)
npm run dev

# The app will be available at http://localhost:5173
```

### Building

```bash
# Build for production (web)
npm run build

# Preview production build
npm run preview
```

### Tauri Desktop App (Optional)

```bash
# Development mode
npm run tauri:dev

# Production build
npm run tauri:build
```

## Project Structure

```
Vectoprez/
├── src/
│   ├── lib/
│   │   ├── engine/              # Core rendering and logic
│   │   │   ├── elements/        # Element types and factory
│   │   │   ├── canvas/          # Canvas rendering and coordinates
│   │   │   ├── arrows/          # Arrow-specific logic (handles, curves, bounding box)
│   │   │   ├── lines/           # Line-specific logic
│   │   │   ├── container/       # Parent-child container system
│   │   │   ├── selection/       # Multi-selection and group bounds
│   │   │   ├── transform/       # Transform handles and geometry
│   │   │   ├── text/            # Text editing and transformations
│   │   │   ├── rendering/       # Layering and rendering logic
│   │   │   ├── collision/       # Collision detection
│   │   │   └── history/         # Undo/Redo system
│   │   ├── stores/              # Svelte stores (state management)
│   │   ├── components/          # Svelte UI components
│   │   ├── utils/               # Utility functions (theme, colors, export, etc.)
│   │   └── constants.ts         # Application constants
│   ├── routes/                  # SvelteKit routes
│   │   ├── +page.svelte         # Main application page
│   │   └── +layout.svelte       # Layout component
│   ├── app.html                 # HTML template
│   └── app.css                  # Global styles
├── static/                      # Static assets
├── tests/                       # Unit tests
│   └── unit/                    # Unit test files
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── svelte.config.js             # SvelteKit configuration
├── vite.config.ts               # Vite configuration
├── CLAUDE.md                    # AI assistant guidelines
└── README.md                    # This file
```

## Architecture Overview

### Core Concepts

1. **Elements**: Building blocks with shared `BaseElement` interface
   - Shapes: rectangles, ellipses, lines (can act as containers)
   - Arrows: with customizable arrowheads and control points
   - Text: with font properties and alignment

2. **Container System**: Parent-child hierarchies with automatic detection
   - Elements can contain other elements
   - Automatic hierarchy based on overlap percentage
   - Auto-resize containers to fit children
   - Visual feedback for potential drops

3. **Canvas Engine**: Rendering with Rough.js
   - Pan/zoom viewport transformations
   - Z-index layering system
   - Theme-aware color rendering via color indices
   - Shadow effects support

4. **Selection & Transformation**: Multi-element manipulation
   - Selection box for groups
   - Transform handles (resize, rotate)
   - Group transformations preserve relative positions

5. **Color Management**: Theme-aware color palette system
   - Elements store color indices, not direct colors
   - Lookup tables (LUT) for light/dark themes
   - Seamless theme switching

6. **History System**: Undo/redo with `structuredClone()`
   - Separate past/future stacks
   - Limited history entries (configurable)

7. **State Management**: Svelte stores for reactive state
   - `appState`: viewport, tools, theme, selection
   - `elements`: canvas elements collection
   - `library`: reusable component library

### Key Components

- **Canvas.svelte**: Main drawing surface with event handlers and rendering loop
- **Toolbar.svelte**: Tool selection and canvas actions
- **PropertiesPanel.svelte**: Element property editing (colors, styles, shadows)
- **Library.svelte**: Reusable component library management

## Available Scripts

- `npm run dev` - Start development server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type-check without building
- `npm run check:watch` - Type-check in watch mode
- `npm run tauri` - Tauri CLI commands
- `npm run tauri:dev` - Start Tauri development mode
- `npm run tauri:build` - Build Tauri desktop application

## Development Guidelines

- **TypeScript**: Strict mode enabled, all types must be explicit
- **Code Quality**: No unused variables, parameters, or implicit returns
- **Testing**: Write tests for core functionality
- **Modular Design**: Keep components and utilities focused and reusable

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Inspired by [Excalidraw](https://excalidraw.com/)
- Built with [Rough.js](https://roughjs.com/) for hand-drawn aesthetics
- Powered by [SvelteKit](https://kit.svelte.dev/)
