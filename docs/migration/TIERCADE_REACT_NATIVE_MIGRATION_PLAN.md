# Tiercade React Native Migration Plan (Phase 2+)

**Status:** Draft  
**Goal:** Replace native SwiftUI clients (iOS/iPadOS/tvOS; optional macOS/Android) with React Native apps built on the shared TypeScript core.  
**Constraint:** All LLM/AI features remain **temporarily disabled** during this phase (see `LLM_FEATURE_FREEZE_PLAN.md`).

---

## High-Level Objectives

1. **Single React-first stack** across web, mobile, and TV, backed by shared `packages/core`, `packages/state`, and `packages/theme`.
2. **Preserve core Tiercade behavior** (tier editing, HeadToHead, analytics, themes, import/export) with parity to the existing Swift app.
3. **Respect platform UX paradigms**, especially tvOS remote navigation and focus.
4. Keep **LLM/AI features frozen**; no FoundationModels or other LLM integration while migration is in progress.

---

## Target Architecture (apps/native)

React Native app structure (to be created under `apps/native/`):

```text
apps/native/
  app/                 # expo-router or React Navigation entry
  src/
    screens/
      TierBoardScreen.tsx
      HeadToHeadScreen.tsx
      ThemesScreen.tsx
      AnalyticsScreen.tsx
    components/        # RN-specific wrappers if needed
    navigation/
      index.tsx        # Stack/tab nav configs
    platform/
      tvos/            # TV-specific helpers (focus, remote)
      ios/             # iOS/iPadOS-specific tweaks
  ios/                 # Managed by Expo / native projects
  android/             # Optional
```

Dependencies:

- Expo (managed workflow).
- React Native ≥ 0.80.
- React Navigation or `expo-router`.
- `@reduxjs/toolkit` + `react-redux`.
- Shared packages:
  - `@tiercade/core` (models + logic).
  - `@tiercade/state` (Redux store + slices).
  - `@tiercade/theme` (design tokens).

---

## Platform-Specific Considerations

### iOS / iPadOS

- Navigation:
  - Use React Navigation stacks/tabs or `expo-router` to approximate SwiftUI navigation flows.
- Input:
  - Touch-first interactions, similar to the web app but adapted to mobile layout.
- Layout:
  - Use responsive layouts and platform-safe hit targets.

### tvOS

tvOS is the most sensitive platform to migrate:

- Focus & navigation:
  - Use a TV focus library (e.g., `react-tv-space-navigation`) or platform-specific RN TV primitives.
  - Rebuild the concept of:
    - Modal overlays with focus containment (HeadToHead, Themes, Analytics).
    - Exit/Back behavior mirroring `.onExitCommand` from SwiftUI.
  - Avoid manual “focus reset loops” per the original AGENTS guidance; instead:
    - Declare default focus targets.
    - Use directional helpers to move focus logically within grids.
- Visuals:
  - Liquid Glass (`glassEffect`) cannot be replicated exactly.
  - Use solid/blurred backgrounds and clear focus outlines that remain legible on TV.
- Accessibility:
  - Ensure VoiceOver/Screen Reader equivalents for TV are respected.
  - Provide accessible labels and clear focus order.

### macOS / Desktop Story

Two main options (to be chosen closer to implementation):

- React Native macOS:
  - Native desktop app sharing most of the RN UI code.
  - Requires additional platform-specific testing and packaging.
- Electron/Tauri or “web-only”:
  - Use the React web app as the primary desktop experience.
  - Optionally wrap in Electron/Tauri for packaged distribution.

For the initial RN migration, focus on **iOS/iPadOS/tvOS**; macOS can be tackled once those are stable.

---

## LLM / AI Features in React Native (Frozen)

During this migration phase:

- **Do not**:
  - Implement FoundationModels or any Apple Intelligence equivalents in React Native.
  - Call external LLM APIs from React Native code.
  - Expose AI-related UI (buttons/menus) in RN screens.
- **Do**:
  - Keep any AI-related Swift code strictly within the existing app, behind flags and debug-only paths.
  - Treat AI as a **future enhancement** after RN parity is reached and stable.

Any future AI/LLM behavior in React Native will be defined in a separate design and implementation plan and will likely favor a backend-centric approach that works across platforms.

---

## Phasing & Rollout Strategy

Order of operations (after web MVP is stable):

1. **Bootstrap RN app:**
   - Initialize Expo project in `apps/native/`.
   - Wire it to `@tiercade/core`, `@tiercade/state`, and `@tiercade/theme`.
   - Implement a basic TierBoard screen with Redux + core logic.
2. **Port core flows:**
   - Tier editing (create, move, delete, undo/redo).
   - Import/export (where platform allows).
   - Themes and analytics.
3. **Port HeadToHead:**
   - Use `@tiercade/core/headToHead` for algorithm.
   - Rebuild overlay UI tuned for touch/remote, with focus containment and Exit handling.
4. **tvOS focus tuning:**
   - Iteratively refine focus behavior using TV hardware/simulator.
   - Validate with remote and accessibility tools.
5. **Staged rollout:**
   - Release RN app(s) to a subset of users/testers.
   - Compare behavior and metrics vs Swift app.
6. **Retirement of Swift apps (later phase):**
   - Only after RN apps show parity and stability.
   - Controlled by product/ops decisions, not automated.

---

## Testing & Validation

Reuse as much of the Phase 1 testing strategy as possible:

- Core logic parity:
  - Already validated in `packages/core`.
- Redux behavior:
  - Already tested in `packages/state`.
- RN-specific tests:
  - Jest + React Native Testing Library for screens/components.
  - Device-level testing for navigation, focus, and interactions.

tvOS-specific:

- Manual sweeps:
  - Use tvOS simulator and hardware where possible.
  - Validate focus trapping in overlays and Exit behavior.
- Automation:
  - If RN tvOS E2E tools are available and stable, add focused scenarios.

---

## Out-of-Scope for RN Migration

Unless explicitly requested, do **not**:

- Introduce new AI/LLM features.
- Reimplement every Apple-specific visual flourish (e.g., exact Liquid Glass behavior).
- Port debug/testing-only overlays that are not part of the core user experience.

Focus on stable, parity-oriented RN replacements for the shipping Swift app, then iterate.

