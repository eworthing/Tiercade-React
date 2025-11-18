# @tiercade/core

TypeScript port of the TiercadeCore Swift package.

Current status (Phase 1, in-progress):

- **Models & Project schema**
  - `src/models.ts` – `Item`, `Items`, `TierConfig`, `AttributeType`, `GlobalSortMode`.
  - `src/project.ts` – `Project`, `ProjectTier`, `ProjectItem`, `Media`, `ItemOverride`, `Audit`,
    `Links`, `Storage`, `Settings`, `Collaboration`, `Member`, `JSONValue`.
- **Logic**
  - `src/tierLogic.ts` – `moveItem`, `reorderWithin`, `validateTiersShape`.
  - `src/randomUtils.ts` – `createSeededRNG`, `pickRandomPair` (Lehmer LCG, matches Swift `SeededRNG`).
  - `src/headToHead.ts` – Core types plus basic helpers: `HeadToHeadRecord`, `pickPair`, `pairings`, `vote`,
    and typed shell entry points `quickTierPass` / `finalizeTiers` (behavior still TODO).
  - `src/quickRankLogic.ts`, `src/sorting.ts`, `src/formatters.ts`, `src/modelResolver.ts` – typed stubs with
    TODOs pointing to the Swift sources and referenced docs.

Not yet ported (planned next steps):

- Full Head-to-Head tiering behavior:
  - `quickTierPass`, `refinementPairs`, `finalizeTiers`, warm-start helpers, and internal metrics/priors,
    mirroring `HeadToHead.swift` and its `+Internals`, `+QuickSupport`, `+RefinementSupport`, and `+WarmStart`
    extensions, plus `referencedocs/head_to_head_tiering_architecture.md`.
- QuickRank logic (`QuickRankLogic.swift`).
- Sorting helpers (`Sorting.swift`).
- Formatters and import/export (`Formatters.swift`, `ModelResolver.swift` and related docs/specs).

Tests:

- Jest unit tests live under `test/` and mirror TiercadeCore Swift tests where implemented:
  - `tierLogic.test.ts` ↔︎ `TierLogicTests.swift`
  - `randomUtils.test.ts` ↔︎ `RandomUtilsTests.swift`
  - `models.test.ts` ↔︎ `ModelsTests.swift`
  - `headToHead.test.ts` ↔︎ basic cases from `HeadToHeadLogicTests.swift`

All algorithms are intended to be deterministic given the same inputs and RNG sequence, matching the Swift
behavior as closely as possible.

