## Tiercade React Web UI Specification (Phase 1)

This document describes the initial React web UI for Tiercade so an LLM can scaffold components and routing with a clear parity target.

The goal is **feature parity with the current SwiftUI app’s core tier management flows**, optimized for mouse/keyboard (and later touch).

---

## Core User Flows

The web MVP must support:

1. **Create a new tier list**
   - Start from an empty project or from a bundled template.
2. **Edit tiers**
   - Rename tiers, change order, add/remove tiers (respecting invariants from TiercadeCore).
3. **Manage items**
   - Add, edit, delete items.
   - Drag items between tiers and into/out of “unranked”.
4. **Undo/redo**
   - History of tier/item operations with multi-step undo/redo.
5. **Head-to-Head ranking**
   - Start H2H from the current board.
   - Vote on pairs, skip, and apply results back to tiers.
6. **Import/export**
   - Import JSON/CSV tier lists.
   - Export JSON/CSV/PNG (PDF via browser print is sufficient).
7. **Themes**
   - Browse bundled themes and apply to the board.
8. **Analytics**
   - View tier distribution charts and basic insights.

Explicitly **out-of-scope** for this phase:

- Any AI/LLM-related features (Apple Intelligence, OpenAI, etc.).
- AI-generated items, AI ranking suggestions, or chat overlays.

Apple Intelligence and Liquid Glass effects are **out-of-scope** for Phase 1 web.

---

## Page & Component Structure

Use a simple SPA structure:

```text
AppShell
 ├─ Toolbar
 └─ Routed content
    ├─ TierBoardPage
    ├─ HeadToHeadPage
    ├─ ThemesPage
    └─ AnalyticsPage
```

### `AppShell`

- Global layout wrapper.
- Hosts:
  - `Toolbar` at the top (new list, import, export, H2H, themes, analytics).
  - `Outlet` / `Routes` region for main content.

### `TierBoardPage`

Central board-like layout:

- `TierBoard` (from `packages/ui`):
  - Renders vertical stack of `TierRow`s.
  - At the bottom, an “Unranked” row.
- `TierRow`:
  - Tier label and color chip (from `packages/theme`).
  - DnD droppable area for `ItemCard`s.
- `ItemCard`:
  - Item name, optional image thumbnail.
  - Handles drag source behavior and click/keyboard focus.

Functional requirements:

- Drag & drop using **DnD Kit**:
  - Drag from unranked → tier.
  - Drag between tiers.
  - Reorder within a tier.
- Keyboard support:
  - Tab between items.
  - Arrow keys move focus; optional keyboard-based move actions (e.g., hotkeys for “move up/down tier”).
- Selection:
  - Support multi-select (e.g., with modifier keys) and batch operations (future phase).

### `HeadToHeadPage`

Modal-like view (but implemented as a page/route for web):

- Two contender cards (left/right).
- Progress indicator (e.g., “12 of 40 comparisons”).
- Phase indicator (Quick vs Refinement).
- Controls:
  - “Pick left”, “Pick right” (buttons + keyboard shortcuts).
  - “Skip” with skip count.
  - “Apply results” to commit back to `TierBoard`.
  - “Cancel” to discard the session.

Behavior:

- Uses state derived from `packages/state/headToHeadSlice`.
- All voting and pair selection uses algorithms from `packages/core/headToHead.ts`.
- Keyboard shortcuts:
  - Arrow left/right or `A`/`L` for voting.
  - `S` for skip.
  - `Enter` for apply.
  - `Esc` for cancel.

### `ThemesPage`

Theme browser:

- Grid/list of themes (palette name, preview).
- Apply theme button.

Behavior:

- Uses tokens from `packages/theme`.
- Applying a theme updates a `themeSlice` in `packages/state`.
- TierBoard adopts the active theme automatically.

### `AnalyticsPage`

Read-only summary of the current board:

- Charts:
  - Bar chart of item counts per tier.
  - Optional additional statistic (e.g., balance score).
- Textual insights:
  - E.g., “Tier S contains 10% of items; consider consolidating.”

Behavior:

- Calculations from `packages/core` (new helpers or reused logic).
- Visualizations can be simple SVG/canvas or a lightweight chart library (keep dependencies minimal).

---

## Toolbar Behavior

The **Toolbar** sits in `AppShell` and exposes core actions:

- New Tier List
- Import
- Export
- Head-to-Head
- Themes
- Analytics

Pattern:

- Buttons dispatch Redux actions and/or navigate:
  - New → clears current project (with confirm dialog if dirty).
  - Import → opens file picker, reads JSON/CSV, dispatches import action.
  - Export → triggers download menu (JSON/CSV/PNG).
  - Head-to-Head → navigates to `/head-to-head`.
  - Themes → navigates to `/themes`.
  - Analytics → navigates to `/analytics`.

Keyboard shortcuts:

- Map a subset of existing Swift shortcuts (e.g. `Cmd+N`, `Cmd+Z`, etc.) using standard browser-safe patterns.

---

## Accessibility & Responsiveness

Accessibility:

- Use semantic HTML elements (`main`, `header`, `nav`, etc.).
- Label controls with `aria-label` or visible text.
- Ensure DnD interactions have keyboard equivalents via DnD Kit’s keyboard sensors.
- Consider screen-reader announcements for item moves and H2H choices.

Responsiveness:

- Desktop-first layout; board should be usable down to tablet widths.
- Use Tailwind + tokens from `packages/theme` for breakpoints and spacing.

---

## Data Flow and State

Flow:

1. React components use selectors/hooks (`useSelector`, `useAppDispatch`).
2. Redux slices delegate operations to `packages/core` functions.
3. UI re-renders based on updated state.

The Swift `AppState` extensions (`AppState+Items`, `AppState+HeadToHead`, etc.) are the conceptual blueprint for how slices should orchestrate core logic.

---

## Out-of-Scope for Phase 1

Exclude these from the initial web UI unless specifically asked to add them:

- Apple Intelligence list generation (FoundationModels).
- tvOS-specific focus chrome and Liquid Glass effects.
- QuickRank as a dedicated overlay (nice-to-have for later).
- Deep macOS-specific behaviors (e.g. menu bar commands).

Focus on delivering a **solid, browser-friendly tier editor + H2H** with import/export and themes.

