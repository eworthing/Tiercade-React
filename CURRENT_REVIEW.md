### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 27 of 27 (cap — final)

### System Flag
[STATE: HALT_LOOP_CAP]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 27: Centralized inline selectors in AnalyticsPage, ThemesPage, and ImportExportPage — replaced inline `useAppSelector(state => state.tier.*)` calls and inline `useMemo` with named selectors from `@tiercade/state`. framework_idioms 8.0→8.5 (UP). 34 suites, 227 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action dep-cluster behind Interface; package DAG enforced; within-app module DAG enforced only by convention; implicit global store. 9-anchor not met.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — one writer per concern across 6 slices; store is implicit global, no process-lifetime pattern. 9-anchor not met.
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` + `apps/web/src/components/ItemModal.tsx:114-135` — createItem smart constructor + ItemMedia discriminated union; primary caller migrated. Residual: `packages/core/src/models.ts:22-31` parallel URL fields (backward compat, framework-constrained, accepted).
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json`. Within-app no module-level DAG enforcement. 9-anchor partial.
- Framework / platform best practices: 8.5 | UP | `apps/web/src/pages/AnalyticsPage.tsx:63-64` — `selectTiers`, `selectTierOrder` named selectors replace `state => state.tier.tiers/tierOrder`. `apps/web/src/pages/ThemesPage.tsx:41` — `selectSelectedThemeId` replaces `state => state.theme.selectedThemeId`. `apps/web/src/pages/ImportExportPage.tsx:104-106` — `selectProjectName`, `selectTotalItemCount` replace inline `useMemo(() => Object.values(tiers).flat().length)` and `state => state.tier.projectName`. RTK idiomatic: named centralized selectors per CLAUDE.md.
- Concurrency and runtime safety: 8.0 | SAME | `apps/web/src/hooks/useImportHandlers.ts:35-38` — useEffect cleanup; abort previous reader on second call. Two abort tests at Interface.
- Code simplicity and clarity: 9.5 | SAME | All simplification candidates exhausted. Accepted residual: `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC modal orchestration floor (framework-constrained).
- Test strategy and regression resistance: 9.5 | SAME | All 6 web pages have direct page-level test files. Accepted residual: AppShell routing (thin wrapper; E2E covers integration paths).
- Overall implementation credibility: 9.5 | SAME | Code earns its architecture; few honesty leaks remain. Accepted residual: `packages/core/src/models.ts:22-31` — Item parallel URL fields backward compat.

## Strengths That Matter
- `packages/core` domain layer framework-free; 12 suites, 102 tests; `createItem` smart constructor with `ItemMedia` discriminated union enforces media invariant at construction.
- `ItemModal.tsx` primary add-item path uses `createItem` — media mutual exclusivity enforced at primary caller.
- RTK slice ownership: one clear writer per concern across 6 slices; all derived state uses memoized named selectors from `selectors.ts`; pages now fully centralized (loop 27).
- Monorepo DAG enforced by workspace `package.json`: `core←state←apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage; per-instance timer.
- `useImportHandlers.ts` — FileReader abort on unmount + abort on second call; lifecycle gap closed.
- All 6 web pages have direct page-level test files: `TierBoardPage.test.tsx` (4 tests, loop 24), `HeadToHeadPage.test.tsx` (7 tests, loop 25), `AnalyticsPage.test.tsx` (4 tests, loop 25), `ThemesPage.test.tsx` (3 tests, loop 26), `TemplatesPage.test.tsx` (4 tests, loop 26), `ImportExportPage.test.tsx` (5 tests, loop 26).

## Findings

### Finding #1: Inline selectors in AnalyticsPage, ThemesPage, ImportExportPage bypassing named RTK selectors (F-019)

**Why it matters** — Resolved this loop. Three pages used inline `useAppSelector(state => state.tier.*)` and inline `useMemo` instead of the named, memoized selectors already exported from `@tiercade/state`.

