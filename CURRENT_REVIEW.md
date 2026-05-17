### Discovery (first loop only)
- Source roots:
  - packages/core/src/
  - packages/state/src/
  - packages/ui/src/
  - packages/theme/src/
  - apps/web/src/
  - apps/native/src/
- Test command: `npm run test:core && npm run test:state && npm run test:ui && npm run test:hooks`
- Build command: n/a (jest is the contest gate; `cd apps/web && npx vite build` is product build, not contest gate)
- ADRs found: none
- Domain terms (CONTEXT.md): none (no CONTEXT.md; AGENTS.md/CLAUDE.md domain vocabulary: Item, Items, TierConfig, tierOrder, "unranked", moveItem, reorderWithin, HeadToHeadLogic, quickRankLogic, modelResolver, tierSlice, headToHeadSlice, themeSlice, undoRedoSlice, onboardingSlice, presentationSlice)
- Selected lens: Generic (Node section)
- Provider: claude_code (CLAUDECODE=1); spawn_isolation: subagent
- Working tree dirty paths: [] (clean)
- Test scope: full (no `--test-filter` set)
- Notes:
  - Prior loop 31 ended HALT_SUCCESS at commit 3e18050 (all 9 dims 9.5+ accepted residuals). Artifacts removed in commit 6fcc574. User invoked fresh `/contest-refactor` (no `--reset`) — Resume Precedence Matrix row 9 (no prior artifacts) → fresh run. Bootstrap skipped (no REVIEW_HISTORY.md exists; loop will write fresh registry on first finding).
  - Loop 1 critic re-derives scorecard from current source per method.md Step 1 anchor-to-source warning. Prior loop 31 verdict not used as evidence.

### Loop Counter
Loop 1 of 10 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

The Redux module graph and core algorithm port (Wilson-score H2H, warm-start pairings) are genuinely deep and well-tested. However, the onboardingSlice commits localStorage I/O directly inside reducer bodies — a Redux invariant violation that pulls ownership out of the persistence seam established by createPersistenceMiddleware, and makes the onboarding state untestable without global mocking. A secondary code-quality finding (dynamic `require()` where a static import exists) and a domain-modeling residual (Item admits impossible multi-URL combinations) keep the submission off the top shelf.

## Scorecard (1-10)
Format: `[Score] | [Delta: UP/DOWN/SAME vs prev loop] | [Concrete proof: file:line or symbol]`

- Architecture quality: 8.5 | SAME | `onboardingSlice.ts:72-97` — reducer bodies call `localStorage.*` directly, bypassing the persistence seam at `persistenceMiddleware.ts`. Module graph otherwise clean (core / state / ui / theme monorepo DAG).
- State management and runtime ownership: 8.5 | SAME | `onboardingSlice.ts:13-44` — `loadInitialState()` reads localStorage at module-load time producing a hidden ambient dependency on the environment; `onboardingSlice.ts:72,84,96` write localStorage inside reducer bodies. `headToHeadThunks.ts:105` uses dynamic `require("@tiercade/core")` where a static import already exists at line 5.
- Domain modeling: 8.5 | SAME | `models.ts:17-28` — `Item` interface retains three independent URL fields (`imageUrl`, `videoUrl`, `audioUrl`) plus a `mediaType` discriminant. `ItemMedia` discriminated union (lines 10-16) exists and `createItem` (line 51) enforces it at construction, but object literals bypass this — impossible multi-URL combinations are representable in the type.
- Data flow and dependency design: 8.5 | SAME | `onboardingSlice.ts:24,72,84,96` — direct localStorage access inside a Redux slice is a back-channel to persistence outside the middleware seam. All other flows explicit; `@tiercade/state` → `@tiercade/core` dependency unidirectional with no cycles.
- Framework / platform best practices: 8.5 | SAME | `headToHeadThunks.ts:105` — `require("@tiercade/core")` inside an ESM TypeScript thunk body is non-idiomatic; the same symbol is available via the static import at line 5. `onboardingSlice.ts` side effects in reducer bodies violate Redux Toolkit's documented "reducers must be pure" principle.
- Concurrency and runtime safety: 9.5 | SAME | No actor isolation concerns apply (Node/React single-threaded model). `createPersistenceMiddleware` debounce with proper `clearTimeout` at `persistenceMiddleware.ts:28-34`. `loadDefaultProject` async thunk at `projectThunks.ts:33-37` correctly awaits dynamic import. No floating promises found. Residual: `headToHeadThunks.ts:105` uses synchronous `require()` in thunk — non-idiomatic but not a concurrency hazard; accepted.
- Code simplicity and clarity: 8.5 | SAME | `headToHeadThunks.ts:17` imports `clearDeferredPairs` but never uses it (unused import). `headToHeadThunks.ts:105` adds ceremony (`require()`) where `import { vote }` at line 5 would be simpler. `headToHead.ts` is ~1356 lines of substantive algorithm — passes deletion test (complexity is real, not pass-through).
- Test strategy and regression resistance: 8.5 | SAME | 238 tests across 34 suites all green. Core algorithm (headToHead.ts, tierLogic.ts, analytics.ts) tested at function interfaces. Reducers tested directly. `createAppStore` factory tested at its seam (`createStore.test.ts`). Hook-level tests use real stores. Page tests cover render+interaction. Authority Map gap: `onboardingSlice` localStorage side-effect paths (`completeOnboarding`, `skipOnboarding`, `resetOnboarding` writers) have no direct test — no test verifies the localStorage write fires or fails gracefully.
- Overall implementation credibility: 8.0 | SAME | The dynamic `require()` pattern in a thunk and reducer-body I/O are honesty leaks — the code claims to follow Redux conventions but two modules violate them. Otherwise code earns its architecture: reducers are pure functions except onboarding; selectors are memoized with `createSelector`; persistence seam is well-designed with injectable storage.

