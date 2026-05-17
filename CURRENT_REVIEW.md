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

### Loop Counter
Loop 2 of 10 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Strong contender

Post-loop-2: the three structural findings that weakened the submission are resolved. The Redux module graph is fully clean. `onboardingSlice` is now a pure reducer with persistence via the injectable `createPersistenceMiddleware` seam. The `Item` domain type now carries exactly one `media?: ItemMedia` field — a discriminated union that makes the previously-possible multi-URL combinations unrepresentable at the type level. The remaining sub-9.5 scoring on domain modeling is resolved by the F-003 fix; credibility rises to 9.5. Residual candidates are accepted.

## Scorecard (1-10)
Format: `[Score] | [Delta: UP/DOWN/SAME vs prev loop] | [Concrete proof: file:line or symbol]`

- Architecture quality: 9.5 | UP | `onboardingSlice.ts` (commit 5ab6270) now pure; `persistenceMiddleware.ts:45-53` absorbs onboarding as single persistence owner. Module graph: monorepo DAG enforced by TypeScript project references. No pass-through wrappers, no costume layers, no repository theater. Residual: none architecture-level (domain type gap now eliminated by loop 2).
- State management and runtime ownership: 9.5 | UP | One owner per mutable concern. `onboardingSlice` reducers pure (5ab6270). `updateItem` reducer (tierSlice.ts:78-96) now accepts `Partial<Item>` where `Item` has only `media?: ItemMedia` — impossible multi-URL states no longer writable via `Partial<Item>`. Residual: `updateItem` could still pass `media: undefined` to clear media — expected and correct behavior.
- Domain modeling: 9.5 | UP | `packages/core/src/models.ts` (this loop): `Item.imageUrl`, `Item.videoUrl`, `Item.audioUrl`, `Item.mediaType` removed; replaced by `media?: ItemMedia`. `ItemMedia` discriminated union now IS the type contract — TypeScript makes impossible combinations unrepresentable. `createItem` simplified to one assignment (`item.media = options.media`). Residual: `packages/core/src/modelResolver.ts` assumes imported items are always "image" type thumbnails — minor, correct for current data model.
- Data flow and dependency design: 9.5 | UP | All persistence back-channels eliminated (5ab6270). Media data flow: `ItemMedia` union flows from `useFileDrop` → `createItem`/`updateItem` → Redux state → rendering — entirely explicit. No singletons, no ambient globals in data paths. Residual: `urlSharing.ts` decode path hard-codes `"image"` type when restoring shared items (correct for v1 share format, which only encodes image URLs).
- Framework / platform best practices: 9.5 | UP | Redux Toolkit used correctly throughout (5ab6270): pure reducers, `createSlice`, `createSelector`. Dynamic `require()` gone (5ab6270). ESM imports only. TypeScript strict. `Item` type serializable (no class, no Symbol, no function). Residual: none.
- Concurrency and runtime safety: 9.5 | SAME | No actor isolation concerns (React/Node single-threaded). `createPersistenceMiddleware` debounce with `clearTimeout` (persistenceMiddleware.ts:23-34). No floating promises. Async thunks await properly. Residual: `persistenceMiddleware.ts:23` — `saveTimeout` is module-local; pending save fires into no-op on store teardown. In tests this is handled by fakeStorage; in production the store is never torn down during normal use. Accepted carve-out.
- Code simplicity and clarity: 9.5 | UP | `Item` interface reduced from 8 fields to 5 (removed imageUrl, videoUrl, audioUrl, mediaType). `createItem` body simplified from 12 lines to 6 (removed switch/case for URL field mapping). `filtering.ts:getItemMediaType` reduced from 10 lines to 1. `useItemInteraction.ts:onFileDrop` reduced from 8 lines to 3 (removed if/else URL-field branching). All reader sites simplified to `item.media?.type` / `item.media?.url`. Deletion test passes for all removed code: complexity does not redistribute. Residual: `headToHead.ts` ~1356 lines, passes deletion test.
- Test strategy and regression resistance: 9.5 | UP | 239 tests across 34+ suites, all pass. `models.test.ts` updated: 5 invariant tests now assert through `item.media?.type` and `item.media?.url` — at the new interface. `useItemInteraction.test.ts` updated: 4 tests assert `media.type` and `media.url` — eliminating assertions on impossible-state absence. Authority Map cross-check passes for all 5 concerns. Residual: `skipOnboarding`/`resetOnboarding` persistence paths not separately tested; `completeOnboarding` fakeStorage test proves the seam. Accepted.
- Overall implementation credibility: 9.5 | UP | Both prior honesty leaks (reducer-body I/O, dynamic require()) gone (5ab6270). F-003 domain model gap resolved this loop: `Item` no longer admits impossible states. Code earns its architecture at every layer. Residual: `StreamingOverlay.tsx` uses non-null assertion (`media!.url`) after type-narrowing checks — minor style; non-null assertion is technically correct (the branch checks `media?.type === "video"` before using `media!.url`).

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
- Allowed writers: `completeOnboarding`, `skipOnboarding`, `resetOnboarding` reducers (pure)
- Observers / readers: AppShell, `selectHasCompletedOnboarding`
- Persistence seam: `createPersistenceMiddleware` (post-loop-1 fix)
- Async mutation entry points: none
- Verdict: Single and clear

