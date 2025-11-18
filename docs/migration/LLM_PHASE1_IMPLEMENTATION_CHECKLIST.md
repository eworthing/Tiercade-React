## LLM Implementation Checklist – Phase 1 (React Web)

This is a step-by-step checklist for an LLM to begin the Phase 1 React web migration in this repo.

Always cross-reference:

- `docs/migration/TIERCADE_REACT_MIGRATION_PLAN.md`
- `docs/migration/REACT_MONOREPO_ARCHITECTURE.md`
- `docs/migration/TIERCADECORE_TYPESCRIPT_PORTING_GUIDE.md`
- `docs/migration/WEB_APP_UI_SPEC.md`

---

### 0. Orientation (read-only)

- [ ] Skim `TiercadeCore/Sources/TiercadeCore` (Models + Logic).
- [ ] Skim `TiercadeCore/Tests/TiercadeCoreTests` to understand behavioral expectations.
- [ ] Skim `referencedocs/` for data model and import/export specs.
- [ ] Skim `docs/migration/LLM_FEATURE_FREEZE_PLAN.md` to understand AI/LLM constraints.

No code changes in this step.

---

### 1. Scaffold the Monorepo Layout (no behavior yet)

- [ ] Create `apps/web/` and `packages/` directories at the repo root:
  - `packages/core/`
  - `packages/state/`
  - `packages/ui/`
  - `packages/theme/`
- [ ] Add minimal `package.json` files to each package:
  - Name (`"@tiercade/core"`, etc.), version (`"0.0.0"`), `"main"`/`"types"` pointing to `dist/` or `src/`.
  - Mark them as `"private": true` where appropriate.
- [ ] Extend root `package.json` to act as a workspace root (when ready for tooling) without breaking existing Swift/Xcode usage.

> Do not introduce build/test scripts until there is actual code to run.

---

### 2. Port TiercadeCore Models & Logic to `packages/core`

- [ ] Create `packages/core/src/` and `packages/core/test/`.
- [ ] Implement `models.ts` and `project.ts`:
  - Use `typescript-models-example.ts` and `ProjectDataModels.swift` as guides.
  - Ensure all fields from Swift models are represented.
- [ ] Implement `tierLogic.ts`:
  - Port `TierLogic.swift` behavior (move, reorder, normalization).
  - Confirm invariants (e.g., `unranked` behavior) match Swift.
- [ ] Implement `randomUtils.ts`:
  - Port shuffling and pair selection helpers.
  - Ensure RNG is injected, not global.
- [ ] Implement stubs for:
  - `headToHead.ts`
  - `quickRankLogic.ts`
  - `sorting.ts`
  - `formatters.ts`
  - `modelResolver.ts`
  with TODO comments referencing the porting guide.
- [ ] Write Jest tests corresponding to:
  - `TierLogicTests.swift`
  - `RandomUtilsTests.swift`
  - `ModelsTests.swift`
  using deterministic inputs.

---

### 3. Deep HeadToHead Port (core-only)

- [ ] Fully implement `headToHead.ts` following:
  - Swift `HeadToHead.swift` and associated internals.
  - `referencedocs/head_to_head_tiering_architecture.md`.
- [ ] Port tests from:
  - `HeadToHeadLogicTests.swift`
  - `HeadToHeadInternalsTests.swift`
  - Any additional H2H test utilities.
- [ ] Ensure:
  - Identical tier assignments for the same vote histories.
  - Deterministic ordering and cuts.

---

### 4. Wire Redux State in `packages/state`

- [ ] Create `packages/state/src/` and `packages/state/test/`.
- [ ] Implement `store.ts` using Redux Toolkit.
- [ ] Implement `tierSlice.ts`:
  - Represent `tiers`, `tierOrder`, `selection`, and undo/redo.
  - Delegate logic-heavy operations to `packages/core/tierLogic.ts`.
- [ ] Implement `headToHeadSlice.ts` mirroring `AppState+HeadToHead.swift`:
  - Use `packages/core/headToHead.ts` for algorithmic pieces.
- [ ] Implement any necessary `uiPrefsSlice`/`themeSlice` stubs.
- [ ] Add Jest tests that:
  - Exercise common user flows (move item, undo/redo, start/finish H2H).

---

### 5. Scaffold the Web App (`apps/web`)

- [ ] Initialize a minimal React + Vite + TypeScript structure inside `apps/web`:
  - `src/main.tsx` with ReactDOM root.
  - `src/AppShell.tsx` (or equivalent) that wraps routes.
  - `src/pages/` folder with placeholder components:
    - `TierBoardPage.tsx`
    - `HeadToHeadPage.tsx`
    - `ThemesPage.tsx`
    - `AnalyticsPage.tsx`
- [ ] Configure Tailwind and Vite using patterns from Tailwind + Vite docs (Context7 references).
- [ ] Wire `@reduxjs/toolkit` + `react-redux`:
  - Provide `store` from `packages/state`.
  - Implement typed `useAppDispatch`/`useAppSelector` hooks.

LLM/AI note:

- Do not add any AI/LLM-specific routes, buttons, or calls at this stage. The web app should be entirely non-AI for the MVP.

At this stage, UI can be very basic; focus on wiring and data flow.

---

### 6. Implement Tier Board UI (DnD, Keyboard)

- [ ] Implement `TierBoard`, `TierRow`, `ItemCard` in `packages/ui`:
  - Use DnD Kit for drag & drop.
  - Use tokens from `packages/theme` for colors/spacing.
- [ ] Integrate `TierBoard` into `TierBoardPage`:
  - Read tiers from Redux.
  - Dispatch actions for moves and reorder operations.
- [ ] Add keyboard affordances:
  - Basic tab navigation.
  - At least one keyboard-based move mechanic (e.g. a command palette or shortcut).

---

### 7. Implement HeadToHead UI

- [ ] Implement `HeadToHeadOverlay` (or similar) in `packages/ui`.
- [ ] Integrate with `HeadToHeadPage`:
  - Show current pair.
  - Wire vote/skip/apply/cancel actions to Redux.
- [ ] Add keyboard shortcuts for the main actions.
- [ ] Confirm that applying H2H results updates the tier board as expected.

---

### 8. Implement Themes & Analytics (Polish)

- [ ] Implement theme tokens in `packages/theme` and a `themeSlice`.
- [ ] Build `ThemesPage` as a simple library browser + apply action.
- [ ] Build `AnalyticsPage` to show:
  - Tier distribution.
  - A basic “balance” metric.
- [ ] Ensure pages are reachable via Toolbar links and routing.

---

### 9. Import/Export & Round-Trip Validation

- [ ] Complete `formatters.ts` and `modelResolver.ts` based on Swift behavior and `referencedocs/`.
- [ ] Implement import/export flows in the web app:
  - JSON and CSV at minimum.
- [ ] Add tests that:
  - Export from TS → import into TS.
  - Mirror Swift’s behavior as closely as possible.
- [ ] Add manual/automated scripts to test round-trip:
  - Swift export → TS import → TS export → Swift import (can be scripted later).

---

### 10. Hardening & Ready-for-Next-Phase

- [ ] Ensure all new TS/React code has tests where appropriate (unit + a few RTL tests).
- [ ] Add Playwright tests for at least:
  - New list flow.
  - Drag & drop.
  - H2H session.
  - Import/export.
- [ ] Update documentation:
  - Confirm `TIERCADE_REACT_MIGRATION_PLAN.md` remains accurate.
  - Add notes for any deviations that were necessary during implementation.

Once this checklist is fully satisfied and validated, Phase 1 (web) is considered ready, and planning/implementation for the React Native phases can begin. 
