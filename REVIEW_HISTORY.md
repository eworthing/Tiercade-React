# Review History

## Loop 1 Archive

**Commit:** 5ab6270
**State:** CONTINUE
**Verdict:** Good app, but not top-tier yet

### Scorecard (pre-fix baseline)

| Dimension | Score | Delta |
|---|---|---|
| Architecture quality | 8.5 | SAME |
| State management | 8.5 | SAME |
| Domain modeling | 8.5 | SAME |
| Data flow | 8.5 | SAME |
| Framework practices | 8.5 | SAME |
| Concurrency | 9.5 | SAME |
| Simplicity | 8.5 | SAME |
| Test strategy | 8.5 | SAME |
| Credibility | 8.0 | SAME |

### Findings

| ID | Stable ID | Title | Severity | Status |
|---|---|---|---|---|
| F1 | F-001 | onboardingSlice reducer-body localStorage I/O | Serious deduction | resolved (loop 1) |
| F2 | F-002 | dynamic require() for vote; unused clearDeferredPairs import | Noticeable weakness | resolved (loop 1) |
| F3 | F-003 | Item allows impossible multi-URL combinations | Noticeable weakness | open |

### Loop 1 Fix Summary

- Removed `loadInitialState()`, `STORAGE_KEY`, and all `localStorage.*` calls from `onboardingSlice.ts` reducer bodies. Reducers now pure.
- Extended `createPersistenceMiddleware` to persist `state.onboarding`. Extended `PersistedState` interface with `onboarding?: OnboardingState`.
- Extended `createAppStore` production restore path to rehydrate `onboarding` from `loadPersistedState()`.
- Added persistence test for `completeOnboarding` via fakeStorage seam.
- Replaced `require("@tiercade/core")` with static `import { vote }` at line 5 of `headToHeadThunks.ts`. Removed unused `clearDeferredPairs` import.
- Tests: 238 → 239 (36 suites). All pass.

### Implementation Reviewer

- Verdict: approved (inline — subagent spawn unavailable, loop subagent performed checks)
- Reality: passed
- Honesty: passed
- Regression: passed

---

## Loop 2 Archive (UTC 2026-05-17T09:30:00Z)

**State:** HALT_SUCCESS
**Verdict:** Strong contender

### Scorecard (post-fix)

| Dimension | Score | Delta |
|---|---|---|
| Architecture quality | 9.5 | UP |
| State management | 9.5 | UP |
| Domain modeling | 9.5 | UP |
| Data flow | 9.5 | UP |
| Framework idioms | 9.5 | UP |
| Concurrency | 9.5 | SAME |
| Simplicity | 9.5 | UP |
| Test strategy | 9.5 | UP |
| Credibility | 9.5 | UP |

### Findings

| ID | Stable ID | Title | Severity | Status |
|---|---|---|---|---|
| F1 | F-003 | Item allows impossible multi-URL combinations | Noticeable weakness | resolved (loop 2) |

### Loop 2 Fix Summary

- Removed `imageUrl?`, `videoUrl?`, `audioUrl?`, `mediaType?` from `Item` interface; replaced with `media?: ItemMedia` discriminated union.
- `createItem` factory: 12 lines → 6 lines (direct `item.media = options.media`).
- `getItemMediaType`: 10-line switch/case → 1 line (`return item.media?.type ?? null`).
- `itemHasMedia`: 3 lines → 1 line (`return item.media !== undefined`).
- Updated 12 source reader/writer sites: `TierRow.tsx`, `TierBoard.tsx`, `StreamingOverlay.tsx`, `useItemForm.ts`, `useItemInteraction.ts`, `ItemModal.tsx`, `useExportHandlers.ts`, `urlSharing.ts`, `HeadToHeadPage.tsx`, `modelResolver.ts`, `filtering.ts`, `models.ts`.
- Updated 6 test files to assert on `item.media?.type` / `item.media?.url`.
- Tests: 239/239 pass. Net deletion across 18 files.

### Implementation Reviewer

- Verdict: approved (inline fallback — retry_count: 2, retry_cause: spawn_error)
- Reality: passed — F-003 fields absent from models.ts; `media?: ItemMedia` present
- Honesty: passed — 239/239 tests pass; no assertions on old fields
- Regression: passed — no pre-existing test broke; no new skips

---

## Loop 3 Archive (UTC 2026-05-24T23:20:00Z)

**State:** CONTINUE
**Verdict:** Good app, but not top-tier yet

### Scorecard

| Dimension | Score | Delta |
|---|---|---|
| Architecture quality | 9.0 | DOWN |
| State management | 9.0 | DOWN |
| Domain modeling | 9.5 | SAME |
| Data flow | 9.0 | DOWN |
| Framework idioms | 9.5 | SAME |
| Concurrency | 10 | SAME |
| Simplicity | 9.0 | DOWN |
| Test strategy | 9.5 | SAME |
| Credibility | 9.0 | DOWN |

### Findings

| ID | Stable ID | Title | Severity | Status |
|---|---|---|---|---|
| F1 | F-004 | Bundled theme catalog is duplicated across Redux state and package constants | Noticeable weakness | resolved (loop 3) |

### Loop 3 Fix Summary

- Removed `availableThemes` from `ThemeState`; Redux now stores only `selectedThemeId`.
- Kept `selectAvailableThemes` / `selectCurrentTheme` as public selectors, but they now derive from `@tiercade/theme`.
- Tightened state-package tests so persistence serializes only `{ selectedThemeId }` and selector tests cover bundled theme resolution directly.
- Tests: `test:core` 109/109, `test:state` 64/64, `test:ui` 5/5, `test:hooks` 65/65. All pass.

### Implementation Reviewer

- Verdict: approved (inline reviewer)
- Reality: passed — Redux no longer stores the bundled catalog
- Honesty: passed — selector interface still exposes the current theme/bundled catalog
- Regression: passed — full contest gate stayed green
