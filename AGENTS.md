# Tiercade AI Agent Playbook

<!-- markdownlint-disable -->

<!--
⚠️ WARNING: This is the SOURCE file for AI agent instructions.
Do NOT delete this file - it has two symlinks pointing to it:
- CLAUDE.md → AGENTS.md
- .github/copilot-instructions.md → ../AGENTS.md

To update AI instructions, edit THIS file (AGENTS.md).
Changes will automatically propagate through the symlinks.
-->

A tier list management application built with React, TypeScript, and React Native.

## Quick Reference

- **Web dev:** `cd apps/web && npm run dev`
- **Native dev:** `cd apps/native && npx expo start`
- **Tests:** `cd packages/core && npm test` or `cd apps/web && npx playwright test`
- **Documentation tools:** Use Context7 MCP for React, Redux, Tailwind, Vite, Jest, Playwright docs

## Project Overview

**Tiercade** is a cross-platform tier list creator and manager. Users can:
- Create and manage tier lists with drag-and-drop
- Use Head-to-Head pairwise comparison for ranking
- Import/export tier lists (JSON, CSV, PNG)
- Apply themes and customize tier colors
- View analytics and tier distribution

**Tech Stack:**
- **Web:** React 19 + TypeScript + Vite + Tailwind CSS
- **Mobile:** React Native (Expo 52) + React Navigation
- **State:** Redux Toolkit
- **Testing:** Jest + Playwright (E2E)

## Monorepo Structure

```
Tiercade-React/
├── apps/
│   ├── web/              # React web app (Vite)
│   └── native/           # React Native app (Expo)
├── packages/
│   ├── core/             # Platform-agnostic logic & types
│   ├── state/            # Redux store, slices, selectors
│   ├── ui/               # Shared React components
│   └── theme/            # Design tokens & theme definitions
├── docs/
│   ├── migration/        # Architecture docs
│   └── HeadToHead/       # H2H algorithm documentation
└── package.json          # Workspace root
```

## Package Responsibilities

### `@tiercade/core`
Platform-agnostic business logic. No React dependencies.

**Key exports:**
- `Item`, `Items`, `TierConfig` - Core types
- `moveItem`, `reorderWithin` - Tier manipulation
- `HeadToHeadLogic` - Pairwise comparison algorithm
- `quickRankLogic` - Quick ranking helpers
- `analytics` - Tier distribution calculations
- `modelResolver` - JSON/CSV import parsing

**Testing:** `cd packages/core && npm test`

### `@tiercade/state`
Redux Toolkit store configuration.

**Slices:**
- `tierSlice` - Tier and item state
- `headToHeadSlice` - H2H session state
- `themeSlice` - Theme selection
- `undoRedoSlice` - History management
- `onboardingSlice` - First-run state
- `presentationSlice` - Presentation mode

**Key patterns:**
```typescript
// Use memoized selectors
import { selectAllItems, selectTierById } from '@tiercade/state';

// Dispatch actions
dispatch(tierSlice.actions.moveItem({ itemId, targetTier }));
```

### `@tiercade/ui`
Shared React components for web and native.

**Key components:**
- `TierBoard` - Main tier list grid
- `TierRow` - Individual tier row
- `Modal`, `Toast`, `Button` - Common UI
- `ImageUpload`, `MediaUpload` - File handling

**Platform variants:**
- `*.tsx` - Web implementation
- `*.native.tsx` - React Native implementation

### `@tiercade/theme`
Design tokens and theme configuration.

**Exports:**
- `palette` - Color definitions
- `typography` - Font scales
- `metrics` - Spacing values
- `tierTheme` - Tier-specific colors
- `animations` - Motion constants

## Web App (`apps/web`)

### Development
```bash
cd apps/web
npm run dev     # Start dev server (Vite)
npm run build   # Production build
npm run preview # Preview production build
```

### Testing
```bash
npm test              # Unit tests (Jest)
npx playwright test   # E2E tests
```

### Structure
```
apps/web/src/
├── main.tsx           # Entry point
├── index.css          # Global styles (Tailwind)
├── shell/
│   └── AppShell.tsx   # Main app shell with routing
├── pages/             # Route components
│   ├── TierBoardPage.tsx
│   ├── HeadToHeadPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── ThemesPage.tsx
│   ├── TemplatesPage.tsx
│   └── ImportExportPage.tsx
├── components/        # Page-specific components
├── hooks/             # Custom hooks
└── utils/             # Utilities (export, URL sharing)
```

## React Native App (`apps/native`)

### Development
```bash
cd apps/native
npx expo start         # Start Expo dev server
npx expo run:ios       # Run on iOS simulator
npx expo run:android   # Run on Android emulator
```

### Structure
```
apps/native/src/
├── App.tsx              # Entry with navigation
├── screens/             # Screen components
│   ├── TierBoardScreen.tsx
│   ├── HeadToHeadScreen.tsx
│   ├── ThemesScreen.tsx
│   └── AnalyticsScreen.tsx
├── components/          # Native-specific components
└── hooks/               # Redux hooks
```

## React 19 & TypeScript Best Practices