**What is wrong** — `AnalyticsPage.tsx:63-64` used `state => state.tier.tiers` and `state => state.tier.tierOrder` inline. `ThemesPage.tsx:41` used `state => state.theme.selectedThemeId` inline. `ImportExportPage.tsx:108` computed total items via `useMemo(() => Object.values(tiers).flat().length)` instead of `selectTotalItemCount`.

**Evidence** —
- `apps/web/src/pages/AnalyticsPage.tsx:63-64` (pre-loop 27) — inline selectors replaced with `selectTiers`, `selectTierOrder`
- `apps/web/src/pages/ThemesPage.tsx:41` (pre-loop 27) — inline selector replaced with `selectSelectedThemeId`
- `apps/web/src/pages/ImportExportPage.tsx:104-106` (pre-loop 27) — `tiers` var + `useMemo` replaced with `selectProjectName`, `selectTotalItemCount`; `useMemo` import removed

**Architectural test failed** — RTK idiomatic pattern (CLAUDE.md: use `createSelector`-backed named selectors; avoid inline arrow selectors)

**Dependency category** — `in-process`

**Leverage impact** — Inline selectors create new function references per render; named selectors colocate derivation logic in `selectors.ts` (single source of truth).

**Locality impact** — Derivation logic co-located in pages instead of package-level selector module.

**Metric signal, if any** — 3 pages × 1-2 inline selectors; `useMemo` redundant with `selectTotalItemCount`.

**Why this weakens submission** — framework_idioms 8.0 residual: pages bypass centralized selector layer already present in `@tiercade/state`.

**Severity** — Polish (minor)

**ADR conflicts** — none

**Minimal correction path** — Import and use named selectors from `@tiercade/state` in each page.

**Blast radius** — change: `AnalyticsPage.tsx`, `ThemesPage.tsx`, `ImportExportPage.tsx`. avoid: `selectors.ts` (read-only, no changes needed).

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
| field | value |
|---|---|
| structurally_necessary | Named selector imports — passes deletion test: `selectTiers`, `selectTierOrder`, `selectSelectedThemeId`, `selectProjectName`, `selectTotalItemCount` are all defined with memoization in `selectors.ts`; pages are the canonical consumers; inline duplicates were the non-idiomatic copies |
| new_seam_justified | false |
| helpful_simplification | ImportExportPage: removed `tiers` variable entirely (no callers after useMemo removed); removed `useMemo` import; 3 fewer lines of derivation logic per render |
| should_not_be_done | Duplicating selector logic in pages via inline useMemo |
| tests_after_fix | No tests deleted; 34 suites 227 tests all green |

## Improvement Backlog

No backlog items remain within the rubric's reach. The two structural 6.5 dimensions (state_management, data_flow) require process-lifetime ownership or module-level DAG enforcement — both are out of scope for this codebase's architecture without a major refactor.

## Deepening Candidates

None. Loop cap reached.

## Builder Notes
1. **Pattern** — CardView in S2 uses a render-prop pattern (children as factory function). When stubbing for jsdom tests, the mock must call `props.items.map((item) => props.children(item))` to render each card. A simple `{children}` stub will silently render nothing — assertions on individual card test IDs will fail. **How to recognize** — CardView `<CardView items={...}>{(item) => ...}</CardView>` — children is a callback, not a node. **Smallest coding rule** — Stub CardView as: `({ items, children }) => <div>{...items.map(item => children(item))}</div>`.
2. **Pattern** — SearchField and Picker in S2 use `onChange`/`onSelectionChange` (not standard DOM `onChange`). When stubbing, render a native `<input onChange>` and `<select onChange>` that call the S2 callbacks with the value string. **How to recognize** — `<SearchField onChange={(value) => ...}>` — callback receives string not event. **Smallest coding rule** — Stub: `onChange: (e) => props.onChange?.(e.target.value)`.
3. **Pattern** — DialogTrigger isOpen-aware stub must only render dialog children when `isOpen=true`. For ImportExportPage/TemplatesPage the trigger is a hidden span — childArray[0] is the trigger, childArray[1] is the dialog. Use `props.isOpen ? childArray : childArray.slice(0, 1)` to prevent the AlertDialog from appearing before the Reset button is clicked. Same pattern as HeadToHeadPage's DialogTrigger stub.
4. **Pattern** — RTK named selectors in `selectors.ts` are the canonical derivation point. Pages must import from `@tiercade/state`, not inline `state => state.*` or `useMemo`. When a selector already exists in `selectors.ts` and a page uses an inline version, the inline version is always the non-idiomatic copy. **How to recognize** — `useAppSelector((state) => state.tier.*)` or `useMemo(() => Object.values(state.*).flat())` in a page or component. **Smallest coding rule** — Replace with named import from `@tiercade/state`; delete the `useMemo` if it was computing derived state already covered by a selector.