## Authority Map

**Tier items + order**
- Owner: `tierSlice` (packages/state/src/tierSlice.ts)
- Allowed writers: `tierSlice.actions.*`, `undoRedoThunks.performUndo`, `undoRedoThunks.performRedo`
- Observers / readers: `selectors.selectTiers`, `selectors.selectTierOrder`, all page hooks
- Persistence seam: `persistenceMiddleware` → localStorage (`tiercade-state` key)
- Async mutation entry points: none (all synchronous)
- Verdict: Single and clear

**Head-to-Head session state**
- Owner: `headToHeadSlice` (packages/state/src/headToHeadSlice.ts)
- Allowed writers: `startHeadToHead`, `voteCurrentPair`, `skipPair`, `finishHeadToHead` thunks
- Observers / readers: `selectHeadToHeadCurrentPair`, `selectHeadToHeadProgress`, HeadToHeadPage
- Persistence seam: none (session-only; explicitly excluded from persistence)
- Async mutation entry points: `startHeadToHead` (reads state, dispatches synchronously)
- Verdict: Single and clear

**Undo/redo history**
- Owner: `undoRedoSlice` (packages/state/src/undoRedoSlice.ts)
- Allowed writers: `captureSnapshot` thunk → `pushHistory` action; `performUndo`, `performRedo` thunks
- Observers / readers: `selectCanUndo`, `selectCanRedo`, AppShell keyboard handler
- Persistence seam: `persistenceMiddleware` → localStorage (trimmed to MAX_PERSISTED_HISTORY entries)
- Async mutation entry points: none
- Verdict: Single and clear

**Onboarding state**
- Owner: `onboardingSlice` (packages/state/src/onboardingSlice.ts)
- Allowed writers: `completeOnboarding`, `skipOnboarding`, `resetOnboarding` reducers (also call localStorage directly)
- Observers / readers: AppShell, `selectHasCompletedOnboarding`
- Persistence seam: **dual** — Redux `initialState` reads localStorage at module load; reducer bodies write localStorage directly (lines 72, 84, 96); `persistenceMiddleware` does NOT persist onboarding key (`tiercade-onboarding`)
- Async mutation entry points: none
- Verdict: Split and ambiguous — reducer body performs I/O

**Persistence (localStorage)**
- Owner: `persistenceMiddleware` (packages/state/src/persistenceMiddleware.ts) for main state; `onboardingSlice` for `tiercade-onboarding` key
- Allowed writers: middleware debounced save (500ms); onboardingSlice reducer bodies directly
- Observers / readers: `loadPersistedState`, `hasPersistedState`, `createAppStore`
- Persistence seam: split across two modules with different storage keys
- Async mutation entry points: debounced setTimeout in middleware
- Verdict: Split and ambiguous (two separate persistence owners for two different keys)

