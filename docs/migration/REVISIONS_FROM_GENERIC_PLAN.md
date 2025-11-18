# Key Revisions from Generic React Migration Plan

This document highlights how the Tiercade-specific migration plan differs from the generic tier list app migration plan you provided.

---

## Major Strategic Changes

### 1. Recommendation Refined: Generic Full Rewrite → Phased Full React Rewrite

**Generic Plan Recommended:**
- Full React Native + React Native Web rewrite
- Flip tvOS, iOS, macOS, and web to React in one major migration
- 60–80% code sharing across all platforms (UI + logic)

**Tiercade-Specific Recommendation (Current):**
- **Phased full React rewrite:**
  - Phase 1: React/TypeScript web app (Vite + React 18) with ported TiercadeCore logic
  - Phase 2+: React Native clients (via Expo) for iOS/iPadOS/tvOS (and optionally Android/macOS)
- Swift/TiercadeCore kept running as a **behavioral reference** until React parity is proven
- Explicit **phase gates** and rollout criteria instead of a single “big bang” rewrite

**Why the refinement?**

The generic plan was directionally correct (React-first) but under-specified for Tiercade’s constraints:

- **Apple Intelligence integration** (FoundationModels API) is tightly coupled to native Apple platforms.
- **Liquid Glass effects** (tvOS 26) and tvOS-first focus behavior do not have 1:1 React equivalents.
- **`AccessibilityBridgeView` patterns** and Dynamic Type (`@ScaledMetric`) are deeply SwiftUI-specific.

The Tiercade-specific plan:

- Accepts that some Apple-exclusive experiences will be **reimagined**, not directly preserved.
- Reduces risk by **shipping web first** and using the Swift app as a correctness oracle.
- Treats the React Native rollout as a **second, separately validated phase**, rather than bundling everything into one rewrite.

---

## 2. Feature Compatibility Matrix Added

**Generic Plan:**
- Assumed all features portable to React Native
- Focused on generic drag-and-drop and data persistence

**Tiercade Plan:**
- **Explicit compatibility matrix** for 20+ features
- Identifies **non-portable features:**
  - Apple Intelligence (FoundationModels)
  - Liquid Glass visual effects
  - tvOS focus containment patterns (`.fullScreenCover()`)
  - `AccessibilityBridgeView` immediate registration
- Provides **fallback strategies** for each limitation

**Example:**

| Feature | Native | Web | Notes |
|---------|--------|-----|-------|
| Liquid Glass | ✅ | ❌ | CSS `backdrop-filter` fallback |
| Apple Intelligence | ✅ macOS/iOS | ❌ | Could integrate OpenAI API later |
| Head-to-Head | ✅ | ✅ | Port algorithm (~300 LOC) |

---

## 3. Data Model Grounded in Actual Codebase

**Generic Plan:**
- Proposed hypothetical `TierList`, `Tier`, `TierItem` interfaces
- Assumed simple structure with image URIs and basic metadata

**Tiercade Plan:**
- **Ported actual Swift types** from TiercadeCore:
  - `Item` (id, name, seasonString, seasonNumber, imageUrl, videoUrl)
  - `Project` (full schema with audit, collaboration, media, overrides)
  - `Items` typealias (`[String: [Item]]`)
  - `TierConfig`, `GlobalSortMode`, `AttributeType`
- **Provided TypeScript equivalents** with exact field mappings
- **Includes validation logic** from `ProjectValidation.validateOfflineV1()`

**Example (actual Tiercade model):**

```typescript
// From TiercadeCore/Sources/TiercadeCore/Models/Models.swift
export interface Item {
  id: string;
  name?: string;
  seasonString?: string;
  seasonNumber?: number;
  status?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
}
```

This eliminates guesswork and ensures 1:1 compatibility.

---

## 4. Algorithm Complexity Acknowledged

**Generic Plan:**
- Assumed tier logic is simple (add/remove/move items)
- Minimal discussion of complex algorithms

**Tiercade Plan:**
- **Head-to-Head algorithm** is 300+ LOC of sophisticated logic:
  - Quantile-based tier cuts
  - Bayesian ranking with priors
  - Refinement pair generation
  - Warm start strategies
  - Statistical tuning parameters (`Tun.zQuick`, etc.)
- **Realistic porting effort:** 2-3 weeks with extensive testing
- **Testing strategy:** Port all Swift unit tests to ensure parity

**Excerpt from actual code:**

```swift
// HeadToHead.swift - not trivial!
public static func quickTierPass(
    from pool: [Item],
    records: [String: HeadToHeadRecord],
    tierOrder: [String],
    baseTiers: Items
) -> HeadToHeadQuickResult {
    let (rankable, undersampled) = partitionByComparisons(...)
    let metrics = metricsDictionary(for: rankable, records: records, z: Tun.zQuick, priors: priors)
    let cuts = quantileCuts(count: ordered.count, tierCount: tierCount)
    // ... complex statistical ranking
}
```

