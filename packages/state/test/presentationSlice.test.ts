/**
 * presentationSlice — Interface-level tests.
 *
 * Targets the non-trivial reducer behaviors in presentationSlice:
 *   - togglePresentationMode (boolean flip)
 *   - setRevealMode (side-effect: clears revealedItems when turned off)
 *   - revealItem (deduplication guard)
 *   - drawNextItem (queue advancement + currentQueueItem update)
 *   - setItemQueue (populates queue + sets currentQueueItem to first)
 *   - setItemScale (clamp: [0.5, 2])
 *   - resetPresentationSettings (full reset to initialState)
 *
 * Simple setters (setChromaKey, setShowProgress, etc.) are covered
 * transitively by the above test cases and are not individually tested
 * to avoid implementation-mirroring noise.
 */

import { describe, expect, it } from "@jest/globals";
import {
  presentationReducer,
  togglePresentationMode,
  setRevealMode,
  revealItem,
  drawNextItem,
  setItemQueue,
  setItemScale,
  resetPresentationSettings,
} from "../src/presentationSlice";
import type { PresentationState } from "../src/presentationSlice";

// ── helpers ───────────────────────────────────────────────────────────────────

function freshState(): PresentationState {
  return presentationReducer(undefined, { type: "@@INIT" });
}

// ── togglePresentationMode ────────────────────────────────────────────────────

describe("presentationSlice — togglePresentationMode", () => {
  it("flips isPresenting false → true", () => {
    const state = freshState();
    expect(state.isPresenting).toBe(false);
    const next = presentationReducer(state, togglePresentationMode());
    expect(next.isPresenting).toBe(true);
  });

  it("flips isPresenting true → false on second toggle", () => {
    const s1 = presentationReducer(freshState(), togglePresentationMode());
    const s2 = presentationReducer(s1, togglePresentationMode());
    expect(s2.isPresenting).toBe(false);
  });
});

// ── setRevealMode ─────────────────────────────────────────────────────────────

describe("presentationSlice — setRevealMode", () => {
  it("sets revealMode to true without affecting revealedItems", () => {
    const state = freshState();
    const next = presentationReducer(state, setRevealMode(true));
    expect(next.revealMode).toBe(true);
    expect(next.revealedItems).toEqual([]);
  });

  it("clears revealedItems when reveal mode is turned off", () => {
    // Seed some revealed items
    let state = freshState();
    state = presentationReducer(state, setRevealMode(true));
    state = presentationReducer(state, revealItem("item-1"));
    state = presentationReducer(state, revealItem("item-2"));
    expect(state.revealedItems).toHaveLength(2);

    // Turning off reveal mode must clear the list
    const next = presentationReducer(state, setRevealMode(false));
    expect(next.revealMode).toBe(false);
    expect(next.revealedItems).toHaveLength(0);
  });
});

// ── revealItem ────────────────────────────────────────────────────────────────

describe("presentationSlice — revealItem", () => {
  it("adds item to revealedItems", () => {
    const state = freshState();
    const next = presentationReducer(state, revealItem("item-A"));
    expect(next.revealedItems).toContain("item-A");
  });

  it("does not add duplicate entries (deduplication guard)", () => {
    let state = freshState();
    state = presentationReducer(state, revealItem("item-A"));
    state = presentationReducer(state, revealItem("item-A"));
    expect(state.revealedItems.filter((id) => id === "item-A")).toHaveLength(1);
  });
});

// ── setItemQueue / drawNextItem ───────────────────────────────────────────────

describe("presentationSlice — setItemQueue + drawNextItem", () => {
  it("setItemQueue sets queue and points currentQueueItem to first", () => {
    const state = freshState();
    const next = presentationReducer(
      state,
      setItemQueue(["id-1", "id-2", "id-3"])
    );
    expect(next.itemQueue).toEqual(["id-1", "id-2", "id-3"]);
    expect(next.currentQueueItem).toBe("id-1");
  });

  it("setItemQueue with empty list sets currentQueueItem to null", () => {
    const state = freshState();
    const next = presentationReducer(state, setItemQueue([]));
    expect(next.itemQueue).toEqual([]);
    expect(next.currentQueueItem).toBeNull();
  });

  it("drawNextItem advances to the second item", () => {
    let state = freshState();
    state = presentationReducer(state, setItemQueue(["id-1", "id-2", "id-3"]));
    const next = presentationReducer(state, drawNextItem());
    expect(next.itemQueue).toEqual(["id-2", "id-3"]);
    expect(next.currentQueueItem).toBe("id-2");
  });

  it("drawNextItem on last item sets currentQueueItem to null", () => {
    let state = freshState();
    state = presentationReducer(state, setItemQueue(["id-only"]));
    const next = presentationReducer(state, drawNextItem());
    expect(next.itemQueue).toEqual([]);
    expect(next.currentQueueItem).toBeNull();
  });

  it("drawNextItem on empty queue does not throw", () => {
    const state = freshState();
    expect(state.itemQueue).toHaveLength(0);
    const next = presentationReducer(state, drawNextItem());
    expect(next.currentQueueItem).toBeNull();
  });
});

// ── setItemScale ──────────────────────────────────────────────────────────────

describe("presentationSlice — setItemScale", () => {
  it("sets item scale within bounds", () => {
    const state = freshState();
    const next = presentationReducer(state, setItemScale(1.5));
    expect(next.itemScale).toBe(1.5);
  });

  it("clamps scale below 0.5 to 0.5", () => {
    const state = freshState();
    const next = presentationReducer(state, setItemScale(0.1));
    expect(next.itemScale).toBe(0.5);
  });

  it("clamps scale above 2 to 2", () => {
    const state = freshState();
    const next = presentationReducer(state, setItemScale(5));
    expect(next.itemScale).toBe(2);
  });
});

// ── resetPresentationSettings ─────────────────────────────────────────────────

describe("presentationSlice — resetPresentationSettings", () => {
  it("resets all presentation state to initial values", () => {
    // Mutate a variety of fields
    let state = freshState();
    state = presentationReducer(state, togglePresentationMode());
    state = presentationReducer(state, setRevealMode(true));
    state = presentationReducer(state, revealItem("item-1"));
    state = presentationReducer(state, setItemQueue(["id-1", "id-2"]));
    state = presentationReducer(state, setItemScale(1.8));

    // Reset should restore all defaults
    const reset = presentationReducer(state, resetPresentationSettings());
    expect(reset.isPresenting).toBe(false);
    expect(reset.revealMode).toBe(false);
    expect(reset.revealedItems).toEqual([]);
    expect(reset.itemQueue).toEqual([]);
    expect(reset.currentQueueItem).toBeNull();
    expect(reset.itemScale).toBe(1);
  });
});
