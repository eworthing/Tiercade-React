## LLM / AI Feature Freeze During React Migration

This document records the temporary freeze on LLM-powered features during the React/TypeScript migration so that agents avoid reintroducing or extending AI behavior until explicitly re-enabled.

---

## Scope of the Freeze

**What is frozen**

- All **Apple Intelligence / FoundationModels-based features**:
  - AI item generation overlays.
  - Prompt testing and chat-style interactions.
  - Any code paths that invoke FoundationModels, OpenAI, or other LLM APIs.
- Any new **LLM integrations in React** (web or React Native):
  - No “AI ranker”, “AI suggestions”, or “AI chat” features in the React apps during Phase 1 and early Phase 2.
  - No network calls to LLM providers from React code (browser or React Native).

**What remains**

- All **non-AI functionality**:
  - Tier editing, HeadToHead, analytics, themes, import/export, etc.
- Existing Apple Intelligence prototype code in Swift:
  - Kept in the repo, but treated as **disabled and experimental only**.
  - Not wired into any new React UI and not expanded during migration.

---

## Rationale

- The React migration is already high-risk and multi-phase:
  - Porting TiercadeCore logic to TypeScript.
  - Rebuilding the UI on React web and React Native.
  - Rebuilding tvOS focus behavior on a new stack.
- Adding or expanding LLM features at the same time would:
  - Increase surface area for bugs and regressions.
  - Blur the boundary between “lift and shift” vs. “new feature work”.
  - Complicate testing and data privacy review.

By freezing LLM features during the migration, we can:

- Keep the migration focused on **behavioral parity** for core tiering features.
- Defer AI product decisions until the React stack is stable and well-understood.

---

## Agent Instructions

When working in this repo during the React migration:

- Do **not**:
  - Add new LLM calls in React (web or React Native).
  - Move or clone Apple Intelligence prototype logic into React packages or apps.
  - Add UI entry points (buttons, menus, routes) that expose AI generation in React.
- Do:
  - Preserve and, if necessary, **simplify** existing Swift AI code paths so they remain behind debug flags and platform gating.
  - Update documentation to reflect that AI features are **temporarily disabled** or **prototype-only**.
  - Focus on tests, diagnostics, and data contracts for non-AI flows.

If in doubt:

- Default to **not touching AI code paths**.
- Leave clear comments in planning docs and PR descriptions when you must adjust AI code to unblock migration work.

---

## Representation in Planning Documents

All migration plans and specs should follow these rules:

- `TIERCADE_REACT_MIGRATION_PLAN.md`:
  - Must state that Phase 1 web will ship **without AI/LLM features**.
  - Any “future AI integration” is explicitly post-migration and uses a separate design.
- `TIERCADE_REACT_NATIVE_MIGRATION_PLAN.md` (when present):
  - Must treat AI/LLM as an **optional, after-parity** phase for React Native apps.
  - Must not assume FoundationModels integration is available or necessary on every platform.
- `WEB_APP_UI_SPEC.md`:
  - Must not include AI overlays or AI actions in the MVP UI.

If you update or create additional planning docs, include a short note along the lines of:

> “LLM/AI features are temporarily frozen during the React migration and must not be implemented or expanded in this phase.”

---

## Re-Enablement (Future)

Re-enabling AI/LLM features will be handled as a **separate project** with its own design and risk review:

- New cross-platform AI architecture (likely server-side) that:
  - Avoids platform-specific API lock-in where possible.
  - Respects privacy, rate limits, and cost controls.
- Updated UX specs for AI on:
  - Web (React).
  - React Native clients (mobile/tvOS).
  - Any remaining native Swift surfaces (if still supported).

Until such a project is explicitly started and documented, treat AI/LLM behavior as **frozen** and outside the scope of the React migration.