This isn't "drag-and-drop logic"—it's a ranking engine that needs careful validation.

---

## 5. Technology Stack Refined: Web-First + React Native Later

**Generic Plan:**
- React Native + React Native Web (unified stack)
- Expo bare workflow
- React Navigation for routing
- Potentially heavy dependencies for cross-platform UI

**Tiercade Plan:**
- **Phase 1 – Web stack** (simpler, faster to ship):
  - React 18 + Vite
  - DnD Kit for drag-and-drop (web-optimized, accessible)
  - Tailwind CSS for design tokens and responsive layout
  - Playwright for cross-browser E2E tests
- **Phase 2+ – React Native stack:**
  - React Native (Expo) for iOS/iPadOS/tvOS (and optionally Android)
  - React Navigation / expo-router for navigation
  - React Native Testing Library + Jest for RN component tests
  - TV-specific focus helpers (e.g., `react-tv-space-navigation`) to approximate Tiercade’s tvOS UX
- **Shared packages:** TypeScript models/logic (`packages/core`), Redux store (`packages/state`), and design tokens (`packages/theme`) reused across web and RN.

**Rationale:**

Instead of forcing everything through React Native from day one, Tiercade:

- Uses a **web-first React stack** where React shines (browser UX).
- Introduces React Native **after** logic, data, and design tokens are stable in TypeScript.
- Keeps Swift in production as a safety net until React Native clients reach parity.

---

## 6. Testing Strategy: Parity Validation

**Generic Plan:**
- Generic testing mentions (Jest, RTL, Detox)
- No specific validation of logic correctness

**Tiercade Plan:**
- **Port all TiercadeCore tests** to TypeScript:
  - `TierLogicTests.swift` → `tierLogic.test.ts`
  - `HeadToHeadLogicTests.swift` → `headToHead.test.ts`
  - 100+ unit tests ensuring behavior matches Swift exactly
- **Round-trip data tests:**
  - Export from Swift → Import to Web → Export from Web → Import to Swift
  - Validate no data loss or corruption
- **Statistical validation for Head-to-Head:**
  - Same inputs (comparisons) must produce same tier placements
  - Use deterministic RNG seeds to ensure reproducibility

**Example:**

```typescript
// Ported from TierLogicTests.swift
it('moves item from S to A tier', () => {
  const tiers = {
    S: [{ id: 'iron-man', name: 'Iron Man' }],
    A: [],
    unranked: []
  };
  const result = TierLogic.moveItem(tiers, 'iron-man', 'A');
  expect(result.A[0].id).toBe('iron-man'); // Exact parity
});
```

This ensures the TypeScript port isn't a "best effort" reimplementation—it's **validated to match Swift behavior**.

---

## 7. Risk Assessment Specific to Tiercade

**Generic Plan:**
- Generic risks (SourceKit errors, focus management complexity)
- Assumes greenfield development

**Tiercade Plan:**
- **Rewrite risk quantified:**
  - Full React rewrite: 8-12 months, HIGH risk
  - Hybrid approach: 3-4 months, LOW risk
- **Specific risks identified:**
  - HeadToHead port bugs (Medium likelihood, High impact)
  - Data corruption in import/export (Low likelihood, Critical impact)
  - Native vs. web divergence (High likelihood, Medium impact)
- **Mitigation strategies:**
  - Extensive unit tests (port Swift tests)
  - Schema validation (JSON Schema + Zod)
  - Integration tests (round-trip data)

**Risk Matrix:**

| Risk | Generic Plan | Tiercade Plan |
|------|--------------|---------------|
| Algorithm bugs | Not mentioned | **Medium/High** - Port with tests |
| Data corruption | Mentioned briefly | **Critical** - Schema validation required |
| Feature divergence | Assumed shared code prevents | **High** - Two UIs will drift without discipline |

---

## 8. Deployment Model Clarified

**Generic Plan:**
- Implicitly assumes replacing Swift apps with React Native apps in one shot.
- Focuses on the end state, not the transition.

**Tiercade Plan:**
- **Phase 1 (Web):**
  - Deploy React web app to Vercel/Netlify at `tiercade.app`.
  - Keep Swift apps in the App Store as the canonical experience during transition.
  - Add cross-promotion: native → “Open in Web”, web → “Download native app”.
- **Phase 2+ (React Native rollout):**
  - Ship React Native apps to the App Store alongside (or in place of) Swift apps.
  - Use staged rollout / feature flags to limit blast radius.
  - Retire Swift apps only after RN clients meet parity and stability thresholds.

