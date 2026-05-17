### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 21 of 22 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 21: migrated `ItemModal.tsx` add-item construction block (lines 114-135) from direct `Item` literal to `createItem` smart constructor. The primary item creation path now enforces the media mutual exclusivity invariant at call site. domain_modeling 7.0→7.5, simplicity 8.5→9.0, credibility 8.0→8.5. Suite: 28 suites, 197 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action dep-cluster behind Interface; HeadToHeadPage display-only orchestration. Package DAG enforced. TierBoardPage 443 LOC accepted floor. 9-anchor not met: implicit global store pattern.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — one writer per concern across 6 slices; store is implicit global, no process-lifetime pattern. 9-anchor sub-threshold.
- Domain modeling: 7.5 | UP | `apps/web/src/components/ItemModal.tsx:114-135` — direct Item literal replaced with `createItem` call; primary add-item path now enforces media invariant at construction. `packages/core/src/models.ts` — `createItem` + `ItemMedia` union present. Residual: `Item` interface fields remain parallel-optional (backward compat); `updateItem` uses `Partial<Item>` (intentional partial-update pattern). 9-anchor not fully met.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json`. Within-app no module-level DAG enforcement. 9-anchor partial.
- Framework / platform best practices: 7.5 | SAME | `apps/web/src/hooks/` — 12 focused hooks; RTK patterns correct; `useId()` for stable IDs. One carve-out: `useImportHandlers.ts` FileReader has no abort on unmount (undocumented). 9-anchor not fully met.
- Concurrency and runtime safety: 7.5 | SAME | `apps/web/src/components/PWAInstallPrompt.tsx:49` — unguarded `setTimeout` fixed loop 19. `useImportHandlers.ts` FileReader abort gap remains. 9-anchor not met.
- Code simplicity and clarity: 9.0 | UP | Residual Accounting Pass: 9-anchor met — few simplifications remaining; remaining complexity (TierBoardPage 443 LOC) earns its keep under deletion test (modal state coupling is real). No further extraction passes SPT. Framework-constrained residual: modal-state coupling is React architectural constraint, not ceremony.
- Test strategy and regression resistance: 8.0 | SAME | Suite: 28 suites, 197 tests, all green. `createItem` has 8 Interface tests. Page-level test surfaces still missing (named gap). At most one gap remains; 9-anchor not met due to page-level gap.
- Overall implementation credibility: 8.5 | UP | `apps/web/src/components/ItemModal.tsx:114-135` — primary item creation now goes through `createItem` smart constructor. No honesty leaks in add-item path. `updateItem` uses `Partial<Item>` intentionally (partial-update semantics, not a leak). Remaining: `Item` interface backward compat allows direct construction in theory.

## Strengths That Matter
- `packages/core` domain layer framework-free; 12 suites, 102 tests; `createItem` smart constructor + `ItemMedia` discriminated union now the primary item creation path.
- `ItemModal.tsx` add-item path uses `createItem` — media invariant enforced at the primary caller.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace `package.json`: `core←state←apps`; no circular dependencies.
- All simplification candidates exhausted — code simplicity 9.0, residual is modal-state floor (framework-constrained).

## Findings

### Finding #1: `TierBoardPage.tsx` at 443 LOC — god-component at natural modal-coupled floor (F-004)

**Why it matters** — Accepted residual. Remaining handlers all require modal state context — no extraction passes deletion test.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` bundles 7 `useState` modal/UI state declarations (lines 75-82) + 3 inline handlers all closing over modal setters.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC
- `apps/web/src/pages/TierBoardPage.tsx:75-82` — 7 `useState` declarations

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

### Finding #2: Domain model — `Item` interface backward-compat parallel fields (F-014)

**Why it matters** — `createItem` enforces the invariant for new items; `updateItem` uses `Partial<Item>` intentionally (partial-update semantics). The `Item` interface itself retains parallel URL fields for backward compat with persisted data. This is the terminal gap keeping domain_modeling below 9.

**What is wrong** — `packages/core/src/models.ts:22-31` — `Item.imageUrl`, `videoUrl`, `audioUrl`, `mediaType` remain independently optional. Direct construction of `Item` literals (outside `createItem`) is still valid TypeScript, and `updateItem` at `apps/web/src/components/ItemModal.tsx:88-97` uses `Partial<Item>` with explicit field clearing.

