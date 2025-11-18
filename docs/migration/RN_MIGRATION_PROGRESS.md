# React Native Migration Progress (Phase 2+ Snapshot)

This document tracks the current status of the React Native migration work and the shared TypeScript core it depends on.

## Shared TypeScript Core & State

- `packages/core`:
  - **Models & project schema**: `models.ts`, `project.ts` – ported from `Models.swift` and `TierlistProject.swift`.
  - **Tier logic**: `tierLogic.ts` – `moveItem`, `reorderWithin`, `validateTiersShape` (parity with `TierLogic.swift`).
  - **Random utilities**: `randomUtils.ts` – `createSeededRNG` (Lehmer LCG) and `pickRandomPair`, matching `SeededRNG` and `RandomUtils` behavior.
  - **Sorting**: `sorting.ts` – full port of `Sorting.swift`:
    - `sortItems` for `custom`, `alphabetical`, and `byAttribute` modes.
    - Attribute comparators for string/number/bool/date types (currently number/string used by `Item`).
    - `discoverSortableAttributes` with the same ≥70% threshold semantics as Swift.
  - **QuickRank**: `quickRankLogic.ts` – `assign` wrapper around `moveItem`, mirroring `QuickRankLogic.assign`.
  - **HeadToHead**:
    - Types and basic helpers (`HeadToHeadRecord`, `pickPair`, `pairings`, `vote`) are implemented.
    - Two-phase entry points (`quickTierPass`, `finalizeTiers`) are stubbed with correct types but **do not yet implement** the full quick/refinement behavior.
  - **Not yet ported / incomplete**:
    - Full HeadToHead tiering logic (quick + refinement, warm-start queue).
    - Formatters (`formatters.ts`) and `modelResolver.ts` (import/export and validation).

- `packages/state`:
  - **Tier slice**: `tierSlice.ts` – `tiers`, `tierOrder`, `selection`, plus:
    - `addItemToUnranked`, `moveItemBetweenTiers` (delegates to `@tiercade/core` `moveItem`).
  - **HeadToHead slice**: `headToHeadSlice.ts` – core fields for pool, queues, artifacts, and phase, ready to attach to the completed HeadToHead core.
  - **Theme slice**: `themeSlice.ts` – minimal `selectedThemeId` state to support theme selection in web/RN; to be expanded with full theme metadata.
  - **Store**: `store.ts` – Redux Toolkit `configureStore` wiring `tier`, `headToHead`, and `theme` reducers, exported `RootState` and `AppDispatch`.
  - Additional slices (import/export status, analytics flags, UI prefs) are still **TODO**, to be shaped from Swift `AppState+*.swift`.

All of the above have Jest tests mirroring the Swift `TiercadeCoreTests` and AppState behavior where implemented (`TierLogic`, `RandomUtils`, `Sorting`, `QuickRank`, basic HeadToHead, tier/headToHead slices).

## React Native Scaffold (`apps/native`)

- Expo-style React Native app initialized under `apps/native/`:
  - `package.json`:
    - Depends on `expo`, `react`, `react-native`, `react-native-screens`, `react-native-safe-area-context`.
    - Uses React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`).
    - Reuses shared packages: `@tiercade/core`, `@tiercade/state`, `@tiercade/theme`.
  - `app.json`:
    - Basic Expo config targeting iOS/Android/web; tvOS-specific settings and assets are **not yet configured**.
  - `tsconfig.json`:
    - TS support for React Native, extending the repo base config if present.
  - Entry:
    - `index.js` registers `App` via `expo`'s `registerRootComponent`.
    - `src/App.tsx` wraps the app in:
      - `Provider` from `react-redux` with the shared `store` from `@tiercade/state`.
      - `NavigationContainer` + native stack navigator with a single `TierBoard` screen.
    - `src/screens/TierBoardScreen.tsx`:
      - Placeholder screen showing “Tiercade Native” and a note that it is wired to shared core/state/theme.

## HeadToHead Work Remaining for RN

- **In `packages/core`**:
  - Implement `quickTierPass` and `finalizeTiers` to match `HeadToHead.swift`:
    - Port internal helpers from `HeadToHead+Internals.swift`, `HeadToHead+QuickSupport.swift`, `HeadToHead+RefinementSupport.swift`, and `HeadToHead+WarmStart.swift`.
    - Preserve statistical behavior (Wilson intervals, priors, churn/hysteresis rules, frontier detection).
  - Port and pass tests from:
    - `HeadToHeadLogicTests.swift`.
    - `HeadToHeadInternalsTests.swift`.
  - Ensure deterministic behavior for the same comparison history (critical for cross-platform parity).

- **In `packages/state`**:
  - Extend `headToHeadSlice` to:
    - Track decision history, suggested pairs, refinement progress, and warm-start queues in a way that mirrors `AppState+HeadToHead.swift`.
    - Provide actions to start sessions, vote, skip, apply, cancel, using `@tiercade/core/headToHead` primitives.

- **In `apps/native`**:
  - Add RN screens for HeadToHead and other flows:
    - `HeadToHeadScreen`, `ThemesScreen`, `AnalyticsScreen`, with navigation routes.
  - Implement tvOS-specific focus behavior (later phase):
    - Use RN TV focus primitives or a focus helper library, respecting the AGENTS guidance (no manual “lastFocus” loops; favor modal focus containment and directional helpers).

## Next Steps (High Level)

1. **Complete HeadToHead core port** in `packages/core`, with matching Jest tests.
2. **Fill out Redux state** in `packages/state` for themes, import/export, analytics, and full HeadToHead flows.
3. **Incrementally build RN screens** in `apps/native`, reusing `@tiercade/core`, `@tiercade/state`, and `@tiercade/theme`:
   - Start with tier editing on mobile.
   - Add HeadToHead on mobile.
   - Extend to tvOS with proper focus management.

LLM/AI features remain frozen across all React and React Native codepaths per `LLM_FEATURE_FREEZE_PLAN.md`; no AI/LLM APIs or UI should be introduced during this migration work.
