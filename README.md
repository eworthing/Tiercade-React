# Tiercade

<!-- markdownlint-disable MD013 -->

A comprehensive tier list management application built with React and TypeScript.
Create, manage, and analyze tier lists with professional-grade features including
drag-and-drop, head-to-head ranking, and multiple export formats.

![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan.svg)
![Expo](https://img.shields.io/badge/Expo-52-black.svg)

## Features

### Core Tier Management

- **Drag & Drop Interface** - Smooth drag-and-drop powered by dnd-kit
- **Flexible Tier System** - Custom tier names, ordering, and variable tier counts
- **Item Management** - Add, remove, edit, and organize items across tiers
- **Real-time Updates** - Instant visual feedback for all operations

### Advanced Operations

- **HeadToHead Voting** - Binary comparison system for difficult ranking decisions
- **Search & Filter** - Real-time search with highlighting
- **Undo/Redo System** - Comprehensive history management
- **Batch Operations** - Multi-select and bulk move items

### Data Management

- **Auto-save** - Automatic persistence to localStorage
- **Export System** - Multiple format support:
  - JSON (structured data)
  - CSV (spreadsheet compatible)
  - PNG (image export)
- **Import Capabilities** - JSON and CSV import with validation
- **URL Sharing** - Share tier lists via URL

### Analytics & Insights

- **Statistical Analysis** - Tier distribution analysis
- **Visual Charts** - Bar charts showing tier percentages
- **Balance Scoring** - Algorithm evaluating tier distribution

## Tech Stack

- **Web:** React 19 + TypeScript + Vite + Tailwind CSS
- **Mobile:** React Native (Expo 52) + React Navigation
- **State:** Redux Toolkit
- **Testing:** Jest + Playwright (E2E)
- **Drag & Drop:** dnd-kit

## Quick Start

### Web App

```bash
# Install dependencies
npm install

# Start development server
cd apps/web
npm run dev

# Run tests
npm test
npx playwright test
```

### React Native App

```bash
cd apps/native
npx expo start
```

## Project Structure

```
Tiercade-React/
├── apps/
│   ├── web/              # React web app (Vite)
│   └── native/           # React Native app (Expo)
├── packages/
│   ├── core/             # Platform-agnostic logic & types
│   ├── state/            # Redux store, slices, selectors
│   ├── ui/               # Shared React components
│   └── theme/            # Design tokens & themes
└── docs/
    ├── migration/        # Architecture documentation
    └── HeadToHead/       # Algorithm documentation
```

## Packages

### `@tiercade/core`

Platform-agnostic business logic with no React dependencies.

- Core types: `Item`, `Items`, `TierConfig`
- Tier operations: `moveItem`, `reorderWithin`
- HeadToHead algorithm
- Analytics calculations
- Import/export parsing

### `@tiercade/state`

Redux Toolkit store configuration.

- `tierSlice` - Tier and item state
- `headToHeadSlice` - H2H session state
- `themeSlice` - Theme selection
- `undoRedoSlice` - History management

### `@tiercade/ui`

Shared React components.

- `TierBoard` - Main tier list grid
- `TierRow` - Individual tier row
- `Modal`, `Toast`, `Button` - Common UI

### `@tiercade/theme`

Design tokens and theme configuration.

- Color palette
- Typography scales
- Spacing metrics
- Tier colors

## Development

### Requirements

- Node.js 18+
- npm or yarn

### Testing

```bash
# Unit tests
cd packages/core && npm test

# E2E tests
cd apps/web && npx playwright test
```

### Building

```bash
# Build web app
cd apps/web && npm run build

# Build for production
npm run build
```

## Documentation

- **Architecture:** [docs/migration/REACT_MONOREPO_ARCHITECTURE.md](docs/migration/REACT_MONOREPO_ARCHITECTURE.md)
- **HeadToHead Algorithm:** [docs/HeadToHead/README.md](docs/HeadToHead/README.md)
- **AI Agent Instructions:** [AGENTS.md](AGENTS.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

Use conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`

## License

This project is currently unlicensed. Personal project.

---

**Built with React, TypeScript, and modern web development practices.**
