### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 19 of 22 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 19: fixed unguarded `setTimeout` in `PWAInstallPrompt.tsx` — no `clearTimeout` in `useEffect` cleanup meant `setShowPrompt(true)` could fire on an unmounted component. Fix stores timer ID and clears it on unmount. concurrency 7.0→7.5 (lifecycle gap removed). F-004 (TierBoardPage 443 LOC) and F-011 (domain model anemic) remain accepted residuals. Suite: 28 suites, 189 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action dep-cluster behind Interface; HeadToHeadPage display-only orchestration. Package DAG enforced. F-004 accepted residual (TierBoardPage 443 LOC floor). 9-anchor not met.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — one writer per concern across 6 slices; store is implicit global, no process-lifetime pattern. 9-anchor sub-threshold.
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — `Item` interface all-optional fields; `Items = Record<string, Item[]>` anemic. F-011 accepted residual — cross-cutting refactor out of scope. 9-anchor not met.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json`. Within-app no module-level DAG enforcement. 9-anchor partial.
- Framework / platform best practices: 7.5 | SAME | `apps/web/src/hooks/` — 12 focused hooks; RTK patterns correct; `useId()` for stable IDs; keyboard shortcut effect co-located with action handlers in hook. No undocumented carve-outs.
- Concurrency and runtime safety: 7.5 | UP | `apps/web/src/components/PWAInstallPrompt.tsx:49` — unguarded `setTimeout` with no `clearTimeout` in cleanup fixed; timer ID stored in `showTimer`, cleared on unmount. Lifecycle gap removed. Remaining: `useImportHandlers.ts` FileReader has no abort on unmount (lower-risk: synchronous dispatch). 9-anchor not met.
- Code simplicity and clarity: 8.5 | SAME | TierBoardPage 443 LOC accepted floor. `PWAInstallPrompt` fix is 2-line additive, net honest.
- Test strategy and regression resistance: 8.0 | SAME | Suite: 28 suites, 189 tests, all green. Page-level surfaces still untested. `PWAInstallPrompt` untested at Interface — 9-anchor not met.
- Overall implementation credibility: 8.0 | SAME | Deletion test passes across all extracted hooks. Replace-don't-layer satisfied. Both open findings accepted residuals. Fix is honest — addresses real lifecycle gap.

## Strengths That Matter
- `packages/core` domain layer framework-free; 12 suites, 94 tests covering pure functions end-to-end.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace `package.json`: `core←state←apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage (F-005 resolved loop 8); per-instance timer (F-006 resolved loop 8).
- `undoRedoThunks` — direct test suite covering cross-slice behavior (F-003 resolved loop 7).
- `TierBoardPage.tsx` — reduced from 757 to 443 LOC; 7 focused modules/hooks extracted (loops 9-14).
- `ImportExportPage.tsx` — reduced from 438 to 253 LOC; both import and export handlers extracted (loops 15-16).
- `HeadToHeadPage.tsx` — reduced from 378 to 312 LOC; action handlers + keyboard effect extracted (loop 17).
- 12 custom hooks in `apps/web/src/hooks/`, all tested at Interface level (6 hook test files, 35 tests).
- `PWAInstallPrompt.tsx` — `showTimer` lifecycle gap closed (loop 19).

## Findings

### Finding #1: `TierBoardPage.tsx` at 443 LOC — god-component at natural modal-coupled floor (F-004)

