import { tierListCollisionResult } from "../src/tier-board/collision";
import { CollisionDetection, DroppableContainer } from "@dnd-kit/core";

// Mock helper
const createMockContainer = (id: string, data: any = {}, rect: any = {}): DroppableContainer => ({
    id,
    key: id, // key is required
    data: { current: data },
    rect: { current: { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100, ...rect } } as any,
    disabled: false,
    node: { current: document.createElement("div") },
});

const createMockActive = (id: string): any => ({
    id,
    data: { current: {} },
    rect: { current: { initial: null, translated: null } },
    node: { current: document.createElement("div") },
});

describe("tierListCollisionResult", () => {
    const mockTierS = createMockContainer("tier-S", { tierId: "S" }, { top: 0, bottom: 100 });
    const mockTierA = createMockContainer("tier-A", { tierId: "A" }, { top: 100, bottom: 200 });

    const mockItemS1 = createMockContainer("item-1", { tierId: "S", item: { id: "item-1" } }, { top: 10, left: 10, width: 50, height: 50 });
    const mockItemA1 = createMockContainer("item-2", { tierId: "A", item: { id: "item-2" } }, { top: 110, left: 10, width: 50, height: 50 });


    const droppableContainers = [mockTierS, mockTierA, mockItemS1, mockItemA1];

    // Populate droppableRects map which dnd-kit uses for collision detection
    const droppableRects = new Map();
    droppableContainers.forEach(c => {
        droppableRects.set(c.id, c.rect.current);
    });

    it("should detect the tier container when hovering over an empty part of the tier", () => {
        // Cursor over Tier S, but not over any specific item
        const collisions = tierListCollisionResult({
            active: createMockActive("active-item"),
            collisionRect: { top: 20, left: 80, bottom: 70, right: 130, width: 50, height: 50 } as any,
            droppableContainers,
            droppableRects,
            pointerCoordinates: { x: 105, y: 45 },
        });

        // Should return Tier S collision
        expect(collisions.length).toBeGreaterThan(0);
        expect(collisions[0].id).toBe("tier-S");
    });

    it("should detect items WITHIN the target tier", () => {
        // Cursor clearly over Tier S and Item S1
        const collisions = tierListCollisionResult({
            active: createMockActive("active-item"),
            collisionRect: { top: 10, left: 10, bottom: 60, right: 60, width: 50, height: 50 } as any,
            droppableContainers,
            droppableRects,
            pointerCoordinates: { x: 35, y: 35 },
        });

        // Should prioritize Item S1 because we are in Tier S and over Item S1
        // (closestCenter sorts by distance, so if we are close to S1, it should be top)
        expect(collisions.length).toBeGreaterThan(0);
        // Logic: 1. find tier -> S. 2. Filter items in S -> [Item S1]. 3. closestCenter on [Item S1].
        expect(collisions[0].id).toBe("item-1");
    });

    it("should NOT detect items in other tiers even if physically close", () => {
        // Cursor over Tier A (top edge), close to Item S1 from Tier S (bottom edge of S)
        // But physically inside Tier A rect.
        const collisions = tierListCollisionResult({
            active: createMockActive("active-item"),
            collisionRect: { top: 105, left: 10, bottom: 155, right: 60, width: 50, height: 50 } as any,
            droppableContainers,
            droppableRects,
            pointerCoordinates: { x: 35, y: 130 },
        });
        const collisionIds = collisions.map(c => c.id);
        // We are over Item 2 in Tier A, so we should detect Item 2 (valid) or Tier A
        // Crucially, we must NOT detect Item 1 (which is in Tier S)
        // Since we overlap Item 2, getting Item 2 is correct behavior
        expect(collisionIds).toContain("item-2");
        expect(collisionIds).not.toContain("item-1"); // Important!
    });
});
