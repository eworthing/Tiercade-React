# React Monorepo Architecture for Tiercade

This document translates the high-level architecture in `TIERCADE_REACT_MIGRATION_PLAN.md` into concrete paths and package boundaries so an LLM (or human) can safely scaffold the React monorepo inside this repository.

The immediate focus is **Phase 1 (web)**. React Native comes later but is accounted for in the structure.

---

## Objectives

- Introduce a **React/TypeScript workspace** alongside the existing Swift codebase.
- Keep **logic, state, and design tokens shared** across web (and later React Native).
- Make dependencies and boundaries explicit so tools can generate code without tangling concerns.

The Swift app remains the primary shipping product during Phase 1; the React workspace is additive until we reach parity and are ready to decommission Swift.

---

## Top-Level Layout (within this repo)

At the root of this repo (next to `Tiercade/`, `TiercadeCore/`, etc.), use this layout:

```text
apps/
  web/              # React web app (Phase 1)
  native/           # React Native app (Phase 2+, initially empty)

packages/
  core/             # TS port of TiercadeCore models + logic
  state/            # Redux Toolkit store + slices
  ui/               # Shared React UI primitives (web-first in Phase 1)
  theme/            # Design tokens (colors, spacing, type scale)
```

> The `tiercade-react/` structure shown in the migration plan maps directly to the above directories in this repo.

The existing `package.json` at repo root becomes the **workspace root**; do not move or delete it. It will be extended to declare `apps/*` and `packages/*` as workspaces when the JS tooling is added.

---

## Package Responsibilities

All React work in this repo should live under `apps/` and `packages/`. Do not mix React code into the `Tiercade/` or `TiercadeCore/` directories.

### `packages/core`

**Purpose:** Pure TypeScript port of `TiercadeCore` (no React).

- Source: `packages/core/src/`
- Tests: `packages/core/test/`

Contents:

- `models.ts` – Port of `Models.swift` and `TierlistProject.swift`:
  - `Item`, `Items`, `TierConfig`, `Project`, `ProjectTier`, `ProjectItem`, `Media`, `Audit`, etc.
  - Types should closely follow `docs/migration/typescript-models-example.ts` and `referencedocs/ProjectDataModels.swift`.
- `tierLogic.ts` – Port of `TierLogic.swift` (move, reorder, normalization, etc.).
- `headToHead.ts` – Port of `HeadToHead.swift` and internals:
  - Use `referencedocs/head_to_head_tiering_architecture.md` as a behavioral spec.
- `quickRankLogic.ts` – Port of `QuickRankLogic.swift`.
- `sorting.ts` – Port of `Sorting.swift`.
- `randomUtils.ts` – Port of `RandomUtils.swift`.
- `formatters.ts` – Port of `Formatters.swift` (CSV/Markdown/text for web; PDF is out-of-scope).
- `modelResolver.ts` – Port of `ModelResolver.swift` and validation rules.

Constraints:

- No DOM/Node APIs.
- Deterministic, pure functions only; no global mutable state.
- RNG must be passed in (`rng: () => number`) where needed.

### `packages/state`

**Purpose:** Shared Redux Toolkit store and slices.

- Source: `packages/state/src/`
- Tests: `packages/state/test/`

Contents:

- `store.ts` – `configureStore` with:
  - `tierSlice` (tier board state),
  - `headToHeadSlice` (session state),
  - `themeSlice`,
  - `importExportSlice` (status, errors).
- `tierSlice.ts` – Selected subset of `AppState`:
  - Mirrors `tiers`, `tierOrder`, `selection`, undo/redo stack, etc.
  - Uses functions from `packages/core` (`tierLogic.ts`, `sorting.ts`, etc.).
- `headToHeadSlice.ts` – H2H state machine:
  - Maps to `AppState+HeadToHead.swift` but uses `packages/core/headToHead.ts` for the algorithm.
- `uiPrefsSlice.ts` (optional) – Layout/theme toggles relevant to the web app.

Constraints:

