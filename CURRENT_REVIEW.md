### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 23 of 27 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 23: FileReader abort on unmount + second-call abort in `useImportHandlers.ts`. Adds `useRef<FileReader | null>` and `useEffect` cleanup. Two new abort tests at Interface. concurrency 7.5→8.0 (UP), framework_idioms 7.5→8.0 (UP). 28 suites, 199 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action dep-cluster behind Interface; HeadToHeadPage display-only orchestration. Package DAG enforced. 9-anchor not met: within-app module DAG enforced only by convention; implicit global store.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — one writer per concern across 6 slices; store is implicit global, no process-lifetime pattern. 9-anchor not met.
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` + `apps/web/src/components/ItemModal.tsx:114-135` — createItem smart constructor + ItemMedia discriminated union; primary caller migrated. Residual: `packages/core/src/models.ts:22-31` parallel URL fields (backward compat, framework-constrained, accepted).
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json`. Within-app no module-level DAG enforcement. 9-anchor partial.
- Framework / platform best practices: 8.0 | UP | `apps/web/src/hooks/useImportHandlers.ts:35-38` — useEffect cleanup aborts reader on unmount; `useImportHandlers.ts:42-45` — abort previous reader before starting new one. Idiomatic React lifecycle pattern now applied at this hook. 9-anchor not yet met: remaining carve-outs are minor (no RTK async lifecycle issues).
- Concurrency and runtime safety: 8.0 | UP | `apps/web/src/hooks/useImportHandlers.ts:35-38` — useEffect returns cleanup that calls `readerRef.current?.abort()`; abort fires on unmount. `apps/web/src/hooks/useImportHandlers.ts:42-43` — abort previous reader at top of onImportFile. Two new abort tests at Interface (`useImportHandlers.test.ts` lines 244-316). The 7-anchor gap (lifecycle gap in this hook) is now closed.
- Code simplicity and clarity: 9.5 | SAME | All simplification candidates exhausted. Accepted residual: `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC modal orchestration floor (framework-constrained).
- Test strategy and regression resistance: 8.0 | SAME | 28 suites, 199 tests, all green. Two new tests assert abort on unmount and abort on second call. Page-level test surfaces still missing (TierBoardPage, HeadToHeadPage, AnalyticsPage). 9-anchor not met.
- Overall implementation credibility: 9.5 | SAME | Code earns its architecture; few honesty leaks remain. Accepted residual: `packages/core/src/models.ts:22-31` — Item parallel URL fields backward compat.

## Strengths That Matter
- `packages/core` domain layer framework-free; 12 suites, 102 tests; `createItem` smart constructor with `ItemMedia` discriminated union enforces media invariant at construction.
- `ItemModal.tsx` primary add-item path uses `createItem` — media mutual exclusivity enforced at primary caller.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace `package.json`: `core←state←apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage; per-instance timer.
- `useImportHandlers.ts` — FileReader abort on unmount + abort on second call; lifecycle gap closed.
- 13 custom hooks in `apps/web/src/hooks/`, all tested at Interface level.

## Findings

### Finding #1: FileReader lifecycle gap in `useImportHandlers.ts` — no abort on unmount (F-015)

**Why it matters** — A user can start a file import, navigate away (unmounting the component), and the in-flight FileReader will still fire `onload` after unmount, dispatching state updates to a component that no longer exists. **Resolved this loop.**

**What is wrong** — `apps/web/src/hooks/useImportHandlers.ts` (prior to this loop): FileReader created inside `onImportFile` callback but never stored; no `useEffect` cleanup; no way to abort a pending read on unmount or on second call.

**Evidence** —
- `apps/web/src/hooks/useImportHandlers.ts:19-50` (prior) — reader created inline, no ref, no cleanup
- `apps/web/src/components/PWAInstallPrompt.tsx:49` — precedent: prior lifecycle gap fixed loop 19

**Architectural test failed** — n/a (concurrency / lifecycle category)

**Dependency category** — `in-process`

**Leverage impact** — Hook callers got no lifecycle safety from the hook Interface; each caller would need to know to handle unmount cleanup externally.

**Locality impact** — The abort logic belongs inside the hook; callers should not need to manage FileReader lifecycle.

**Metric signal, if any** — none

**Why this weakens submission** — Unmounted component dispatch is a known React concurrency hazard; lifecycle gap in a tested hook is a credibility issue.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Store reader in `useRef<FileReader | null>`; add `useEffect` returning cleanup that calls `readerRef.current?.abort()`; at start of each `onImportFile` call, abort previous reader before constructing the new one.

**Blast radius** — change: `apps/web/src/hooks/useImportHandlers.ts`, `apps/web/src/hooks/useImportHandlers.test.ts`. avoid: all other files.

---

### Finding #2: `TierBoardPage.tsx` at 443 LOC — god-component at natural modal-coupled floor (F-004)