**Why it matters** — Accepted residual at 9.5 per loop 18. Remaining handlers all require modal state context.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` bundles 7 `useState` modal/UI state declarations (lines 75-82) + 3 inline handlers all closing over modal setters. No extraction passes deletion test without co-moving state.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC
- `apps/web/src/pages/TierBoardPage.tsx:75-82` — 7 `useState` declarations
- `apps/web/src/pages/TierBoardPage.tsx:140-183` — 3 remaining inline handlers

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Modal coordination still requires reading 443 LOC.

**Locality impact** — Remaining handlers coupled to modal state; no clean extraction path.

**Metric signal, if any** — 443 LOC vs 95 LOC `ThemesPage.tsx`.

**Why this weakens submission** — Page shell still broad; floor is real — accepted residual.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept 443 LOC as natural orchestration floor. Already accepted residual.

**Blast radius** — No change needed.

---

### Finding #2: Domain model anemic — `Item` all-optional fields, no smart constructors (F-011)

**Why it matters** — Accepted residual at 6.0 per loop 18. `Item` all-optional fields; `Items = Record<string, Item[]>` allows invalid tier keys.

**What is wrong** — `packages/core/src/models.ts:6-17` — `Item.id` only non-optional; `name`, `imageUrl`, `description`, `seasonString` all optional. Domain invariants enforced by comments in `CLAUDE.md`, not type system.

**Evidence** —
- `packages/core/src/models.ts:6-17` — `Item` interface definition
- `packages/core/src/models.ts:19` — `Items = Record<string, Item[]>`
- `packages/core/src/tierLogic.ts:1-50` — tier operations assume valid tier names from callers

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Every caller guards undefined fields independently.

**Locality impact** — Domain invariants scattered across reducers and helpers.

**Metric signal, if any** — `?? "Unknown"` patterns in `handleExportJSON` substitute for type weakness.

**Why this weakens submission** — Contest-grade domain modeling requires invariants at construction, not docs. Primary reason domain_modeling stays at 6.0.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Cross-cutting change across 3 packages. Accepted residual.

**Blast radius** — Change: `packages/core/src/models.ts` + all consumers. Avoid touching slices/pages until models stabilize.

---

### Finding #3: `PWAInstallPrompt` unguarded `setTimeout` — lifecycle gap (F-013)

**Why it matters** — `setShowPrompt(true)` could fire on an unmounted component if user navigates away within 2 seconds of `beforeinstallprompt` firing — **resolved this loop**.

**What is wrong** — `apps/web/src/components/PWAInstallPrompt.tsx:49` — `setTimeout(() => setShowPrompt(true), 2000)` with no corresponding `clearTimeout` in the `useEffect` cleanup at line 61-65.

**Evidence** —
- `apps/web/src/components/PWAInstallPrompt.tsx:49` — unguarded timer (pre-fix)
- `apps/web/src/components/PWAInstallPrompt.tsx:61-65` — cleanup removed listeners but not the timer (pre-fix)

**Architectural test failed** — n/a (concurrency/lifecycle safety)

**Dependency category** — `in-process`

**Leverage impact** — None — local component only.

**Locality impact** — Single component; fix is self-contained.

**Metric signal, if any** — none

**Why this weakens submission** — Unguarded timer is a lifecycle hazard in React concurrent mode; sets state on unmounted component.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Store timer ID; call `clearTimeout` in cleanup. **Resolved this loop.**

**Blast radius** — Change: `apps/web/src/components/PWAInstallPrompt.tsx`. Avoid: all other files.

---

## Simplification Check
- Structurally necessary: `PWAInstallPrompt` cleanup — `setTimeout` at line 49 without `clearTimeout` in the `useEffect` return is a React lifecycle gap; fix stores the timer ID and calls `clearTimeout` in the cleanup function. Deletion test: n/a (adding cleanup, not removing a module). Lifecycle safety.
- New seam justified: No new Seam introduced.
- Helpful simplification: Cleanup now explicit; no state mutation after unmount.
- Should NOT be done: Extracting `showTimer` to a ref (`useRef`) — unnecessary for a single-use case within `useEffect` closure; closure binding is honest and simpler.
- Tests after fix: No old tests to delete. Interface-level test for `PWAInstallPrompt` would verify the timer is cleared on unmount — not added this loop (PWAInstallPrompt is a browser-event-driven component; testing it in jsdom requires synthetic `BeforeInstallPromptEvent`, out of scope for a 2-line fix).

## Improvement Backlog

1. **Accept F-004 and F-011 as terminal residuals** — Both previously accepted at loop 18; remain accepted. No new structural extraction passes SPT.
2. **Add `PWAInstallPrompt` lifecycle test** — Verify `clearTimeout` fires on unmount; the fix is honest but untested at Interface. `kind: polish`, `rank: minor`. Not blocking — the fix itself is a 2-line cleanup, not a new seam.

*(Backlog is carried for completeness; Priority 1 for next loop is the only item that could produce structural UP.)*

## Deepening Candidates

None. All hook extractions complete. Domain model anemic change is a cross-cutting refactor — out of scope. `validateTiersShape()` stub in `tierLogic.ts:75-77` always returns `true` — a cosmetic deletion candidate, not a deepening.

## Builder Notes
1. **Pattern** — `useEffect` with a `setTimeout` inside the setup block but no `clearTimeout` in the return. **How to recognize** — `let timerId = setTimeout(...)` or `const timer = setTimeout(...)` inside `useEffect` with no corresponding `clearTimeout(timerId)` in the cleanup. **Smallest coding rule** — "Every `setTimeout` inside `useEffect` must have its ID in the cleanup return." **Stack example** — `PWAInstallPrompt.tsx:49` — timer was unguarded; fix: `let showTimer: ReturnType<typeof setTimeout> | null = null` + `if (showTimer !== null) clearTimeout(showTimer)` in cleanup.
2. **Pattern** — `validateTiersShape(_tiers) { return true }` stub — a function whose body always returns a literal is a dead-code seam. **How to recognize** — Stub with no real logic, doc-comment reads "TypeScript typing enforces most invariants." **Smallest coding rule** — If the function always returns a constant, either delete it or implement it honestly. Stubs that promise validation but deliver nothing are honesty leaks.
3. **Pattern** — 5-selector dep cluster shared across N handlers. **How to recognize** — When 3+ `useCallback` blocks list the same 4+ state selectors in dep arrays, they belong in a single hook. **Smallest coding rule** — "Same 4+ deps in 3+ callbacks = one hook."

## Final Judge Narrative
Good app, place but not win. Loop 19 closes the PWAInstallPrompt lifecycle gap: `showTimer` stored and cleared on unmount; concurrency 7.0→7.5. Both open findings remain accepted residuals. 28 suites, 189 tests green. Average score ~7.4. Remaining sub-9.5 blockers: anemic domain model (F-011), implicit global store, no page-level test surfaces — all require cross-cutting changes beyond run scope.

## Loop 19 Result

One file changed: `apps/web/src/components/PWAInstallPrompt.tsx` — `useEffect` now stores the 2-second `setTimeout` ID in `let showTimer` and calls `clearTimeout(showTimer)` in the cleanup return. Prevents `setShowPrompt(true)` from firing on an unmounted component.

Tests: `npm run test:core && npm run test:state && npm run test:ui && npm run test:hooks` — 28 suites, 189 tests, all green. Targeted finding F-013 (PWAInstallPrompt unguarded setTimeout): **resolved** — cleanup now explicit; no state mutation after unmount. Concurrency UP: 7.0→7.5.