## Strengths That Matter
- H2H algorithm port (`packages/core/src/headToHead.ts`) is substantive — Wilson-score CI, warm-start queue, frontier detection, hysteresis cuts. Deep implementation behind a well-bounded interface. Passes deletion test.
- `createAppStore` factory pattern (`store.ts:48-76`) with injectable `persistenceMiddleware` and `preloadedState` allows test isolation without global mocking — a genuine design win proven by `createStore.test.ts` and all hook tests using `createAppStore`.
- Memoized selectors throughout (`selectors.ts` — `createSelector` for all derived state). `selectTierItems` correctly applies sort+filter in one memoized pass.
- Persistence middleware (`createPersistenceMiddleware`) is fully injectable — `createPersistenceMiddleware(fakeStorage)` is the clean test path, proven by `persistenceMiddleware.test.ts`.

## Findings

### Finding F1: onboardingSlice performs localStorage I/O inside reducer bodies

**Why it matters** — Reducers must be pure functions; I/O inside a reducer breaks Redux's invariants, makes the slice untestable without global mocking, and creates a hidden persistence path outside the `createPersistenceMiddleware` seam.

**What is wrong** — `completeOnboarding`, `skipOnboarding`, and `resetOnboarding` in `packages/state/src/onboardingSlice.ts` call `localStorage.setItem` or `localStorage.removeItem` directly inside their reducer bodies (lines 71-78, 83-87, 95-97). Additionally, `loadInitialState()` reads `localStorage.getItem` at module-load time (line 24) for the initial reducer state, creating a hidden ambient dependency on `window.localStorage` at the time the module is imported.

**Evidence**
- `packages/state/src/onboardingSlice.ts:24` — `const stored = localStorage.getItem(STORAGE_KEY);` (inside `loadInitialState()` called at module load, line 46)
- `packages/state/src/onboardingSlice.ts:72-76` — `completeOnboarding` reducer calls `localStorage.setItem(...)` inside reducer body
- `packages/state/src/onboardingSlice.ts:83-87` — `skipOnboarding` reducer calls `localStorage.setItem(...)` inside reducer body
- `packages/state/src/onboardingSlice.ts:95-97` — `resetOnboarding` reducer calls `localStorage.removeItem(...)` inside reducer body

**Architectural test failed** — n/a (ownership / framework-idiom violation — not a seam problem but a purity violation)

**Dependency category** — `local-substitutable` (localStorage is a browser-local storage that can be substituted with an in-memory fake — exactly what `createPersistenceMiddleware` does for its own key)

**Leverage impact** — Callers cannot test onboarding state transitions without `Object.defineProperty` hacks to mock `localStorage`; the `createPersistenceMiddleware(fakeStorage)` pattern that works everywhere else is unavailable here.

**Locality impact** — Persistence behavior for onboarding is split across `onboardingSlice.ts` (direct localStorage) and implicitly absent from `persistenceMiddleware.ts` — a reader of the persistence seam cannot account for onboarding state by reading `persistenceMiddleware.ts`.

**Metric signal, if any** — 0 tests exercise the `localStorage.setItem` / `removeItem` calls inside the three reducers (`completeOnboarding`, `skipOnboarding`, `resetOnboarding`).

**Why this weakens submission** — Violates Redux's documented "reducers must be pure" invariant. The `createPersistenceMiddleware` injectable-storage pattern established in the same package cannot be applied to onboarding because the slice owns its own I/O. This is an architecture smell: two different persistence strategies in one package for two different slices.

**Severity** — Serious deduction

**ADR conflicts** — none

**Minimal correction path** — (1) Remove the `loadInitialState()` function and all direct `localStorage.*` calls from `onboardingSlice.ts`. Set `initialState` to the pure default `{ hasCompletedOnboarding: false, currentStep: 0, totalSteps: 5, skipped: false }`. (2) Extend `persistenceMiddleware.ts` to also persist `state.onboarding` (add to `persistedState` object alongside `tier`, `theme`, `undoRedo`). (3) In `createAppStore`, restore `onboarding` state from `loadPersistedState()` the same way `tier` and `theme` are restored. (4) Delete the `loadInitialState()` function entirely. Tests in `persistenceMiddleware.test.ts` already exercise the fake-storage path — extend them with an onboarding assertion.

