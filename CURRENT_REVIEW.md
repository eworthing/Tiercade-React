### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 20 of 22 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 20: added `ItemMedia` discriminated union + `createItem` smart constructor to `packages/core/src/models.ts`. Enforces media mutual exclusivity at construction — eliminates the impossible state where `imageUrl`, `videoUrl`, `audioUrl`, and `mediaType` could all coexist independently. Deleted `validateTiersShape` stub (always returns `true`, never called externally, honesty leak). 8 new interface tests at `createItem` surface. domain_modeling 6.0→7.0 (UP). Suite: 28 suites, 197 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action dep-cluster behind Interface; HeadToHeadPage display-only orchestration. Package DAG enforced. F-004 accepted residual (TierBoardPage 443 LOC floor). 9-anchor not met.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — one writer per concern across 6 slices; store is implicit global, no process-lifetime pattern. 9-anchor sub-threshold.
- Domain modeling: 7.0 | UP | `packages/core/src/models.ts` — `ItemMedia` discriminated union + `createItem` smart constructor enforce media invariant at construction. `validateTiersShape` stub deleted. `Items = Record<string, Item[]>` and `Item` interface still admits some impossible combinations via direct construction (no `ItemMedia` enforcement at the interface level for existing callers). 9-anchor not fully met: `Item` fields remain independently optional for backward compat.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json`. Within-app no module-level DAG enforcement. 9-anchor partial.
- Framework / platform best practices: 7.5 | SAME | `apps/web/src/hooks/` — 12 focused hooks; RTK patterns correct; `useId()` for stable IDs; keyboard shortcut effect co-located with action handlers in hook. No undocumented carve-outs.
- Concurrency and runtime safety: 7.5 | SAME | `apps/web/src/components/PWAInstallPrompt.tsx:49` — unguarded `setTimeout` fixed loop 19. Remaining: `useImportHandlers.ts` FileReader has no abort on unmount (lower-risk: synchronous dispatch). 9-anchor not met.
- Code simplicity and clarity: 8.5 | SAME | `validateTiersShape` stub deleted (honesty leak removed). `createItem` additive and honest. TierBoardPage 443 LOC accepted floor.
- Test strategy and regression resistance: 8.0 | SAME | Suite: 28 suites, 197 tests (8 new at `createItem` Interface), all green. Page-level surfaces still untested. 9-anchor not met.
- Overall implementation credibility: 8.0 | SAME | Deletion test passes across all extracted hooks. Replace-don't-layer satisfied. Domain model honesty improved: smart constructor + discriminated union. `validateTiersShape` stub removal is honest.

## Authority Map
(Re-emitting because domain modeling finding is Priority 1 this loop.)

- **Concern**: Item construction (media invariant)
  - **Owner**: `packages/core/src/models.ts` — `createItem` constructor
  - **Allowed writers**: `createItem` (enforced path), direct `Item` literal (legacy path, still valid)
  - **Readers**: `apps/web/src/components/ItemModal.tsx`, `packages/state/src/tierSlice.ts`
  - **Persistence seam**: `tierSlice.ts` serialize/deserialize via `persistenceMiddleware`
  - **Async mutation entry points**: none (pure construction)
  - **Verdict**: Single and clear (constructor path); Split (legacy direct construction still exists — accepted residual given backward compat requirement)

- **Concern**: Tier item placement (`Items` record)
  - **Owner**: `packages/state/src/tierSlice.ts` — single writer via Redux actions
  - **Allowed writers**: `addItemToUnranked`, `moveItemToTier`, `updateItem`, `deleteItem`, `setTiers`
  - **Readers**: all UI components via `useAppSelector`
  - **Persistence seam**: `persistenceMiddleware`
  - **Async mutation entry points**: none (synchronous Redux dispatch)
  - **Verdict**: Single and clear

## Strengths That Matter
- `packages/core` domain layer framework-free; 12 suites, 102 tests covering pure functions end-to-end (8 new at `createItem` Interface).
- `ItemMedia` discriminated union — media type and URL are co-located; impossible to set `mediaType: "video"` with `imageUrl` via the constructor.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace `package.json`: `core←state←apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage (F-005 resolved loop 8); per-instance timer (F-006 resolved loop 8).
- `undoRedoThunks` — direct test suite covering cross-slice behavior (F-003 resolved loop 7).
- `TierBoardPage.tsx` — reduced from 757 to 443 LOC; 7 focused modules/hooks extracted (loops 9-14).
- `ImportExportPage.tsx` — reduced from 438 to 253 LOC; both import and export handlers extracted (loops 15-16).
- `HeadToHeadPage.tsx` — reduced from 378 to 312 LOC; action handlers + keyboard effect extracted (loop 17).
- 12 custom hooks in `apps/web/src/hooks/`, all tested at Interface level (6 hook test files, 35 tests).
- `PWAInstallPrompt.tsx` — `showTimer` lifecycle gap closed (loop 19).
- `validateTiersShape` honesty-leak stub deleted (loop 20).

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

### Finding #2: Domain model still admits impossible media state via direct `Item` construction (F-014)

**Why it matters** — `createItem` enforces the invariant, but `Item` interface fields remain independently optional; callers using `ItemModal.tsx`-style direct object construction (`const newItem: Item = { id, name }; newItem.imageUrl = ...`) can still produce invalid state.

**What is wrong** — `packages/core/src/models.ts:22-31` — `Item.imageUrl`, `videoUrl`, `audioUrl`, `mediaType` all remain optional and independent in the base interface. The `createItem` constructor path enforces mutual exclusivity; direct object construction does not. `ItemModal.tsx:114-135` still uses the direct construction path.

