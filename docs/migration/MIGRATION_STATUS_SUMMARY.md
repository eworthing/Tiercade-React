# Tiercade React Migration - Current Status

Last updated: 2025-01-17

## Overview

The migration from Swift/tvOS to React/TypeScript is progressing through Phase 1 (web app). This document summarizes what's been completed and what remains.

## ✅ Completed

### Monorepo Infrastructure
- **packages/core** - Pure TypeScript port of TiercadeCore
  - ✅ Models (Item, Items, TierConfig, Project schema)
  - ✅ TierLogic (moveItem, reorderWithin, validation)
  - ✅ RandomUtils (seeded RNG, pickRandomPair)
  - ✅ Sorting (alphabetical, by attribute, custom, with discovery)
  - ✅ QuickRankLogic (assign)
  - ✅ HeadToHead basics (pickPair, pairings, vote, quick phase)
  - ✅ Formatters (text, CSV, Markdown exports with injection protection)
  - ✅ ModelResolver (JSON/CSV import, project validation, size limits)
  - ✅ Analytics (tier distribution, season stats, balance scoring)
  - ✅ Jest tests for all of the above

### Shared State (packages/state)
- ✅ Redux Toolkit store with multiple slices:
  - ✅ tierSlice (tiers, tierOrder, selection, labels, colors, loadProject)
  - ✅ headToHeadSlice (session state, pool, queue, records, phase)
  - ✅ themeSlice (selectedThemeId)
  - ✅ undoRedoSlice (past/future snapshots, max history)
- ✅ Thunks:
  - ✅ headToHeadThunks (startHeadToHead, voteCurrentPair, finishHeadToHead)
  - ✅ projectThunks (loadDefaultProject, loadProjectFromData, importJSON, importCSV)
  - ✅ undoRedoThunks (captureSnapshot, performUndo, performRedo)
- ✅ Typed RootState and AppDispatch
- ✅ Jest tests for slices

### Web App (apps/web)
- ✅ Vite + React 18 + TypeScript scaffold
- ✅ Tailwind CSS configured
- ✅ React Router with pages:
  - ✅ TierBoardPage (with DnD Kit integration)
  - ✅ HeadToHeadPage (start session, vote, apply)
  - ✅ ThemesPage (placeholder)
  - ✅ AnalyticsPage (full analytics dashboard with charts)
  - ✅ ImportExportPage (JSON/CSV/Markdown export, JSON/CSV import)
- ✅ Seeded data (loads default project on mount)
- ✅ Redux integration (Provider, typed hooks)

### React Native App (apps/native)
- ✅ Expo-style RN scaffold
- ✅ React Navigation with 4 screens
- ✅ Redux integration (shared store)
- ✅ TierBoardScreen (displays tier count, loads default project)
- ✅ HeadToHeadScreen (start session, vote, apply - basic UI)
- ✅ ThemesScreen (placeholder)
- ✅ AnalyticsScreen (placeholder)
- ✅ Seeded data (loads default project on mount)

### Shared UI (packages/ui)
- ✅ TierBoard component (web-first)
- ✅ TierRow component
- ✅ DnD Kit integration for drag-and-drop
- ✅ React Testing Library setup
- ✅ Basic tests

### Design Tokens (packages/theme)
- ✅ palette.ts (dark theme colors)
- ✅ metrics.ts (spacing, radius)
- ✅ typography.ts (scale hints)

### Bundled Data
- ✅ defaultProject.json (S/A/B/C/D/F tiers + 7 sample items)
- ✅ Export via packages/core/src/bundled

## 🚧 In Progress / Partial

### HeadToHead Core Logic
- ✅ Basic helpers (pickPair, pairings, vote)
- ✅ Quick phase (quickTierPass with artifacts)
- ✅ Math internals (Wilson bounds, tierMapForCuts, churnFraction, dropCuts, etc.)
- ✅ **Refinement phase** - Full port complete:
  - ✅ refinementPairs (forcedBoundaryPairs, frontierCandidatePairs)
  - ✅ finalizeTiers (makeRefinementComputation, selectRefinedCuts, makeRefinedArtifacts)
  - ✅ initialComparisonQueueWarmStart (boundary pairs, unranked anchors, adjacent pairs, fallback)
  - ✅ assignByCuts, sortTierMembers
  - ✅ Bottom cluster detection and tier cut adjustment