**Persistence (localStorage)**
- Owner: `persistenceMiddleware` (packages/state/src/persistenceMiddleware.ts) — single owner for all keys
- Allowed writers: middleware debounced save (500ms)
- Observers / readers: `loadPersistedState`, `hasPersistedState`, `createAppStore`
- Persistence seam: injectable `Storage` (production localStorage + test fakeStorage)
- Async mutation entry points: debounced setTimeout in middleware
- Verdict: Single and clear

## Strengths That Matter
- H2H algorithm port (`packages/core/src/headToHead.ts`) — Wilson-score CI, warm-start queue, frontier detection, hysteresis cuts. Substantive algorithm behind a bounded interface. Passes deletion test.
- `createPersistenceMiddleware` injectable Storage seam — absorbs all slices including onboarding post-loop-1; testable via `fakeStorage` without global mocking.
- `Item` domain type (post-loop-2) — `media?: ItemMedia` discriminated union makes impossible states unrepresentable; `createItem` simplifies to a pure assignment.
- `createAppStore` factory with injectable middleware and `preloadedState` — test isolation at the store level without touching globals.
- Memoized selectors throughout (`selectors.ts`) — `createSelector` for all derived state; no inline selector functions.

## Findings

### Finding F1: Item allows impossible multi-URL combinations (F-003 — resolved this loop)

**Why it matters** — `Item` admitted `imageUrl`, `videoUrl`, `audioUrl` as three independent optionals, allowing impossible multi-URL combinations that the type system accepted but the domain rejected.

**What is wrong (was)** — `packages/core/src/models.ts:17-28` defined `Item` with three independent URL fields plus `mediaType` alongside the `ItemMedia` discriminated union. Object literal construction bypassed `createItem` enforcement. **Resolved in loop 2.**

**Evidence**
- `packages/core/src/models.ts` (post-loop-2) — `Item.media?: ItemMedia` replaces four parallel fields. TypeScript makes conflicting URL combinations unrepresentable.
- `packages/core/test/models.test.ts` — 5 invariant tests assert through `item.media?.type` and `item.media?.url` at the new interface.

**Architectural test failed** — Shallow module test (resolved)

**Dependency category** — `in-process`

**Leverage impact** — Callers that write `Item` objects can no longer produce invalid states; the type contract matches the domain invariant.

**Locality impact** — Media-type detection (`filtering.ts:getItemMediaType`) collapsed from 10 lines to 1.

**Metric signal, if any** — none

**Why this weakens submission** — Was: domain model incomplete. Now resolved.

**Severity** — Noticeable weakness (resolved)

**ADR conflicts** — none

**Minimal correction path** — Completed: removed `imageUrl`, `videoUrl`, `audioUrl`, `mediaType` from `Item`; added `media?: ItemMedia`; updated all reader sites and tests.

**Blast radius**
- changed: packages/core/src/models.ts, packages/core/src/filtering.ts, packages/core/src/modelResolver.ts, packages/ui/src/tier-board/TierRow.tsx, packages/ui/src/tier-board/TierBoard.tsx, packages/ui/src/components/StreamingOverlay.tsx, apps/web/src/hooks/useItemForm.ts, apps/web/src/hooks/useItemInteraction.ts, apps/web/src/components/ItemModal.tsx, apps/web/src/hooks/useExportHandlers.ts, apps/web/src/utils/urlSharing.ts, apps/web/src/pages/HeadToHeadPage.tsx, packages/core/test/headToHeadInternals.test.ts, packages/core/test/headToHeadQuickPhase.test.ts, packages/core/test/models.test.ts, packages/core/test/sorting.test.ts, packages/core/test/filtering.test.ts, apps/web/src/hooks/useItemInteraction.test.ts
- avoided: packages/state/src/, apps/native/

