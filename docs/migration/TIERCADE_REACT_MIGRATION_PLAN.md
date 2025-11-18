# Tiercade React Migration Plan (Full React Rewrite – Phased)

**Status:** Proposal
**Goal:** Migrate Tiercade to a React/TypeScript stack across web and devices
**Approach:** Phased full React rewrite (React web first, then React Native clients)
**Estimated Effort (Phase 1 – Web):** ~16 weeks for feature-parity web MVP
**Estimated Effort (Overall Rewrite):** 8–12 months including React Native clients and decommissioning SwiftUI
**LLM/AI Status:** All LLM/AI features are **temporarily frozen** during this migration (see `LLM_FEATURE_FREEZE_PLAN.md`).

---

## Table of Contents

1. [Strategic Decision: Phased Full React Rewrite](#strategic-decision-phased-full-react-rewrite)
2. [Architecture Overview](#architecture-overview)
3. [Feature Compatibility Matrix](#feature-compatibility-matrix)
4. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
5. [Technology Stack (Web)](#technology-stack-web)
6. [Technology Stack (React Native)](#technology-stack-react-native)
7. [Data Interchange Format](#data-interchange-format)
8. [Testing Strategy](#testing-strategy)
9. [Deployment & Distribution](#deployment--distribution)
10. [Future Evolution Path](#future-evolution-path)

---

## Strategic Decision: Phased Full React Rewrite

### Comparison of Approaches

| Criterion | Full React Rewrite (React + React Native) | Hybrid (Swift + Web) | Status Quo (Swift Only) |
|-----------|-------------------------------------------|----------------------|-------------------------|
| Time to Web | **3–4 months** (Phase 1) | 3–4 months | ∞ |
| Time to Single React Stack | **8–12 months** | N/A | N/A |
| Apple Intelligence | ⚠️ Requires new integration strategy | ✅ Keep native | ✅ Native only |
| Liquid Glass (tvOS 26) | ⚠️ Reimplemented or approximated | ✅ Keep native | ✅ Native only |
| tvOS Focus Management | ⚠️ Reimplemented in React TV patterns | ✅ Keep proven UX | ✅ Proven |
| Design Token System | ✅ Reimplemented as cross-platform tokens | ✅ Keep SwiftUI system | ✅ Current system |
| Head-to-Head Algorithm | ✅ Port to TS (shared) | ✅ Port to TS (shared) | ✅ Swift only |
| Code Sharing | 70–80% (logic + shared UI/state) | Logic: ~90%, UI: 0% | N/A |
| Maintenance Burden | Single primary stack (React) | Two stacks | Single stack |
| Risk Level | **HIGH** (requires careful phasing) | **LOW** (additive) | None |
| Native App Performance | ⚠️ RN bridge overhead vs SwiftUI | ✅ Native SwiftUI | ✅ Native SwiftUI |
| Web Performance | ✅ React optimized | ✅ React optimized | N/A |

### Recommendation: **Phased Full React Rewrite**

The decision is to move Tiercade to a **React-first stack** while minimizing uncontrolled regressions by phasing the work:

1. **Phase 1 – React Web App (this plan’s main focus):**  
   Build a full-featured React/TypeScript web app using the Swift codebase as behavioral reference. This delivers value quickly and validates the TypeScript port of `TiercadeCore`.
2. **Phase 2 – React Native Mobile + tvOS:**  
   Replace iOS/iPadOS/tvOS SwiftUI clients with React Native apps (likely Expo-based) that reuse the same TypeScript models, logic, and most state management.
3. **Phase 3 – macOS/Desktop Story:**  
   Decide between React Native macOS, Electron/Tauri, or relying on the web app for desktop with tight keyboard support. This phase focuses on parity with current macOS behavior where it matters.
4. **Phase 4 – Decommission SwiftUI:**  
   When parity and reliability are confirmed, retire the SwiftUI app and TiercadeCore as live dependencies, keeping them as archival references only.

This path **explicitly accepts** some tradeoffs (loss or reimplementation of certain Apple-specific features) in exchange for:

- A **single primary technology stack** (React + TypeScript)
- Simplified hiring and onboarding
- Easier cross-platform feature development once the migration is complete

---

## Architecture Overview

### Current State (Swift/SwiftUI)

```
Tiercade/
├── Tiercade/                   # SwiftUI app (tvOS/iOS/iPadOS/macOS)
│   ├── State/AppState.swift   # @Observable state management
│   ├── Views/                 # SwiftUI views
│   ├── Design/                # Palette, TypeScale, Metrics
│   └── Overlays/              # HeadToHead, Analytics, ThemePicker, etc.
└── TiercadeCore/              # Pure Swift logic package
    ├── Models/                # Item, Project, TierConfig
    └── Logic/                 # TierLogic, HeadToHeadLogic, QuickRankLogic
```

### Target State (React-First, Multi-Platform)

The long-term goal is a React/TypeScript monorepo where web and device apps share the same core logic and most of the UI/state layer, with platform-specific shells and navigation.

```text
tiercade-react/
├── packages/
│   ├── core/                       # Ported TiercadeCore logic (TypeScript)
│   │   ├── models.ts               # Item, Project, TierConfig, Project schema
│   │   ├── tierLogic.ts            # moveItem, reorderWithin, normalization
│   │   ├── headToHead.ts           # quickTierPass, vote, refinement, etc.
│   │   ├── sorting.ts              # Sorting algorithms
│   │   └── randomUtils.ts          # RNG, shuffling
│   ├── ui/                         # Shared React UI primitives
│   │   ├── TierBoard.tsx
│   │   ├── TierRow.tsx
│   │   ├── ItemCard.tsx
│   │   └── overlays/               # HeadToHead, ThemeLibrary, Analytics
│   ├── state/                      # Shared Redux Toolkit store
│   │   ├── store.ts
│   │   ├── tierSlice.ts
│   │   └── headToHeadSlice.ts
│   └── theme/                      # Design tokens (colors, spacing, type scale)
│       ├── palette.ts
│       ├── typography.ts
│       └── metrics.ts
├── apps/
│   ├── web/                        # React DOM (Vite or Next.js)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── routes/             # React Router / file-based routing
│   │   │   └── pages/              # Web-specific pages and shells
│   │   └── index.html
│   ├── native/                     # React Native (Expo)
│   │   ├── app/                    # expo-router or similar routing
│   │   ├── ios/                    # Native shells (iOS/iPadOS/tvOS)
│   │   └── android/                # Optional Android
│   └── desktop/ (optional)         # Electron/Tauri or React Native macOS
└── shared/
    └── schema/                     # Shared JSON schema (validation)
        └── project-v1.schema.json  # OpenAPI/JSON Schema for Project type
```

**Key Principles:**

- **React as the primary UI stack:** New work targets React/React Native first.
- **Swift becomes reference, not source of truth:** The Swift app and TiercadeCore define expected behavior until parity is proven, then are retired.
- **Shared logic and state:** Models, algorithms, and Redux slices live in shared packages reused by both web and React Native.
- **Platform-appropriate shells:** Navigation, input handling (remote vs mouse vs touch), and a few visuals adapt per platform.

---

## Feature Compatibility Matrix

| Feature | Native (Swift) | Web (React) | Notes |
|---------|---------------|-------------|-------|
| **Core Tier Editing** | ✅ | ✅ | Full parity |
| Drag & drop items | ✅ Touch/Remote | ✅ Mouse | DnD Kit for web |
| Multi-select | ✅ | ✅ | Keyboard shortcuts on web |
| Undo/redo | ✅ | ✅ | Port history stack |
| Custom tier config | ✅ | ✅ | Full support |
| **Head-to-Head** | ✅ | ✅ | Port algorithm + UI |
| QuickRank overlay | ✅ | ⚠️ Phase 2 | Lower priority for web |
| **Themes** | ✅ | ✅ | Port palette system |
| Liquid Glass effects | ✅ Native only | ❌ | CSS fallback (opacity/blur) |
| **Analytics** | ✅ | ✅ | Port charting logic |
| **Import/Export** | ✅ JSON/CSV/PNG/PDF | ✅ JSON/CSV/PNG | PDF via browser print |
| **Apple Intelligence** | ✅ macOS/iOS only | ❌ | Platform limitation |
| AI list generation | ✅ (FoundationModels) | ❌ | Could integrate OpenAI API (future) |
| **Focus Management** | ✅ tvOS-optimized | N/A | Web uses keyboard/mouse |
| `.fullScreenCover()` modals | ✅ | ⚠️ React Portal | Different UX pattern |
| `AccessibilityBridgeView` | ✅ iOS/macOS | N/A | Web has native ARIA |
| **Bundled Projects** | ✅ | ✅ | Port JSON catalogs |
| **Design System** | ✅ Palette/TypeScale | ⚠️ CSS Variables | Manual port |
| Dynamic Type (`@ScaledMetric`) | ✅ | ⚠️ `rem` units | Similar concept |

### Features Not Ported (Web Phase 1)

- **Apple Intelligence:** No browser equivalent to FoundationModels
  - *Future:* Could integrate ChatGPT API or local Ollama
- **Liquid Glass:** No CSS equivalent to tvOS 26 glass effects
  - *Fallback:* `backdrop-filter: blur()` + opacity (visually similar)
- **QuickRank Overlay:** Lower priority for mouse/keyboard UX
  - *Future:* Phase 2 feature

---

## Phase-by-Phase Implementation

### Phase 1: Foundation (Weeks 1-3)

**Goal:** TypeScript logic layer + basic React app skeleton

**Deliverables:**

1. **TypeScript Port of TiercadeCore** (Week 1-2)
   - [ ] Port `Models.swift` → `models.ts` (Item, Project, TierConfig)
   - [ ] Port `TierLogic.swift` → `tierLogic.ts` (moveItem, reorderWithin)
   - [ ] Port `RandomUtils.swift` → `randomUtils.ts`
   - [ ] Port `Formatters.swift` → `formatters.ts` (CSV export, etc.)
   - [ ] Write Jest unit tests matching `TiercadeCoreTests/` (critical for parity)

2. **Project Structure** (Week 2)
   - [ ] Initialize React app (Vite + TypeScript)
   - [ ] Set up Redux Toolkit or Zustand for state
   - [ ] Configure Tailwind CSS or CSS Modules
   - [ ] Set up testing (Jest + React Testing Library)

3. **Data Interchange Validation** (Week 3)
   - [ ] Create JSON Schema for `Project` type
   - [ ] Test export from Swift app → import to web app
   - [ ] Test export from web app → import to Swift app
   - [ ] Validate all bundled projects load correctly

**Success Criteria:**
- All TiercadeCore unit tests pass in TypeScript (via Jest)
- Can round-trip a tier list: Native → JSON → Web → JSON → Native

---

### Phase 2: Core UI (Weeks 4-7)

**Goal:** Mouse-optimized tier editing with drag & drop

**Deliverables:**

1. **Tier Board Components** (Week 4-5)
   - [ ] `<TierBoard>` - vertical layout of tiers
   - [ ] `<TierRow>` - single tier with label + items
   - [ ] `<ItemCard>` - draggable item with image + name
   - [ ] `<Toolbar>` - New list, import, export, settings

2. **Drag & Drop** (Week 5-6)
   - [ ] Integrate DnD Kit for item dragging
   - [ ] Implement drop zones (tier rows + unranked section)
   - [ ] Visual feedback (ghost item, drop indicator)
   - [ ] Keyboard accessibility (DnD Kit's keyboard sensor)

3. **State Management** (Week 6)
   - [ ] Redux slice for current tier list
   - [ ] Undo/redo middleware
   - [ ] Persistence to LocalStorage/IndexedDB

4. **Design System** (Week 7)
   - [ ] Port Palette.swift colors to CSS variables
   - [ ] Port TypeScale.swift to Tailwind config
   - [ ] Responsive layout (desktop, tablet, mobile)

**Success Criteria:**
- User can create tier list, drag items, undo/redo, save to browser storage
- Design matches native app's visual identity (colors, spacing)

---

### Phase 3: Head-to-Head (Weeks 8-10)

**Goal:** Port the comparison ranking algorithm + overlay UI

**Deliverables:**

1. **Algorithm Port** (Week 8)
   - [ ] Port `HeadToHead.swift` → `headToHead.ts` (~300 LOC)
     - `vote()`, `pickPair()`, `pairings()`
     - `quickTierPass()` with quantile cuts
     - `refinementPairs()` logic
     - Prior building from existing tiers
   - [ ] Write comprehensive tests against Swift test suite
   - [ ] Validate statistical properties (same tier distributions as Swift)

2. **UI Components** (Week 9)
   - [ ] `<HeadToHeadOverlay>` modal
   - [ ] Contender cards with images
   - [ ] Progress indicator (X of Y comparisons)
   - [ ] Skip button + skip count
   - [ ] Phase indicator (Quick → Refine → Done)

3. **Integration** (Week 10)
   - [ ] Wire overlay to Redux state
   - [ ] Apply results to tier board
   - [ ] Keyboard shortcuts (arrow keys to vote, Esc to cancel)

**Success Criteria:**
- Head-to-head produces identical tier placements as Swift app (given same votes)
- Overlay UX is intuitive on desktop (mouse or keyboard)

---

### Phase 4: Polish & Parity (Weeks 11-14)

**Goal:** Reach feature parity with native app (minus Apple-specific features)

**Deliverables:**

1. **Remaining Overlays** (Week 11)
   - [ ] Theme library browser
   - [ ] Analytics dashboard (port charting logic)
   - [ ] Settings panel
   - [ ] Import wizard (JSON/CSV upload)

2. **Export Functionality** (Week 12)
   - [ ] JSON export (already working from state)
   - [ ] CSV export (port Formatters.swift logic)
   - [ ] PNG export (html-to-canvas or canvas rendering)
   - [ ] PDF export (browser print or jsPDF)

3. **Bundled Projects** (Week 12)
   - [ ] Port bundled JSON catalogs to `public/bundled-projects/`
   - [ ] Implement catalog browser
   - [ ] Load project from catalog

4. **Accessibility & Responsiveness** (Week 13)
   - [ ] ARIA labels for screen readers
   - [ ] Keyboard navigation for all interactions
   - [ ] Mobile responsive layout (tablet/phone sizes)
   - [ ] Touch-friendly drag & drop

5. **Testing & Bug Fixes** (Week 14)
   - [ ] E2E tests with Playwright (critical user flows)
   - [ ] Cross-browser testing (Chrome, Firefox, Safari)
   - [ ] Performance profiling (large tier lists)
   - [ ] Address any UI/UX quirks

**Success Criteria:**
- Can perform all tier editing tasks available in native app (except Apple Intelligence)
- Works well on desktop (mouse/keyboard) and tablet (touch)
- Passes accessibility audit (axe DevTools)

---

### Phase 5: Deployment (Week 15-16)

**Goal:** Deploy web app publicly

**Deliverables:**

1. **Hosting Setup**
   - [ ] Deploy to Vercel/Netlify/Cloudflare Pages
   - [ ] Configure custom domain (e.g., `tiercade.app`)
   - [ ] Set up CDN for bundled project images

2. **SEO & Metadata**
   - [ ] Meta tags for social sharing
   - [ ] Open Graph images
   - [ ] Sitemap.xml

3. **Documentation**
   - [ ] User guide (how to use web app)
   - [ ] Import/export instructions (native ↔ web)
   - [ ] Keyboard shortcuts reference

4. **Analytics (Optional)**
   - [ ] Privacy-friendly analytics (Plausible/Fathom)
   - [ ] Error tracking (Sentry)

**Success Criteria:**
- Web app live at public URL
- Users can discover and use without prior knowledge of native apps

---

## Technology Stack (Web)

### Core Framework

- **React 18+**: Component library
- **TypeScript 5+**: Type safety
- **Vite**: Build tool (faster than Webpack, better DX)

### State Management

**Recommendation: Redux Toolkit**

- Predictable state for complex interactions (drag & drop, undo/redo)
- Time-travel debugging (Redux DevTools)
- Middleware for persistence and analytics
- Team already familiar with observable patterns (similar mental model)

*Alternative:* Zustand (simpler, but less tooling for undo/redo)

### Drag & Drop

**Recommendation: DnD Kit**

- Modern, performant, accessible
- Built-in keyboard support (WCAG compliant)
- No HTML5 DragEvent quirks
- Active maintenance (2024+)

*Alternatives:*
- React DnD (older, HTML5-based)
- React Beautiful DnD (deprecated)

### Styling

**Recommendation: Tailwind CSS**

- Rapid prototyping
- Design tokens via config (easy port from Palette.swift)
- Tree-shaking (smaller bundle)
- Good for responsive design

*Alternative:* CSS Modules + styled-components

### Data Persistence

- **LocalStorage**: User preferences, simple data
- **IndexedDB** (via Dexie.js): Tier lists, images (larger data)
- **File System Access API**: Optional, for power users

### Testing

- **Unit:** Jest + @testing-library/react
- **E2E:** Playwright (cross-browser)
- **Accessibility:** axe-core, pa11y

### Deployment

- **Vercel** (recommended) or Netlify
- Serverless functions for future features (e.g., sharing links)

---

## LLM / AI Features During Phase 1

During the Phase 1 web migration:

- The React web app **must not**:
  - Call FoundationModels, OpenAI, or any other LLM APIs.
  - Expose AI item generation, AI suggestions, or chat-like features in the UI.
- Apple Intelligence prototypes in the Swift app remain:
  - **Prototype-only**, behind debug flags and platform gating.
  - A reference for future AI design, not a feature to mirror now.

Any future AI/LLM integration on the web will be handled as a separate project once the core React migration is stable and complete.

---

## Technology Stack (React Native)

Phase 2 and beyond will reuse the same TypeScript core and most UI/state, but deploy via React Native:

### Core Framework

- **React Native (0.80+ recommended)**: Native components for iOS/iPadOS/tvOS and Android
- **Expo**: Unified tooling for iOS/Android/Web builds, OTA updates, and EAS services
- **expo-router** or **React Navigation**: File-based or declarative navigation

### State Management

- **Redux Toolkit + React Redux**: Same slices as web (`packages/state`)
- Platform-specific slices only where necessary (e.g., hardware-remote input, offline sync)

### Navigation & Focus

- **React Navigation** (stack/tabs/drawer) for mobile-style flows
- **TV focus utilities** (e.g., `react-tv-space-navigation` or equivalent) for tvOS remote navigation
- Platform-specific route guards and focus rules to approximate existing tvOS UX

### Styling

- **Platform-aware styling** using React Native’s `StyleSheet` plus design tokens from `packages/theme`
- Optional Tailwind-style utilities (e.g., `nativewind` or `react-native-tailwindcss`) if they prove ergonomic

### Native Integrations

- **Media & filesystem:** React Native community modules (camera, image picker, filesystem) plus Expo SDK where appropriate
- **Analytics & crash reporting:** Shared configuration across platforms
- **Apple Intelligence / AI features:** Reimagined as either:
  - React Native modules that call native FoundationModels APIs (if kept client-side), or
  - Backend-powered AI (OpenAI, etc.) with a cross-platform HTTP API

### Testing

- **Unit:** Jest + React Native Testing Library
- **E2E:** Detox or Playwright for web + mobile where feasible
- **Performance:** RN profiler, Flipper, and platform tools (Xcode Instruments, Android Studio)

The React Native stack is intentionally aligned with the web stack (Redux, React Testing Library patterns, Playwright where possible) to minimize cognitive overhead during and after the migration.

---

## Data Interchange Format

### Shared JSON Schema (Project v1)

Both Swift and TypeScript will adhere to the `Project` schema defined in `TierlistProject.swift`:

```json
{
  "schemaVersion": 1,
  "projectId": "uuid-v4",
  "title": "My Tier List",
  "tiers": [
    {
      "id": "S",
      "label": "S Tier",
      "color": "#FF6B6B",
      "order": 0,
      "itemIds": ["item-1", "item-2"]
    }
  ],
  "items": {
    "item-1": {
      "id": "item-1",
      "title": "Iron Man",
      "media": [
        {
          "id": "media-1",
          "kind": "image",
          "uri": "file://local/ironman.jpg",
          "mime": "image/jpeg"
        }
      ]
    }
  },
  "audit": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-02T00:00:00Z"
  }
}
```

**Validation:**

- Swift uses `Project` Codable + `ProjectValidation.validateOfflineV1()`
- TypeScript uses Zod or JSON Schema validator
- **Critical:** Both must reject invalid schemas to prevent data corruption

**Image Handling:**

- **Native:** `file://` URIs to local filesystem
- **Web:** Data URLs (`data:image/png;base64,...`) or IndexedDB blob references
- **Export/Import:** Convert between formats as needed

---

## Testing Strategy

### Unit Tests (Logic Parity)

**Goal:** Ensure TypeScript port matches Swift behavior exactly

**Approach:**

1. Port all TiercadeCore tests:
   - `TierLogicTests.swift` → `tierLogic.test.ts`
   - `HeadToHeadLogicTests.swift` → `headToHead.test.ts`
   - `SortingTests.swift` → `sorting.test.ts`

2. Use same test data (e.g., export Swift test fixtures as JSON)

3. **Acceptance Criteria:**
   - All ported tests pass
   - Same outputs for same inputs (deterministic RNG seed)

**Example:**

```typescript
// tierLogic.test.ts
import { TierLogic } from '../core/tierLogic';

describe('TierLogic.moveItem', () => {
  it('moves item from S to A tier', () => {
    const tiers = {
      S: [{ id: 'iron-man', name: 'Iron Man' }],
      A: [],
      unranked: []
    };

    const result = TierLogic.moveItem(tiers, 'iron-man', 'A');

    expect(result.S).toHaveLength(0);
    expect(result.A).toHaveLength(1);
    expect(result.A[0].id).toBe('iron-man');
  });

  // ... 20+ more tests from TierLogicTests.swift
});
```

### Integration Tests (UI Flows)

**Goal:** Validate end-to-end user workflows

**Tool:** Playwright (can test desktop + mobile viewports)

**Critical Flows:**

1. **Create Tier List:**
   - Click "New Tier List" → Enter name → Verify empty board

2. **Drag & Drop:**
   - Drag item from unranked → tier → Verify placement
   - Undo → Verify item back in unranked

3. **Head-to-Head:**
   - Click H2H button → Vote on pairs → Apply → Verify tier assignments match expected distribution

4. **Import/Export:**
   - Export as JSON → Reload page → Import → Verify data intact

5. **Theme Application:**
   - Open theme library → Apply theme → Verify colors changed

### Cross-Platform Data Tests

**Goal:** Ensure native ↔ web compatibility

**Tests:**

1. Export tier list from Swift app (JSON)
2. Import into web app
3. Modify in web (add item, reorder)
4. Export from web
5. Import back into Swift app
6. Verify no data loss or corruption

---

## Deployment & Distribution

### Web App Hosting

**Platform:** Vercel (recommended)

**Reasoning:**
- Zero-config Next.js support (if we later add SSR)
- Global CDN
- Automatic HTTPS
- Preview deployments for PRs

**URL Structure:**
- Production: `https://tiercade.app`
- Staging: `https://staging.tiercade.app`

### Native App Distribution (Unchanged)

- tvOS: App Store
- iOS/iPadOS: App Store
- macOS: App Store or DMG

### Cross-Promotion

- Add "Open in Web" link in native apps
- Add "Download Native App" banner in web app
- Share links work across platforms (detect device, redirect appropriately)

---

## Future Evolution Path

### Near-Term Enhancements (Post-Launch)

1. **Cloud Sync** (Optional Premium Feature)
   - Backend: Supabase or Firebase
   - Sync tier lists across devices (native + web)
   - Conflict resolution strategy

2. **Collaborative Editing**
   - Real-time multi-user editing (Yjs or ShareDB)
   - Share link → invite friends → rank together

3. **AI Integration (Web)**
   - Since web can't use FoundationModels, integrate OpenAI API
   - Generate tier list ideas, suggest items, auto-rank

### Long-Term Options

**Option A: Complete and Maintain React-First Stack**

- Finish React Native rollout for iOS/iPadOS/tvOS and (optionally) Android.
- Treat the React/TypeScript monorepo as the single source of truth.
- Use web + desktop wrapper (Electron/Tauri or React Native macOS) as the primary desktop experience.

**Option B: Hybrid Pause Point**

- Stop after Phase 1 (web) and keep SwiftUI native apps running in parallel longer-term.
- Continue to share data and logic (via JSON + TypeScript core), but accept two UI stacks.
- Revisit Phase 2/3 only if React web adoption justifies the extra investment.

**Option C: Server-Rendered Web (Next.js or Equivalent)**

- Add SSR/SSG for SEO and social sharing.
- Generate OG images for public tier lists server-side.
- Build public tier list hosting/discovery on top of the React web app.

---

## Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| HeadToHead algorithm port bugs | Medium | High | Extensive unit tests vs Swift, statistical validation |
| Performance (large tier lists) | Low | Medium | Virtualization (react-window), lazy loading |
| Browser compatibility | Low | Low | Playwright cross-browser CI, transpilation |
| Data corruption (import/export) | Low | Critical | Schema validation, round-trip tests |

### Process Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Scope creep | Medium | Medium | Strict phase gates, MVP-first |
| Divergence (native vs web) | High | Medium | Shared JSON schema, integration tests |
| Maintenance burden | Medium | Medium | Automated tests, shared logic reduces duplication |

---

## Success Metrics

### Launch Criteria (Phase 5 Complete)

- [ ] 100% of core features working (tier editing, H2H, themes, import/export)
- [ ] All unit tests passing (logic parity with Swift)
- [ ] E2E tests covering 5 critical flows
- [ ] Lighthouse score: 90+ (Performance, Accessibility, Best Practices)
- [ ] Works on Chrome, Firefox, Safari (latest 2 versions)
- [ ] Mobile responsive (tested on iPad, iPhone simulators)

### Post-Launch KPIs (3 months)

- **Usage:** 1,000+ web sessions (indicates demand)
- **Engagement:** Avg. 10+ min session time (users creating tier lists)
- **Retention:** 30% return rate (saving/loading tier lists)
- **Quality:** <1% error rate (Sentry tracking)
- **Compatibility:** 95%+ import success rate (native → web)

---

## Conclusion

The **phased full React rewrite** is now the chosen direction for Tiercade:

1. **Phase 1** delivers a feature-complete React/TypeScript web app with behavior validated against the existing Swift implementation.
2. **Phase 2+** extend that React foundation to React Native clients for iOS/iPadOS/tvOS (and optionally Android and desktop), reusing the same models, algorithms, and state management.

This approach:

- Provides a **concrete, low-risk first milestone** (web) while keeping the larger rewrite in view.
- Maximizes **logic and state reuse** through shared TypeScript packages.
- Accepts that some Apple-specific features (Liquid Glass, parts of tvOS focus, FoundationModels integration) will need **new designs or approximations** in React, rather than being preserved 1:1.

Once full parity and quality targets are met across web and React Native clients, the SwiftUI codebase can be safely retired, leaving Tiercade with a unified React stack and a clearer long-term path.

---

## Appendices

### Appendix A: TypeScript Port Examples

See:
- `docs/migration/typescript-models-example.ts` (data types)
- `docs/migration/typescript-logic-example.ts` (business logic)

### Appendix B: Dependencies Comparison

| Category | Swift (Native) | TypeScript (Web) |
|----------|---------------|------------------|
| **UI** | SwiftUI | React 18 |
| **State** | @Observable | Redux Toolkit |
| **DnD** | Native gestures | DnD Kit |
| **Persistence** | UserDefaults | IndexedDB (Dexie) |
| **Testing** | Swift Testing | Jest + Playwright |
| **Build** | Xcode / SPM | Vite |

### Appendix C: Glossary

- **TiercadeCore:** Pure Swift package with business logic (models, algorithms)
- **Head-to-Head:** Pairwise comparison ranking mode (e.g., "Which is better: A or B?")
- **Liquid Glass:** tvOS 26 visual effect (`.glassEffect()`) for translucent UI chrome
- **DnD Kit:** Modern React drag-and-drop library (replaces deprecated react-beautiful-dnd)
- **Redux Toolkit:** Official recommended way to write Redux (less boilerplate)