**Why it matters** — Accepted residual. Framework-constrained floor.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` bundles 7 `useState` modal/UI state declarations (lines 75-82) + 3 inline handlers all closing over modal setters.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC
- `apps/web/src/pages/TierBoardPage.tsx:75-82` — 7 `useState` declarations

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Modal coordination still requires reading 443 LOC.

**Locality impact** — Remaining handlers coupled to modal state; no clean extraction path.

**Metric signal, if any** — 443 LOC vs 95 LOC `ThemesPage.tsx`.

**Why this weakens submission** — Page shell still broad; accepted residual.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept. Already accepted residual.

**Blast radius** — No change needed.

---

### Finding #3: `Item` interface backward-compat parallel URL fields (F-014)

**Why it matters** — Terminal accepted residual. `Item` interface retains parallel URL fields for backward compat with persisted data. `createItem` enforces invariant at construction; direct construction still possible.

**What is wrong** — `packages/core/src/models.ts:22-31` — `Item.imageUrl`, `videoUrl`, `audioUrl`, `mediaType` remain independently optional.

**Evidence** —
- `packages/core/src/models.ts:22-31`

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — No new leverage lost. Primary path enforced.

**Locality impact** — Terminal: changing `Item` interface would break all existing persisted data deserialization.

**Metric signal, if any** — none

**Why this weakens submission** — domain_modeling can't reach 10 without `Item` using `ItemMedia` natively; persisted state migration is cross-cutting.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept as terminal residual.

**Blast radius** — No change needed.

---

## Simplification Check
- Structurally necessary: FileReader abort — passes deletion test: complexity (stale dispatch after unmount) would reappear at every call site if the hook did not own the abort. Deletion test passes for the old inline reader pattern (complexity redistributed to callers).
- New seam justified: false
- Helpful simplification: Single responsibility: all FileReader lifecycle inside the hook.
- Should NOT be done: extracting the abort logic into a separate module — no friction proven at two call sites.
- Tests after fix: Two new tests at the useImportHandlers Interface (abort on unmount, abort on second call). Existing 5 tests updated (mockFileReaderWith now includes abort: jest.fn()). No old tests deleted — the new abort behavior is additive at the Interface.

## Improvement Backlog
1. **Add page-level tests for TierBoardPage** — test_strategy still at 8.0 due to missing page-surface tests. `kind: structural`, `rank: needed for winning`. Score impact: test_strategy 8.0→8.5.

## Deepening Candidates

None new. The FileReader abort deepened the existing `useImportHandlers` Interface by adding lifecycle safety behind the same Interface — callers unchanged.

## Builder Notes
1. **Pattern** — FileReader created inline with no ref = orphaned read. When a React hook creates a stateful external resource (FileReader, WebSocket, EventSource), the resource must be stored in a `useRef` so the `useEffect` cleanup can abort/close it on unmount. **How to recognize** — `const reader = new FileReader()` inside a `useCallback` body with no `useRef`. **Smallest coding rule** — "If you create a reader/socket inside a useCallback, store it in a useRef and abort it in useEffect cleanup."
2. **Pattern** — Abort before start. When the same hook may be called multiple times in rapid succession (fast user), the previous in-flight resource must be aborted before a new one is created. Otherwise both readers fire and the last one wins non-deterministically. **How to recognize** — `readAsText` called without first checking `readerRef.current`. **Smallest coding rule** — "At top of onImportFile: `readerRef.current?.abort()` before `new FileReader()`."
3. **Pattern** — Mock must include abort. When mocking a browser API in Jest, the mock must implement ALL methods the production code calls — not just the happy-path ones. The test suite will fail on cleanup if `abort()` is missing from the mock. **How to recognize** — Tests that work in happy-path but fail on `unmount()` with "is not a function." **Smallest coding rule** — "Add `abort: jest.fn()` to every FileReader mock."

## Final Judge Narrative
Good app, place but not win. Loop 23: concurrency 7.5→8.0, framework_idioms 7.5→8.0. FileReader lifecycle gap closed: abort on unmount + abort on second call; 2 new deterministic Interface tests. 28 suites, 199 tests, all green. Remaining blockers: implicit global store, page-level tests absent, within-app DAG convention-only. Next loop target: page-level tests for TierBoardPage (test_strategy +0.5).

## Loop 23 Result
Two files changed: `apps/web/src/hooks/useImportHandlers.ts` — added `useRef<FileReader | null>` and `useEffect` cleanup that calls `readerRef.current?.abort()` on unmount; added abort of previous reader at top of `onImportFile`. `apps/web/src/hooks/useImportHandlers.test.ts` — added `abort: jest.fn()` to `mockFileReaderWith`; added two new Interface tests: "aborts FileReader when hook unmounts" and "aborts previous FileReader when second import starts before first completes."

Tests: 28 suites, 199 tests (up from 197), all green. Targeted finding F-015 (FileReader lifecycle gap): **resolved** (abort behavior present in current source; tests prove it deterministically). Concurrency UP: 7.5→8.0. Framework_idioms UP: 7.5→8.0. No unintended scorecard regression observed.
