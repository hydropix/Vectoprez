# Vectoprez

A vector drawing application inspired by Excalidraw, built with SvelteKit, TypeScript, and Rough.js for hand-drawn style graphics.

## Features

- Hand-drawn style vector graphics using Rough.js
- Multiple drawing tools (rectangles, ellipses, arrows, lines, freehand)
- Arrow binding to shapes
- Text editing and binding
- Pan and zoom canvas
- Undo/Redo system
- Element selection and manipulation
- Dark/light theme support
- Local storage persistence
- Export capabilities
- Component library

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
git clone <your-repo-url>
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
│   │   │   ├── arrows/          # Arrow-specific logic
│   │   │   ├── binding/         # Element binding system
│   │   │   ├── collision/       # Collision detection
│   │   │   └── history/         # Undo/Redo system
│   │   ├── stores/              # Svelte stores (state management)
│   │   ├── components/          # Svelte UI components
│   │   ├── utils/               # Utility functions
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
└── README.md                    # This file
```

## Architecture Overview

### Core Concepts

1. **Elements**: Basic building blocks (rectangles, ellipses, arrows, text, freehand)
2. **Canvas Engine**: Handles rendering, pan/zoom, and coordinate transformations
3. **Binding System**: Manages relationships between arrows and shapes
4. **History System**: Implements undo/redo functionality
5. **State Management**: Svelte stores for reactive state

### Key Components

- **Canvas.svelte**: Main drawing surface with event handlers
- **Toolbar.svelte**: Tool selection and actions
- **PropertiesPanel.svelte**: Element property editing
- **Library.svelte**: Reusable component library

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