This makes React the **eventual end state**, but with a concrete, testable migration path rather than a single cutover.

---

## 9. Future Evolution Path

**Generic Plan:**
- Assumes “React Native everywhere” as the end state, but does not spell out intermediate checkpoints.

**Tiercade Plan:**
- **Explicit phased path:**
  - **Phase 1:** React web (this is the current focus).
  - **Phase 2:** React Native mobile + tvOS apps built on the same TypeScript core.
  - **Phase 3:** Desktop strategy (React Native macOS vs Electron/Tauri vs “web only”).
  - **Phase 4:** Decommission SwiftUI once React clients satisfy quality gates.
- **Near-term enhancements (after Phase 1):**
  - Cloud sync (Supabase/Firebase).
  - Collaborative editing (Yjs/ShareDB).
  - AI integration via web/React Native APIs (OpenAI, etc.), instead of FoundationModels.

This acknowledges that **React is the intended end state**, but with deliberate milestones instead of a single all-or-nothing migration.

---

## 10. Monorepo Structure Simplified (but React-First)

**Generic Plan:**
- Complex monorepo with `apps/mobile`, `apps/web`, `apps/desktop`, `packages/domain`, `packages/state`, `packages/ui`.
- Assumes heavy shared UI packages from day one.

**Tiercade Plan:**
- **React-first monorepo, but focused on what we actually share:**
  ```text
  tiercade-react/
  ├── packages/
  │   ├── core/      # Models, TierLogic, HeadToHead, RandomUtils (TS)
  │   ├── state/     # Redux Toolkit store + slices
  │   ├── ui/        # Shared TierBoard/TierRow/ItemCard/overlays
  │   └── theme/     # Palette, typography, metrics
  └── apps/
      ├── web/       # React DOM (Vite/Next.js)
      └── native/    # React Native (Expo, iOS/iPadOS/tvOS/Android)
  ```
- Swift/TiercadeCore remain **outside** this monorepo as a legacy reference during migration.

**Rationale:**

Instead of an over-engineered polyglot monorepo, Tiercade adopts a **React-focused** structure that:

- Maximizes sharing where it matters (logic, state, design tokens, core UI).
- Keeps app shells (web vs RN) thin and platform-appropriate.

---

## Summary: What Changed and Why

| Aspect | Generic Plan | Tiercade Plan | Reason for Change |
|--------|--------------|---------------|-------------------|
| **Approach** | Full React rewrite (single big migration) | Phased full React rewrite (web first, then RN) | Reduce risk, keep Swift as reference during transition |
| **Effort** | 8–12 months (implicit) | 3–4 months for web (Phase 1), 8–12 months total | Make timelines explicit, with intermediate value |
| **Code Sharing** | 60–80% (UI + logic) | Shared TS core/state/UI across web + RN | Clarify exactly what is shared and where |
| **Risk Level** | HIGH (all-new code, single cutover) | HIGH but gated (phased rollout, parity checks) | Add phase gates and parity validation |
| **Apple Intelligence** | Lost or pushed into native modules | Reimagined (backend AI / RN modules) | Acknowledge unavoidable changes, plan replacements |
| **Liquid Glass & tvOS UX** | Assumed “can be replicated” | Explicitly flagged as approximated in React | Set expectations for visual/UX differences |
| **Testing** | Generic (Jest/Detox) | Port Swift tests + round-trip + statistical checks | Treat Swift behavior as oracle during migration |
| **Deployment** | Replace native with RN apps | Web first, then RN; Swift decommissioned last | Make the upgrade path safe and observable |
| **Future** | React end state (unstated path) | React end state with phased roadmap | Aligns with current decision and timing |

---

## Recommendation

Given the updated decision, for **Tiercade specifically**:

- Proceed with a **phased full React rewrite**, not with a one-shot migration and not with a permanent Swift+web hybrid.
- Treat Phase 1 (web) as the proving ground for the TypeScript core, data model, and testing strategy.
- Only move to React Native rollout and Swift decommissioning after the web app demonstrates parity and reliability.

---

## Next Steps

1. **Confirm scope:** Align on the phased full React rewrite as the strategic direction.
2. **Execute Phase 1 (Web):**
   - Finalize TypeScript model/logic ports and tests.
   - Build and ship the web tier editor per `TIERCADE_REACT_MIGRATION_PLAN.md`.
3. **Plan Phase 2 (React Native):**
   - Spike on tvOS focus/navigation and Apple Intelligence alternatives.
   - Define success criteria for replacing Swift apps in stages.
4. **Iterate:** Use metrics from web usage and migration progress to tune later phases (mobile, tvOS, desktop) and the final Swift decommissioning timeline.