### Undo/Redo
- ✅ undoRedoSlice with past/future stacks
- ✅ Thunks (captureSnapshot, performUndo, performRedo)
- ✅ **Wired into UI** - toolbar buttons + keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
- ✅ Automatic snapshot capture for: moveItem, importJSON/CSV, applyHeadToHead

### Themes
- ✅ themeSlice (selectedThemeId, selectTheme action)
- ✅ **Full theme data model** - TierTheme type, TierColor type
- ✅ **Bundled themes catalog** - 7 themes (Smash Classic, Heatmap Gradient, Pastel, Monochrome, Rainbow, Dark Neon, Nord)
- ✅ **Theme picker UI (web)** - ThemesPage with grid view, theme previews, selection
- ✅ **Theme integration** - TierBoard displays theme colors with left border accent
- ❌ **Theme picker UI (native)** - not yet implemented

### Tests
- ✅ Core logic tests (models, tierLogic, randomUtils, sorting, quickRank, headToHead basics, formatters, modelResolver, analytics)
- ✅ State slice tests (tierSlice, headToHeadSlice, themeSlice)
- ✅ Basic UI tests (TierBoard render)
- ❌ **E2E tests** - Playwright for web, Detox for RN
- ❌ **More comprehensive RTL/RNTL tests**

## ❌ Not Started

### HeadToHead Full Implementation
- Warm-start queue generation (initialComparisonQueueWarmStart)
- Refinement pair suggestions in UI
- Refinement phase UI flow

### React Native UI Components
- RN TierBoard with gestures (no DnD Kit on RN)
- RN item cards with proper styling
- RN theme switcher
- RN analytics charts (react-native-svg or similar)

### tvOS Focus Navigation
- Focus management library (react-tv-space-navigation or RN TV primitives)
- Modal overlay focus containment
- Hardware remote navigation
- Exit/Back button handling
- Accessibility for tvOS

### Additional Features
- Multi-select UI and batch operations
- Tier add/remove/rename UI
- Custom tier colors UI
- Keyboard shortcuts (web)
- Accessibility improvements (ARIA labels, focus management)

### Documentation
- API docs for packages/core
- Component docs for packages/ui
- Migration guide updates
- Testing guide

## Migration Phases

### Phase 1: React Web App ✅ ~95% Complete
**Goal:** Feature parity with Swift app for web platform

**Remaining:**
- E2E tests

### Phase 2: React Native Apps ⚠️ ~30% Complete
**Goal:** iOS, iPadOS, tvOS apps with shared core

**Remaining:**
- RN TierBoard with gestures
- RN analytics with charts
- RN theme picker
- tvOS focus navigation
- Platform-specific polish

### Phase 3: Swift Decommissioning ❌ Not Started
**Goal:** Replace Swift clients with React/RN

**Blockers:**
- Phase 1 and 2 must reach 100% feature parity
- Production testing and validation
- User migration plan

## Key Metrics

| Metric | Value |
|--------|-------|
| Packages created | 5 (core, state, ui, theme, web) |
| TypeScript lines (core) | ~3500 |
| TypeScript lines (state) | ~800 |
| TypeScript lines (UI) | ~400 |
| Jest tests (core) | 15 test suites |
| React components | 10+ |
| Redux slices | 4 |
| Shared thunks | 10+ |
| Import/Export formats | 3 (JSON, CSV, Markdown) |

## Next Priorities

1. **Add E2E tests** - Playwright for web covering import, tier editing, HeadToHead, export, undo/redo, theme selection
2. **Build RN TierBoard** - Implement drag gestures using RN Gesture Handler or simpler move UI
3. **RN Theme Picker** - Port ThemesPage to React Native

## AI/LLM Feature Freeze 🔒

Per migration docs, all AI/LLM features remain frozen during this migration:
- ❌ No AI item generation in React/RN
- ❌ No LLM API calls from TS code
- ❌ No AI UI in new apps
- Swift Apple Intelligence prototype code remains platform-gated and experimental-only

AI features will be re-architected post-migration using the best-performing approach from Swift prototypes.