### Accessibility IDs
Use React 19's `useId` hook for stable, SSR-safe accessibility IDs:
```tsx
// ✅ Correct: useId for accessibility relationships
const id = useId();
const labelId = `${id}-label`;
const descriptionId = `${id}-description`;

// ❌ Wrong: Random IDs cause hydration mismatches
const id = `input-${Math.random()}`;
```

### Memoized Selectors
Use `createSelector` from Redux Toolkit for derived state:
```tsx
import { createSelector } from "@reduxjs/toolkit";

// ✅ Memoized: only recomputes when dependencies change
export const selectTotalItemCount = createSelector(
  [selectAllItems],
  (items) => items.length
);

// ❌ Inline selectors create new functions every render
const count = useAppSelector((state) =>
  Object.values(state.tier.tiers).flat().length
);
```

### Modal Focus Management
Implement proper focus trapping for accessibility:
```tsx
useEffect(() => {
  if (!open) return;
  const focusables = getFocusableElements(contentRef.current);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      // Trap focus within modal
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [open]);
```

### Animation Constants
Use centralized timing from `@tiercade/theme`:
```tsx
import { DURATION, TOAST, EFFECTS } from "@tiercade/theme";

// ✅ Consistent, maintainable
setTimeout(onClose, DURATION.NORMAL);

// ❌ Magic numbers scattered across files
setTimeout(onClose, 200);
```

### Component DisplayNames
Add for React DevTools debugging:
```tsx
export const Modal: React.FC<ModalProps> = ({ ... }) => { ... };
Modal.displayName = "Modal";
```

### Timer Cleanup
Always clean up timeouts/intervals:
```tsx
const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

useEffect(() => {
  return () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
  };
}, []);
```

## Core Data Types

```typescript
// Core item type
interface Item {
  id: string;
  name?: string;
  imageUrl?: string;
  description?: string;
}

// Tier structure: { "S": [...], "A": [...], "unranked": [...] }
type Items = Record<string, Item[]>;

// Tier order (excludes "unranked")
const tierOrder = ["S", "A", "B", "C", "D", "F"];
```

**Invariants:**
- All tier names in `tierOrder` must have entries (even if empty)
- `"unranked"` tier is reserved and must always exist
- `"unranked"` must never appear in `tierOrder`
- Each `Item.id` should be unique across all tiers

## State Management Flow

```
User Action → Component → dispatch(action) → Reducer → New State → Re-render
```

Always use Redux for shared state. Local state (`useState`) is fine for UI-only concerns.

### Immutable Updates
Always return new objects/arrays when updating state:
```typescript
// ✅ Correct
const newTiers = { ...tiers, [tierName]: [...tiers[tierName], newItem] };

// ❌ Wrong - mutates existing state
tiers[tierName].push(newItem);
```

## HeadToHead Algorithm

See `docs/HeadToHead/README.md` for full documentation.

**Quick summary:**
- Wilson score confidence intervals for ranking
- Two-phase: Quick pass + Refinement
- Adaptive comparison budgets based on pool size
- Skip support for difficult comparisons

## Testing Guidelines

### Unit Tests (Jest)
- Test pure functions in `@tiercade/core`
- Test reducers in `@tiercade/state`
- Use `@testing-library/react` for component tests

### E2E Tests (Playwright)
Located in `apps/web/e2e/`:
- `tier-board.spec.ts` - Basic tier operations
- `head-to-head.spec.ts` - H2H flow
- `analytics.spec.ts` - Analytics page
- `themes.spec.ts` - Theme switching
- `import-export.spec.ts` - Import/export

Run with: `cd apps/web && npx playwright test`

## Code Style

### TypeScript
- Strict mode enabled
- Prefer `interface` for object types
- Use `type` for unions/aliases
- Explicit return types on exported functions

### React
- Functional components only
- Custom hooks for reusable logic
- Memoize expensive computations (`useMemo`, `useCallback`)

### Redux
- Use `createSlice` for reducers
- Use `createSelector` for derived state
- Thunks for async operations

### CSS (Web)
- Tailwind CSS for styling
- Use design tokens from `@tiercade/theme`
- Avoid inline styles except for dynamic values

## Accessibility

- All interactive elements must be keyboard accessible
- Use semantic HTML (`button`, `nav`, `main`, etc.)
- Provide `aria-label` for icon-only buttons
- Use `useId()` for stable accessibility IDs
- Test with screen readers

## Common Tasks

### Add a new tier action
1. Add action to `packages/state/src/tierSlice.ts`
2. Add logic to `packages/core/src/tierLogic.ts` if needed
3. Connect in component with `useAppDispatch`

### Add a new page (web)
1. Create component in `apps/web/src/pages/`
2. Add route in `AppShell.tsx`
3. Add navigation link

### Add a new component
1. Create in `packages/ui/src/components/`
2. Export from `packages/ui/src/index.tsx`
3. For platform-specific: create `.tsx` and `.native.tsx` variants

## Commits

Use Conventional Commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructure
- `test:` - Test changes
- `docs:` - Documentation
- `chore:` - Build/tooling

Add scope for clarity: `feat(web): add theme picker modal`
