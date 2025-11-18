## TiercadeCore → TypeScript Porting Guide

This guide defines how to port the `TiercadeCore` Swift package into `packages/core` so an LLM can work safely and deterministically without re-inventing behavior.

Use this together with:

- `docs/migration/TIERCADE_REACT_MIGRATION_PLAN.md`
- `docs/migration/typescript-models-example.ts`
- `docs/migration/typescript-logic-example.ts`
- `referencedocs/ProjectDataModels.swift`
- `referencedocs/head_to_head_tiering_architecture.md`

---

## Goals

- **1:1 behavioral parity** with `TiercadeCore` for all public functions.
- **Deterministic outputs** given the same inputs and RNG seeds.
- **Clear module boundaries** so `packages/core` remains framework-agnostic (no React or browser APIs).

---

## Target Files & Mapping

All TypeScript lives under `packages/core/src/`. Suggested mapping:

| Swift Source | TypeScript Target | Notes |
|-------------|-------------------|-------|
| `Models.swift` | `models.ts` | Base `Item`, `Items`, `TierConfig`, etc. |
| `TierlistProject.swift` | `project.ts` or part of `models.ts` | Project schema and related types. |
| `TierIdentifier.swift` | `tierIdentifier.ts` | Strongly-typed tier ID logic (if needed). |
| `TierLogic.swift` | `tierLogic.ts` | move, reorder, normalization helpers. |
| `QuickRankLogic.swift` | `quickRankLogic.ts` | Quick rank algorithm. |
| `Sorting.swift` | `sorting.ts` | Global sort behaviors. |
| `HeadToHead.swift` + internals | `headToHead.ts` | Full H2H logic (quick pass + refinement). |
| `RandomUtils.swift` | `randomUtils.ts` | RNG helpers and shuffling. |
| `Formatters.swift` | `formatters.ts` | CSV/Markdown/text export helpers. |
| `ModelResolver.swift` | `modelResolver.ts` | Import/validation logic. |

The `typescript-*.ts` example files should be treated as **reference sketches**, not final implementations. The definitive behavior is the Swift code plus its tests.

---

## TypeScript Conventions

- **Modules, not namespaces.** Use ES modules with `export`/`import`.
- **Prefer interfaces and type aliases** over classes where Swift structs/enums are used.
- **Explicit input & output types** for all exported functions.
- **Do not hide logic behind OO wrappers**—mirror Swift’s static function style with pure functions.
- **RNG injection:** Any function that uses randomness must accept an `rng: () => number` parameter.

Example:

```ts
export function pickPair<T>(pool: T[], rng: () => number): [T, T] | null {
  // ...
}
```

---

## Behavioral Parity & Tests

For each Swift test file in `TiercadeCore/Tests/TiercadeCoreTests`, create a corresponding Jest/TypeScript file under `packages/core/test/`:

| Swift Tests | TS Tests |
|------------|----------|
| `TierLogicTests.swift` | `tierLogic.test.ts` |
| `HeadToHeadLogicTests.swift` | `headToHead.test.ts` |
| `QuickRankLogicTests.swift` | `quickRankLogic.test.ts` |
| `SortingTests.swift` | `sorting.test.ts` |
| `RandomUtilsTests.swift` | `randomUtils.test.ts` |
| `ModelsTests.swift` | `models.test.ts` |
| `ModelResolverTests.swift` | `modelResolver.test.ts` |
| `BundledProjectsTests.swift` | `bundledProjects.test.ts` (if needed) |

Guidelines:

- Recreate **input fixtures** and **expected outputs** in TS, using the Swift tests as a blueprint.
- When Swift uses randomization, pass a **deterministic RNG** to the TS code:
  - For example, a simple seeded LCG or a fixed array of random numbers.
- Make sure assertions match the **same invariants**:
  - Ordering of tiers and items.
  - Tier assignments after H2H.
  - Error cases and edge conditions.

---

## HeadToHead Specifics

The H2H logic is the most complex part of the port. Treat `referencedocs/head_to_head_tiering_architecture.md` as the canonical narrative spec.

Key invariants to preserve:

- Pool construction:
  - Include unranked + unlocked tiers.
  - Locked tiers contribute priors but are not moved.
- Quick phase:
  - `quickTierPass` uses Wilson score with priors and `zQuick`.
  - Quantile cuts must match Swift’s `quantileCuts` behavior exactly.
  - Undersampled items remain unranked.
- Refinement:
  - Uses `zStd` (or fallback) and churn thresholds.
  - Boundary and frontier pairs must be generated identically.
  - Final tier assignments must match Swift given the same comparison history.

Implementation tips:

- Keep math helpers (Wilson bounds, quantiles, priors) in dedicated functions with tests.
- Use stable sorts with explicit tie-breakers to guarantee determinism.
- Pay close attention to **floating-point behavior**—where Swift clamps or rounds, do the same in TS.

---

## Import/Export & Validation

`ModelResolver` and import/export behavior are defined by:

- `referencedocs/ProjectDataModels.swift`
- `referencedocs/project_data_import_export_spec.md`
- `referencedocs/tierlist.schema.json`

When porting:

- Match Swift’s **validation rules** and error categorization.
- Ensure round-trip safety:
  - Swift export → TS import → TS export → Swift import.
- Use a JSON schema validator (e.g. Zod or similar) only if it **does not change behavior**; it should just enforce what Swift already does.

---

## What Not to Do

- Do **not** simplify or “improve” algorithms during the initial port.
- Do **not** introduce framework dependencies (React, Node-specific APIs) into `packages/core`.
- Do **not** change data shapes for convenience; match Swift’s models first, then iterate.

Once the TS port is fully covered by tests and round-trip checks, future refactors can be considered—but the first pass should be a faithful translation.