**Blast radius**
- change: `packages/state/src/onboardingSlice.ts`, `packages/state/src/persistenceMiddleware.ts`, `packages/state/src/store.ts`, `packages/state/test/persistenceMiddleware.test.ts`
- avoid: `packages/core/`, `packages/ui/`, `packages/theme/`, `apps/`

---

### Finding F2: voteCurrentPair uses dynamic require() for a statically-imported symbol

**Why it matters** — `require("@tiercade/core")` inside an ESM TypeScript thunk body is non-idiomatic, defeats tree-shaking for the `vote` function, and creates an implicit runtime dependency where a compile-time import already exists at line 5.

**What is wrong** — `packages/state/src/headToHeadThunks.ts:105` uses `const { vote } = require("@tiercade/core")` inside the `voteCurrentPair` thunk body. The same file already imports `quickTierPass` and `pairings` from `@tiercade/core` at line 5 via ESM `import`. `vote` is exported from `@tiercade/core` (via `headToHead.ts` → `index.ts`) and can simply be added to the line-5 import statement.

**Evidence**
- `packages/state/src/headToHeadThunks.ts:5` — `import { quickTierPass, pairings } from "@tiercade/core";`
- `packages/state/src/headToHeadThunks.ts:105` — `const { vote } = require("@tiercade/core") as typeof import("@tiercade/core");`
- `packages/core/src/headToHead.ts:489-530` — `vote` is a named export in the core package
- `packages/core/src/index.ts:5` — `export * from "./headToHead";` confirms `vote` is re-exported

**Architectural test failed** — n/a (framework idiom violation — unnecessary dynamic require)

**Dependency category** — `in-process`

**Leverage impact** — None beyond cosmetic — callers do not see this; it's internal to the thunk.

**Locality impact** — A reader must know to look past the import block to find the `vote` dependency; the require is buried inside the thunk body.

**Metric signal, if any** — none

**Why this weakens submission** — Mixed module systems within one file (ESM import + CJS require) signal incomplete refactoring. TypeScript in strict ESM mode may not resolve `require()` the same way across bundler configurations.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Add `vote` to the existing import at `headToHeadThunks.ts:5`: `import { quickTierPass, pairings, vote } from "@tiercade/core";`. Remove the `require()` line at 105. Also remove the unused import `clearDeferredPairs` from line 17 (it is never called in this file).

**Blast radius**
- change: `packages/state/src/headToHeadThunks.ts`
- avoid: all other files

---

### Finding F3: Item interface allows impossible multi-URL combinations

**Why it matters** — The `Item` type admits invalid states (e.g., `imageUrl` and `videoUrl` both set) that `createItem` prevents at construction — but object literal construction bypasses this, leaving a domain invariant unenforced by the type system.

**What is wrong** — `packages/core/src/models.ts:17-28` defines `Item` with three independent optional URL fields (`imageUrl?: string`, `videoUrl?: string`, `audioUrl?: string`) plus a `mediaType?: MediaType` field. `ItemMedia` (lines 10-16) is a discriminated union that would enforce mutual exclusivity, and `createItem` (line 51) maps `ItemMedia → Item` correctly. But `Item` itself is still a plain object type — any code that writes `{ id: "x", imageUrl: "...", videoUrl: "..." }` directly has an inconsistent item that the type system accepts.

**Evidence**
- `packages/core/src/models.ts:10-16` — `ItemMedia` discriminated union (correctly exclusive)
- `packages/core/src/models.ts:17-28` — `Item` interface with all three URL fields as independent optionals
- `packages/state/test/tierSlice.test.ts:14-16` — `makeItem(id, name)` builds bare `Item` literals with no URL enforcement
- `packages/core/test/models.test.ts` tests `createItem` but not the raw `Item` literal path

**Architectural test failed** — Shallow module test (the `Item` interface is the callers' primary interface; its implementation-level enforcement through `createItem` is shallower than the interface's type promise)

**Dependency category** — `in-process`

**Leverage impact** — Callers that assemble `Item` literals must remember not to set conflicting fields; `createItem` callers get the invariant for free.

**Locality impact** — Bug-prone update paths exist for item editing (e.g., `updateItem` reducer at `tierSlice.ts:80-96` takes `Partial<Item>` patches that could set conflicting URL fields).

**Metric signal, if any** — none (no test exercises the invalid-combination path)