**Evidence** —
- `packages/core/src/models.ts:22-31` — `Item` interface with parallel optional URL fields
- `apps/web/src/components/ItemModal.tsx:114-135` — direct object construction, not using `createItem`

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Callers that construct `Item` directly still need to manually enforce invariant.

**Locality impact** — Invariant enforcement splits between `createItem` (enforced) and direct construction (not enforced).

**Metric signal, if any** — `ItemModal.tsx:88-97` clears all three URL fields manually — caller-side guard revealing residual type weakness.

**Why this weakens submission** — Constructor exists but is not the only construction path; domain_modeling can't reach 9 until direct construction is guided or removed.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Migrate `ItemModal.tsx` add-item block (lines 113-138) to use `createItem`. Blast radius: `apps/web/src/components/ItemModal.tsx` only. Small fix for next loop.

**Blast radius** — Change: `apps/web/src/components/ItemModal.tsx:113-138`. Avoid: all other files.

---

## Simplification Check
- Structurally necessary: `ItemMedia` discriminated union + `createItem` — caller workaround at `ItemModal.tsx:88-97` (clearing all three URL fields) is evidence the type lacks an invariant. `createItem` enforces exactly one URL field. Deletion test: if `createItem` is deleted, the impossible state is back (media invariant reappears at N callers). Passes deletion test — earns its keep.
- New seam justified: No new Seam. `createItem` is a pure function returning the existing `Item` type; no protocol introduced.
- Helpful simplification: `validateTiersShape` stub deleted — always returned `true`, never called externally; honesty-leak removed cleanly.
- Should NOT be done: Making `Item` fields non-optional or migrating all consumers to `ItemMedia` at once — cross-cutting refactor that would break all existing code. Not in scope for one loop.
- Tests after fix: 8 new tests at `createItem` Interface (`packages/core/test/models.test.ts`). No old tests deleted (replace-don't-layer satisfied — no shallow tests existed for the new interface).

## Improvement Backlog

1. **Migrate `ItemModal.tsx` add-item block to `createItem`** — `apps/web/src/components/ItemModal.tsx:113-138` still uses direct object construction; the only remaining call site that manually enforces the media invariant outside the constructor. Migrating it would close the direct-construction gap for the primary mutation path. `kind: structural`, `rank: helpful`. Score impact: domain_modeling +0.5.

## Deepening Candidates

- **`createItem` constructor adoption** — `ItemModal.tsx:114-135` uses direct object construction. Migrating to `createItem` deepens the interface coverage: all Item construction would go through the enforced path. Dependency category: `in-process`. Test surface: existing `useItemForm` / `useItemInteraction` hook tests already exercise `ItemModal` dispatch paths. Smallest first step: replace the direct construction block in `ItemModal.tsx`. What not to do: do not change the `Item` interface fields — would break all existing serialized data.

## Builder Notes
1. **Pattern** — Discriminated union vs parallel optional fields. Direct: `{ imageUrl?: string; videoUrl?: string; audioUrl?: string; mediaType?: MediaType }` allows all fields simultaneously. **How to recognize** — When you see N url/path/media fields alongside a type discriminator field, they're a candidate for a discriminated union. **Smallest coding rule** — "If a type discriminator tells you which of N fields is active, fold those N fields into a union: `{ type: "video"; url: string }`." **Stack example** — `ItemMedia` in `models.ts`: the `switch` in `createItem` is the proof the original was a manual discriminant.
2. **Pattern** — `validateTiersShape(_tiers) { return true }` stub — function that always returns a constant. **How to recognize** — A doc-comment saying "TypeScript enforces invariants" on a function that does nothing. **Smallest coding rule** — "A validator that always returns `true` is an honesty leak. Either implement it honestly or delete it. 'API compatibility' is not a reason to keep a function that lies."
3. **Pattern** — Smart constructor doesn't close the gap unless it's the only construction path. Adding `createItem` is step 1; migrating the primary caller (`ItemModal.tsx`) to use it is step 2. **How to recognize** — Search for direct object literal construction (`const x: T = { id, name }`) after adding a smart constructor. **Smallest coding rule** — "After adding a smart constructor, grep for direct construction of that type and migrate call sites one loop at a time."

## Final Judge Narrative
Good app, place but not win. Loop 20: domain modeling UP 6.0→7.0 — `ItemMedia` discriminated union + `createItem` smart constructor make the media impossible-state-representable pattern partially enforced at construction; `validateTiersShape` honesty-leak stub deleted. 28 suites, 197 tests green (8 new at `createItem` Interface). Primary remaining gap: `ItemModal.tsx` still uses direct object construction (not `createItem`); migrating that one call site would close the enforcement gap and push domain_modeling toward 7.5. Average score ~7.5.

## Loop 20 Result

Three files changed:
- `packages/core/src/models.ts` — Added `ItemMedia` discriminated union (`{ type: "image"|"gif"|"video"|"audio"; url: string }`) and `createItem(id, options)` smart constructor that enforces exactly one URL field per media type. `Item` interface unchanged for backward compatibility.
- `packages/core/src/tierLogic.ts` — Deleted `validateTiersShape` stub (always returned `true`; never called externally; honesty leak).
- `packages/core/test/models.test.ts` — 8 new tests at `createItem` Interface: media mutual exclusivity for all four media types, minimal item construction, full-options construction, no-media construction.

Tests: `npm run test:core && npm run test:state && npm run test:ui && npm run test:hooks` — 28 suites, 197 tests (up from 189), all green. Targeted finding F-011 domain model anemic: **carried forward** (partially improved — constructor added; direct construction path in `ItemModal.tsx` not yet migrated). domain_modeling UP: 6.0→7.0.