---

## Simplification Check
- Structurally necessary: F-003 fix eliminates 4 redundant parallel fields from `Item` (deletion test passes — removed complexity does not reappear across callers; callers read `item.media?.type`/`item.media?.url` which is simpler than the former branching). Two-adapter rule not triggered (no new seam).
- New seam justified: No new seam. `media?: ItemMedia` is a field, not a seam.
- Helpful simplification: `getItemMediaType` 10 → 1 line; `createItem` body 12 → 6 lines; `onFileDrop` 8 → 3 lines; `onItemMediaDrop` 10 → 3 lines; all reader-site if/else branches simplified to `item.media?.type` checks.
- Should NOT be done: Do not add a separate `MediaAdapter` protocol. Do not make `Item` a class. Do not add factory enforcement at the Redux action level (type safety is sufficient).
- Tests after fix: Shallow tests (asserting `item.imageUrl` absence as proof of mutual exclusivity) replaced with tests asserting `item.media?.type` and `item.media?.url` at the new interface. Replace-don't-layer satisfied.

## Improvement Backlog

*All findings resolved. Residual Accounting Pass run per method.md.*

Residuals for each dimension:
- Architecture quality 9.5: no architecture-level residual identifiable beyond the now-resolved domain modeling gap. Accepted.
- State management 9.5: `updateItem` accepts `Partial<Item>` — with `Item.media?: ItemMedia`, patching `media: undefined` is the correct clear behavior. No invariant violation path. Accepted.
- Domain modeling 9.5: `modelResolver.ts` assumes thumbnail URIs are "image" type — correct for current data model; would need revisiting if the resolver handles video/audio thumbnails. Accepted cosmetic.
- Data flow 9.5: `urlSharing.ts` decodes shared items as `{ type: "image" }` regardless — correct for v1 share format. Accepted.
- Framework idioms 9.5: no non-idiomatic carve-outs remain. Accepted.
- Concurrency 9.5: `saveTimeout` module-local lifecycle — production store never torn down; test uses fakeStorage. Accepted.
- Simplicity 9.5: `headToHead.ts` ~1356 lines; deletion test passes (complexity is substantive algorithm). Accepted.
- Test strategy 9.5: `skipOnboarding`/`resetOnboarding` persistence paths not separately tested; seam proven by `completeOnboarding` test. Accepted.
- Credibility 9.5: `StreamingOverlay.tsx` non-null assertions (`media!.url`) — technically correct, minor style. Accepted.

**System flag: HALT_SUCCESS** (all 9 dimensions ≥ 9.5 with accepted residuals; no queued residuals; build green)

## Deepening Candidates

No deepening candidates. All findings resolved. Residual candidates are accepted cosmetics.

## Builder Notes

**Pattern 1: Parallel fields weakening a discriminated-union domain model**
- what pattern appeared: `Item` had `imageUrl`, `videoUrl`, `audioUrl`, `mediaType` as four independent optionals alongside the `ItemMedia` discriminated union. The union was only enforced at construction (`createItem`), not at the type level.
- how to recognize next time: You added a discriminated union and a smart constructor *alongside* a flat type that still has all the same fields as flat optionals. The union is enforcement theater — the flat type still allows impossible states.
- smallest coding rule: When you introduce `ItemMedia`, make `Item` carry `media?: ItemMedia` directly. Remove the flat parallel fields. The discriminated union only guards the type if it IS the type, not if it lives beside it.

**Pattern 2: Reader-site branches simplified by discriminated union**
- what pattern appeared: Every media-rendering component had `if (item.videoUrl)` / `else if (item.audioUrl)` / `else if (item.imageUrl)` chains. With the flat type, each branch had to defensively check three fields.
- how to recognize next time: When you see `if (item.videoUrl) { src = item.videoUrl } else if (item.imageUrl) { src = item.imageUrl }`, there are probably parallel URL fields hiding a discriminated union that should live in the type.
- smallest coding rule: `const media = item.media; const hasVideo = media?.type === "video"` — one field lookup replaces three. The type narrowing then gives you `media!.url` correctly typed.