## Final Judge Narrative
Good app, place but not win. Loop 27 (cap): framework_idioms 8.0→8.5 via RTK selector centralization — AnalyticsPage, ThemesPage, ImportExportPage all now use named selectors from `@tiercade/state`; ImportExportPage drops a redundant `useMemo` and the `tiers` intermediate variable. 34 suites, 227 tests, all green. Final average ~8.33 (up from 8.28 at loop start). Hard structural blockers remain: implicit global Redux store (state_management 6.5), within-app DAG convention-only (data_flow 6.5) — both require process-lifetime ownership changes outside loop scope.

## Loop 27 Result
Three source files modified: `apps/web/src/pages/AnalyticsPage.tsx` (inline selectors → `selectTiers`, `selectTierOrder`), `apps/web/src/pages/ThemesPage.tsx` (inline selector → `selectSelectedThemeId`), `apps/web/src/pages/ImportExportPage.tsx` (`tiers` var + `useMemo` → `selectProjectName`, `selectTotalItemCount`; `useMemo` import removed). Finding F-019 resolved. framework_idioms UP: 8.0→8.5. Tests: 34 suites, 227 tests, all green.

## HALT_LOOP_CAP Handoff

**Loop cap reached (27 of 27). Stopping.**

### What improved across the run
- **test_strategy**: 5.0 → 9.5 — page-level tests for all 6 web pages; hook-level tests for useImportHandlers + abort lifecycle; FileReader concurrency gap closed
- **domain_modeling**: 7.0 → 9.5 — `createItem` smart constructor + `ItemMedia` discriminated union; primary caller (ItemModal) migrated
- **simplicity**: 8.0 → 9.5 — modal extraction, selector simplification, dead-code pruning across loops
- **credibility**: 8.0 → 9.5 — code earns architecture; honesty leaks closed loop by loop
- **framework_idioms**: 7.0 → 8.5 — FileReader abort lifecycle, RTK named selector centralization (loop 27)

### What is structurally blocked (next session priorities)
1. **state_management 6.5** — requires explicit process-lifetime store ownership (e.g., store passed via Provider with defined lifetime, not ambient global). No rubric-safe fix in a standard React/RTK single-store app without architectural change.
2. **data_flow 6.5** — requires module-level DAG enforcement within `apps/web/src` (e.g., path aliases enforced by ESLint import plugin, or package extraction). Within-app DAG is convention-only today.
3. **architecture_quality 7.5** — follows from state_management + data_flow; held by the same two structural gaps.

### Recommended next actions (post-loop-cap)
- Add `eslint-plugin-import` with `no-restricted-imports` or `import/no-cycle` rules to enforce within-app DAG at the linter level (data_flow 6.5 → 8.5 path)
- Document Redux store lifetime explicitly — even a comment in `store.ts` naming the process boundary and injection point — or add a `configureStore` factory for testability (state_management 6.5 → 7.5 path)
- Run E2E Playwright tests to verify integration paths (complements the unit + page-level test surface)