**Evidence** —
- `packages/core/src/models.ts:22-31`
- `apps/web/src/components/ItemModal.tsx:88-97` — `Partial<Item>` update path (intentional clearing)

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — No new leverage lost — `updateItem` pattern is correct for partial updates.

**Locality impact** — Terminal: `Item` interface fields can't change without breaking all serialized data.

**Metric signal, if any** — none

**Why this weakens submission** — domain_modeling can't reach 9 without `Item` using `ItemMedia` natively, which requires a migration of all persisted state.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept as terminal residual. Persisted state migration is out of scope.

**Blast radius** — No change needed.

---

## Simplification Check
- Structurally necessary: `ItemModal.tsx` add-item migration — 12-line if/else block replaced with 4-line `createItem` call that enforces the same behavior plus media mutual exclusivity. Deletion test: `createItem` earns its keep (media invariant collapses back to callers without it).
- New seam justified: No new Seam. `createItem` is a pure function.
- Helpful simplification: `ItemModal.tsx` add-item block 4 lines vs 12 — net simplification; behavior preserved; media invariant enforced.
- Should NOT be done: Migrating `updateItem` path to use `createItem` — update semantics require `Partial<Item>`; that path is correct. Do not change the `Item` interface.
- Tests after fix: No new tests needed (indirect coverage: `useItemInteraction.test.ts` exercises the `addItemToUnranked` dispatch path; `createItem` tested at its own Interface in `models.test.ts`). Replace-don't-layer: no shallow tests to delete.

## Improvement Backlog

1. **Accept F-004 and F-014 as terminal residuals** — TierBoardPage 443 LOC (modal-state coupling floor) and Item interface backward compat (persisted data migration out of scope) are the terminal remaining constraints. No further structural fix passes SPT. Cap is loop 22.

## Deepening Candidates

None. All hook extractions complete. `ItemModal.tsx` primary creation path migrated to `createItem`. `Item` interface migration is cross-cutting and out of scope.

## Builder Notes
1. **Pattern** — Partial update vs. smart constructor construction. The `updateItem` path uses `Partial<Item>` and explicitly clears URL fields — this is correct (you want to unset the old media). The `addItem` path should use the smart constructor — you're building a new entity, and the invariant should be enforced at birth. **How to recognize** — Update paths use `Partial<T>`; construction paths should use smart constructors. **Smallest coding rule** — "New entity → smart constructor. Mutation → Partial update."
2. **Pattern** — Residual Accounting: when all simplifications are exhausted and remaining complexity earns its keep, promote `simplicity` from 8.5 to 9.0. The 8.5→9.0 jump doesn't require a new feature — it requires honest accounting of what's left. **How to recognize** — You've deleted stubs, extracted hooks, eliminated the if/else blocks. Nothing passes SPT. That's the 9.0 signal. **Smallest coding rule** — Run Residual Accounting Pass before emitting every terminal scorecard.
3. **Pattern** — `MediaType` union alias exact-matches `ItemMedia["type"]`. No cast needed if both come from the same source type. **How to recognize** — When both types are `"image" | "gif" | "video" | "audio"`, they are structurally equivalent. **Smallest coding rule** — Check if the cast is truly needed or if the types are already identical before adding `as Type`.

## Final Judge Narrative
Good app, place but not win. Loop 21: `ItemModal.tsx` add-item path migrated to `createItem` — domain_modeling 7.0→7.5, simplicity 8.5→9.0 (Residual Accounting), credibility 8.0→8.5. 28 suites, 197 tests green. Terminal constraints: implicit global store, TierBoardPage modal-state floor, Item interface backward compat. Average score ~7.6. Cap is loop 22 — one loop remaining.

## Loop 21 Result

One file changed: `apps/web/src/components/ItemModal.tsx` — added `createItem` to imports; replaced direct Item literal construction block (lines 114-135) with a single `createItem(generateId("item"), { name, seasonString, description, media })` call. Media type passed through as `ItemMedia` discriminated union.

Tests: `npm run test:core && npm run test:state && npm run test:ui && npm run test:hooks` — 28 suites, 197 tests (unchanged), all green. Targeted finding F-014 (domain model direct construction gap): **carried forward** — `Item` interface parallel fields remain for backward compat; `updateItem` path intentionally uses `Partial<Item>`. domain_modeling UP: 7.0→7.5. simplicity UP: 8.5→9.0. credibility UP: 8.0→8.5.