- No React imports here. This package is reused by both `apps/web` and `apps/native`.
- Side effects (logging, persistence) should be done via middleware or in app layers, not in reducers.

### `packages/theme`

**Purpose:** Shared design tokens.

- Source: `packages/theme/src/`

Contents:

- `palette.ts` – Color tokens based on `Tiercade/Design/DesignTokens.swift` / `Palette`.
- `typography.ts` – Type scale equivalents.
- `metrics.ts` – Spacing, radii, and layout metrics.

These tokens are consumed by `packages/ui` and app-level styling (Tailwind config for web, RN styles for native).

### `packages/ui`

**Purpose:** Shared React UI components. Phase 1 is **web-first**, but keep platform-agnostic patterns where convenient.

- Source: `packages/ui/src/`
- Tests: `packages/ui/test/`

Suggested structure:

- `TierBoard/`
  - `TierBoard.tsx`
  - `TierRow.tsx`
  - `ItemCard.tsx`
- `Overlays/`
  - `HeadToHeadOverlay.tsx`
  - `ThemeLibrary.tsx`
  - `AnalyticsOverlay.tsx`
- `Layout/`
  - `AppShell.tsx`
  - `Toolbar.tsx`

Dependencies:

- React 18.
- `packages/state` for hooks/selectors (via `useSelector`/`useDispatch`).
- `packages/theme` for tokens.
- DnD Kit for drag & drop in the tier board.

> When React Native work begins, either:
> - Share cross-platform pieces from this package (where they are RN-safe), or
> - Create a sibling `packages/native-ui` for RN-specific components.

---

## App Layouts

### `apps/web`

**Purpose:** Browser app (Phase 1).

Suggested structure:

```text
apps/web/
  src/
    main.tsx           # ReactDOM root
    router.tsx         # React Router (or similar) config
    pages/
      TierBoardPage.tsx
      HeadToHeadPage.tsx
      ThemesPage.tsx
      AnalyticsPage.tsx
    hooks/
      useAppDispatch.ts
      useAppSelector.ts
  index.html
  vite.config.ts
  tailwind.config.ts   # uses tokens from packages/theme
```

Key dependencies (aligned with official docs via Context7):

- `react`, `react-dom`
- `@reduxjs/toolkit`, `react-redux`
- `@dnd-kit/core`, `@dnd-kit/sortable`
- `tailwindcss`, `@tailwindcss/vite`
- `typescript`, `vite`
- `jest`, `@testing-library/react`, `@testing-library/jest-dom`
- `playwright` for E2E

### `apps/native` (Phase 2+)

Initially, this directory can contain only a placeholder `README` or scaffold. When migration reaches Phase 2:

- Initialize an **Expo** app here.
- Wire it to the existing `packages/core`, `packages/state`, and `packages/theme`.
- Introduce RN-specific navigation and UI per a dedicated RN migration doc (to be written closer to that phase).

---

## Workspace & Tooling Notes

These are guidelines for the LLM when it first wires up the workspace (do not execute until you actually start the JS work):

- Root `package.json` becomes a workspace root:
  - Add `"workspaces": ["apps/*", "packages/*"]`.
  - Add scripts like `"build:web"`, `"test:web"`, `"lint"`, etc., only when those targets exist.
- Use TypeScript project references or per-package `tsconfig.json` that:
  - Keeps `packages/core` free of DOM types.
  - Shares base compiler options via a root `tsconfig.base.json`.
- Linting & formatting (ESLint/Prettier) can be added later; not required to start the migration.

---

## How This Interacts with Existing Swift Code

- **Do not modify** the Swift sources as part of Phase 1 unless explicitly required for export/import compatibility.
- Treat:
  - `TiercadeCore/Tests` as the behavioral spec for `packages/core`.
  - `referencedocs/` as documentation for models and import/export contracts.
- The web app will be validated by:
  - Ported unit tests in `packages/core`/`packages/state`.
  - Round-trip data tests between Swift and React (see migration plan).

Once the web app reaches parity and is stable, this architecture becomes the foundation for the React Native phases and eventual Swift decommissioning. 

