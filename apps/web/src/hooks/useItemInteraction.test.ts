/**
 * useItemInteraction — Interface-level tests.
 *
 * Tests that each handler fires the expected Redux actions via dispatch.
 * Pattern mirrors useTierFilter.test.ts: renderHook + a real (minimal) store.
 */
import { renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import React from "react";
import { Provider } from "react-redux";
import { tierSlice, undoRedoSlice } from "@tiercade/state";
import { useItemInteraction } from "./useItemInteraction";
import type { FileDropResult } from "@tiercade/ui";

// ── Store factory ────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({
    reducer: {
      tier: tierSlice.reducer,
      undoRedo: undoRedoSlice.reducer,
    },
  });
}

type TestStore = ReturnType<typeof makeStore>;

function wrapper(store: TestStore): React.FC<{ children: React.ReactNode }> {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(Provider, { store }, children);
  return Wrapper;
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const IMAGE_FILE: FileDropResult = {
  fileName: "hero.png",
  dataUrl: "data:image/png;base64,ABC",
  mediaType: "image",
};

const VIDEO_FILE: FileDropResult = {
  fileName: "clip.mp4",
  dataUrl: "data:video/mp4;base64,XYZ",
  mediaType: "video",
};

const AUDIO_FILE: FileDropResult = {
  fileName: "song.mp3",
  dataUrl: "data:audio/mp3;base64,MNO",
  mediaType: "audio",
};

// ── onItemClick ───────────────────────────────────────────────────────────────

describe("useItemInteraction — onItemClick", () => {
  it("dispatches toggleSelection with the item id", () => {
    const store = makeStore();
    const { result } = renderHook(
      () => useItemInteraction(store.dispatch),
      { wrapper: wrapper(store) }
    );

    result.current.onItemClick({ id: "item-1", name: "Alpha" });

    const state = store.getState().tier;
    // After toggleSelection, item-1 should appear in selection
    expect(state.selection).toContain("item-1");
  });

  it("toggles selection off on second click", () => {
    const store = makeStore();
    const { result } = renderHook(
      () => useItemInteraction(store.dispatch),
      { wrapper: wrapper(store) }
    );

    result.current.onItemClick({ id: "item-2", name: "Beta" });
    result.current.onItemClick({ id: "item-2", name: "Beta" });

    const state = store.getState().tier;
    expect(state.selection).not.toContain("item-2");
  });
});

// ── onFileDrop ────────────────────────────────────────────────────────────────

describe("useItemInteraction — onFileDrop", () => {
  it("adds an image item to the target tier", () => {
    const store = makeStore();
    const { result } = renderHook(
      () => useItemInteraction(store.dispatch),
      { wrapper: wrapper(store) }
    );

    result.current.onFileDrop("S", IMAGE_FILE);

    const tierItems = store.getState().tier.tiers["S"] ?? [];
    expect(tierItems.length).toBeGreaterThan(0);
    const added = tierItems[tierItems.length - 1];
    expect(added.name).toBe("hero.png");
    expect(added.media?.type).toBe("image");
    expect(added.media?.url).toBe(IMAGE_FILE.dataUrl);
  });

  it("sets video media (not image) for video drops", () => {
    const store = makeStore();
    const { result } = renderHook(
      () => useItemInteraction(store.dispatch),
      { wrapper: wrapper(store) }
    );

    result.current.onFileDrop("A", VIDEO_FILE);

    const tierItems = store.getState().tier.tiers["A"] ?? [];
    const added = tierItems[tierItems.length - 1];
    expect(added.media?.type).toBe("video");
    expect(added.media?.url).toBe(VIDEO_FILE.dataUrl);
  });

  it("sets audio media (not image) for audio drops", () => {
    const store = makeStore();
    const { result } = renderHook(
      () => useItemInteraction(store.dispatch),
      { wrapper: wrapper(store) }
    );

    result.current.onFileDrop("B", AUDIO_FILE);

    const tierItems = store.getState().tier.tiers["B"] ?? [];
    const added = tierItems[tierItems.length - 1];
    expect(added.media?.type).toBe("audio");
    expect(added.media?.url).toBe(AUDIO_FILE.dataUrl);
  });
});

// ── onItemMediaDrop ───────────────────────────────────────────────────────────

describe("useItemInteraction — onItemMediaDrop", () => {
  it("updates image media on existing item with image file", () => {
    const store = makeStore();
    // Seed a known item in the S tier
    store.dispatch(
      tierSlice.actions.addItemToTier({
        item: { id: "existing-1", name: "Seeded" },
        tierName: "S",
      })
    );

    const { result } = renderHook(
      () => useItemInteraction(store.dispatch),
      { wrapper: wrapper(store) }
    );

    result.current.onItemMediaDrop("existing-1", IMAGE_FILE);

    const tierItems = store.getState().tier.tiers["S"] ?? [];
    const updated = tierItems.find((i) => i.id === "existing-1");
    expect(updated?.media?.type).toBe("image");
    expect(updated?.media?.url).toBe(IMAGE_FILE.dataUrl);
  });

  it("updates video media on existing item with video file", () => {
    const store = makeStore();
    store.dispatch(
      tierSlice.actions.addItemToTier({
        item: { id: "existing-2", name: "VideoItem" },
        tierName: "S",
      })
    );

    const { result } = renderHook(
      () => useItemInteraction(store.dispatch),
      { wrapper: wrapper(store) }
    );

    result.current.onItemMediaDrop("existing-2", VIDEO_FILE);

    const tierItems = store.getState().tier.tiers["S"] ?? [];
    const updated = tierItems.find((i) => i.id === "existing-2");
    expect(updated?.media?.type).toBe("video");
    expect(updated?.media?.url).toBe(VIDEO_FILE.dataUrl);
  });
});