**Pattern 3: Smart constructors are policy, not type constraints**
- what pattern appeared: `createItem` enforced the media invariant correctly, but `Item` was a plain interface with all URL fields as flat optionals. Any caller that built `{ id, imageUrl: "x", videoUrl: "y" }` directly bypassed the invariant.
- how to recognize next time: If your smart constructor enforces something that your type doesn't, the type constraint is missing. Smart constructors are a great pattern but they supplement, not substitute, type enforcement.
- smallest coding rule: If a discriminated union exists for the domain concept, put it on the type directly (as `media?: ItemMedia`) rather than having the smart constructor distribute it into parallel fields.

## Final Judge Narrative
Strong contender — all three structural findings resolved across two loops. The H2H algorithm is genuine depth. The Redux module graph is clean and enforced. `onboardingSlice` is now a pure reducer; `createPersistenceMiddleware` is the single persistence owner. `Item` now carries `media?: ItemMedia` — the discriminated union makes impossible multi-URL combinations unrepresentable at the type level. All reader sites simplified. Tests updated to the new interface. Concurrency is trustworthy (React/Node single-threaded; debounce correct; no floating promises). Tests reduce regressions effectively — Authority Map cross-check passes for all five concerns. Future work risk: the `StreamingOverlay.tsx` non-null assertions are minor style, not architectural. The `headToHead.ts` 1356-line algorithm is real complexity, not over-engineering.

## Loop 2 Result

**Finding resolved:** F1 (stable_id F-003) — Item allows impossible multi-URL combinations

**Changes made:**
- `packages/core/src/models.ts` — removed `imageUrl?`, `videoUrl?`, `audioUrl?`, `mediaType?` from `Item` interface; added `media?: ItemMedia`. Simplified `createItem` body from 12 lines to 6 (removed switch/case URL-field mapping; now `item.media = options.media`).
- `packages/core/src/filtering.ts` — `getItemMediaType` reduced from 10 lines to 1 (`return item.media?.type ?? null`). `itemHasMedia` reduced from 3 lines to 1 (`return item.media !== undefined`).
- `packages/core/src/modelResolver.ts` — `resolvedItemToItem` produces `media: { type: "image", url: resolved.thumbUri }` instead of `imageUrl: resolved.thumbUri`.
- `packages/ui/src/tier-board/TierRow.tsx` — `ItemMediaContent` reads `item.media?.type` and `media!.url` instead of `item.videoUrl`/`item.audioUrl`/`item.imageUrl`. `hasMedia` uses `item.media !== undefined`.
- `packages/ui/src/tier-board/TierBoard.tsx` — `DragPreview` same pattern.
- `packages/ui/src/components/StreamingOverlay.tsx` — same pattern for both current-item overlay and revealed-card rendering.
- `apps/web/src/hooks/useItemForm.ts` — reads `initialItem.media?.url` and `initialItem.media?.type` instead of triply branching on `videoUrl`/`audioUrl`/`imageUrl`.
- `apps/web/src/hooks/useItemInteraction.ts` — `onFileDrop` builds `{ media: { type, url } }` directly (removed if/else URL-field branching). `onItemMediaDrop` same pattern (eliminated triple-clear).
- `apps/web/src/components/ItemModal.tsx` — edit path builds `updates.media` directly instead of branching URL fields.
- `apps/web/src/hooks/useExportHandlers.ts`, `apps/web/src/utils/urlSharing.ts`, `apps/web/src/pages/HeadToHeadPage.tsx` — adapted to `item.media?.url`.
- Test files: `models.test.ts`, `filtering.test.ts`, `sorting.test.ts`, `headToHeadInternals.test.ts`, `headToHeadQuickPhase.test.ts`, `useItemInteraction.test.ts` — updated `makeItem` helpers and assertions to use `media` field.

**Test result:** 239 tests, 34+ suites — all pass (0 failures, 0 skips).

**Replace-don't-layer check:** Old tests asserting on `item.imageUrl`/`item.videoUrl`/`item.audioUrl` absence (checking mutual exclusivity) replaced with tests asserting on `item.media?.type` and `item.media?.url` at the new interface. No accumulation at both levels.

**Score impact:** domain_modeling, credibility, state_management all UP to 9.5. architecture_quality, data_flow, framework_idioms, simplicity, test_strategy all UP to 9.5 (structural proof: commits 5ab6270 + this loop).