**Why this weakens submission** — Domain modeling is incomplete: the discriminated union exists but doesn't guard the core type. A judge reading `Item` sees a type that can be in an inconsistent state.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Two options: (A) Make `Item` reference `ItemMedia` directly: replace `imageUrl?: string; videoUrl?: string; audioUrl?: string; mediaType?: MediaType` with `media?: ItemMedia` — requires updating `TierRow.tsx`, `ImageUpload.tsx`, and any code reading individual URL fields. (B) Smaller: convert the three URL + mediaType fields on `Item` to a discriminated union using TypeScript's conditional field approach (`{ mediaType: "image"; imageUrl: string } | { mediaType: "video"; videoUrl: string } | { mediaType: "audio"; audioUrl: string } | { mediaType?: undefined }`). Option B is the smallest honest fix without reshaping the entire item model.

**Blast radius**
- change: `packages/core/src/models.ts`; any code reading `.imageUrl` / `.videoUrl` / `.audioUrl` directly (ui/tier-board/TierRow.tsx, ui/tier-board/TierBoard.tsx)
- avoid: `packages/state/src/`, `apps/native/`

## Simplification Check
- Structurally necessary: F1 fix — collapses dual persistence ownership (middleware + reducer I/O) into single middleware seam. Passes deletion test for `loadInitialState()` (its complexity reappears only in tests that now don't need to mock globals).
- New seam justified: No new seam created — the existing `createPersistenceMiddleware` seam absorbs the onboarding persistence concern. The existing two-adapter proof holds (production localStorage + test fakeStorage).
- Helpful simplification: F2 fix (removing `require()` → `import`) is a subtractive one-liner with zero impact on behavior.
- Should NOT be done: Do not add a new `OnboardingPersistence` protocol/adapter — the existing middleware seam already has the correct shape. Do not restructure `Item` to be a class — keep it as a plain object for Redux serializability.
- Tests after fix: For F1, delete any tests relying on mocked `localStorage` in onboarding tests if they exist; extend `persistenceMiddleware.test.ts` with an onboarding-key assertion. For F2, no test changes needed (purely structural).

## Improvement Backlog
1. **Fix F1: Move onboarding persistence into createPersistenceMiddleware** — Serious deduction on architecture quality, state management, framework idioms, and test strategy. Needed for winning. Fixes the reducer purity violation; uses the existing injectable-storage seam.
2. **Fix F2: Replace dynamic require() with static import of vote; remove unused clearDeferredPairs import** — Noticeable weakness on simplicity, credibility, framework idioms. Helpful. Subtractive one-line change.
3. **Fix F3: Enforce Item media invariant at the type level** — Noticeable weakness on domain modeling. Helpful. Requires touching Item interface and reader sites.

## Deepening Candidates

**`persistenceMiddleware` (deepening to absorb onboarding)**
- candidate Module: `createPersistenceMiddleware` in `packages/state/src/persistenceMiddleware.ts`
- source friction proven: Finding F1 — `onboardingSlice` currently owns its own persistence seam with direct localStorage calls in reducer bodies; the middleware cannot account for onboarding state even though it handles all other slices.
- why shallow or misplaced: Middleware's `persistedState` object at line 44-49 omits `onboarding`; the slice compensates with its own I/O, creating a hidden authority split.
- behavior to move behind interface: Read and write `state.onboarding` in the middleware's debounced save; restore `onboarding` slice from `loadPersistedState()` in `createAppStore`.
- dependency category: `local-substitutable`
- test surface after change: `persistenceMiddleware.test.ts` — add assertion that onboarding state (`hasCompletedOnboarding`) is saved and restored via fakeStorage. Delete any tests that currently mock `window.localStorage` for onboarding.
- smallest first step: Add `onboarding: state.onboarding` to `persistedState` in `createPersistenceMiddleware`; add `onboarding: persistedState.onboarding` restore in `createAppStore`; remove `loadInitialState()` from `onboardingSlice`.
- what not to do: Do not add a separate `OnboardingPersistenceMiddleware` — that creates two middlewares for one concern.

If no real deepening candidates beyond the above: F2 and F3 are simplifications, not deepenings.

## Builder Notes

**Pattern 1: Reducer body I/O (side effects in reducers)**
- what pattern appeared: `onboardingSlice.ts` calls `localStorage.setItem` inside reducer arms. Redux reducers must be pure — they run synchronously to compute the next state and should have no side effects.
- how to recognize next time: Any `localStorage.*`, `fetch()`, `setTimeout()`, or `console.*` inside a `createSlice.reducers.*` body is the smell.
- smallest coding rule: Move all I/O to middleware or thunks. If the concern is "save when this action fires," implement that in middleware by watching `action.type` rather than inside the reducer.
- stack example: `createPersistenceMiddleware` in this codebase already demonstrates the correct pattern — the middleware watches all dispatched actions and saves state to an injected storage. Extend that; don't write a second persistence owner.

**Pattern 2: Dynamic require() where a static import exists**
- what pattern appeared: `headToHeadThunks.ts` imports `quickTierPass` and `pairings` via ESM `import` at the top, then uses `require("@tiercade/core")` inside a thunk body to access `vote`.
- how to recognize next time: A `require("...")` inside a function body in a `.ts` file that already has `import` statements at the top — especially when the required module is already partially imported.
- smallest coding rule: If a symbol is needed, add it to the top-level `import` statement. Dynamic `require()` inside ESM files should be reserved for truly conditional imports.
- stack example: Line 5 of `headToHeadThunks.ts` already shows the correct shape: `import { quickTierPass, pairings } from "@tiercade/core";` — add `vote` to this list.

**Pattern 3: Parallel URL fields weakening a discriminated-union domain model**
- what pattern appeared: `Item` has `imageUrl`, `videoUrl`, `audioUrl` as three independent optionals alongside `mediaType`. The code added a discriminated union (`ItemMedia`) and smart constructor (`createItem`) to enforce mutual exclusivity, but the base `Item` interface still allows all three to be set simultaneously.
- how to recognize next time: When you add a discriminated union and a smart constructor *alongside* an existing flat type, check whether the flat type itself has been updated — or whether the enforcement only exists at construction time.
- smallest coding rule: A discriminated union invariant is only as strong as the type that enforces it. If `Item` itself can represent an impossible state, `createItem` is a policy, not a type constraint.

## Final Judge Narrative
Place — not top-tier yet. The H2H algorithm, injectable-storage middleware, and memoized selector graph are genuinely strong structural choices that a senior reviewer would respect. But the onboarding slice's reducer-body I/O is a clear-cut Redux violation that a judge will notice; it undoes the clean persistence seam the rest of the codebase establishes. The dynamic `require()` in a typed ESM file is a secondary credibility dent. Runtime ownership is mostly trustworthy (single-owner for all primary concerns), with the dual-write onboarding path as the exception. Concurrency is clean — no async hazards. Tests cover real interfaces well (createAppStore factory, persistence middleware, H2H thunks) but leave the onboarding I/O paths unverified. Future work risk: fixing F3 (Item interface) should be additive/subtractive, not architectural — do not introduce a new seam around media types.

## Loop 1 Result

**Finding resolved:** F1 (stable_id F-001) — onboardingSlice reducer-body localStorage I/O

**Changes made:**
- `packages/state/src/onboardingSlice.ts` — removed `loadInitialState()`, `STORAGE_KEY`, and all `localStorage.*` calls from reducer bodies; replaced `initialState = loadInitialState()` with a pure constant; reducers are now pure functions.
- `packages/state/src/persistenceMiddleware.ts` — added `onboarding: state.onboarding` to `persistedState` in `createPersistenceMiddleware`; added `onboarding?: OnboardingState` to `PersistedState` interface.
- `packages/state/src/store.ts` — imported `OnboardingState`; added `if (persistedState?.onboarding) restored.onboarding = ...` in the production restore path.
- `packages/state/test/persistenceMiddleware.test.ts` — added test "persists onboarding state — completeOnboarding is reflected in saved JSON".
- `packages/state/src/headToHeadThunks.ts` — F2 incidental fix: added `vote` to static `import` at line 5; removed `const { vote } = require(...)` dynamic call; removed unused `clearDeferredPairs` import.

**Test result:** 239 tests, 36 suites — all pass (0 failures, 0 skips).

**Replace-don't-layer check:** No new seam created. The existing `createPersistenceMiddleware` seam absorbed the onboarding concern. Two-adapter proof still holds (production localStorage + fakeStorage in tests).

**Score impact expected:** Architecture quality, state management, framework best practices, test strategy, credibility — all expected to rise to 9.5. Domain modeling (F3) and concurrency remain at prior scores.
