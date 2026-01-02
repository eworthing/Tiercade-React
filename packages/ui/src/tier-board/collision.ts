import {
    rectIntersection,
    closestCenter,
    type CollisionDetection,
    type DroppableContainer,
    getFirstCollision,
} from "@dnd-kit/core";

/**
 * Custom collision detection strategy for Tier Lists.
 *
 * Research-backed behavior:
 * 1. Prioritize finding the Tier Row container first (using rectIntersection).
 *    This ensures we know WHICH tier the user is targeting, even if over an empty space.
 * 2. If inside a Tier, finding the closest item using closestCenter.
 * 3. Crucially, restricts item collision to ONLY items within the detected tier.
 *    This prevents "jumping" to items in adjacent tiers.
 *
 * @param args Collision detection arguments
 */
export const tierListCollisionResult: CollisionDetection = (args) => {
    const { droppableContainers, active } = args;

    // 1. First, find which Tier Row we are over
    // We distinguish Tier Rows from Items by checking data:
    // Tier Rows have data.tierId but NO data.item
    // Items have data.item (and data.tierId)
    const tierContainers = droppableContainers.filter((container) => {
        const data = container.data.current;
        return data && data.tierId && !data.item;
    });

    // Use rectIntersection (area overlap) for finding the target tier
    const tierCollisions = rectIntersection({
        ...args,
        droppableContainers: tierContainers,
    });

    const firstTierCollision = getFirstCollision(tierCollisions, "id");

    // If we are over a tier...
    if (firstTierCollision) {
        // Determine the actual tierId from the collision
        // Since we filtered for tiers, the detected container IS the tier row
        // The container ID is typically the tierId itself (e.g. "S", "A")
        // BUT we should grab it from the collision result to be sure
        const tierContainer = tierContainers.find(c => c.id === firstTierCollision);
        const targetTierId = tierContainer?.data.current?.tierId;

        if (!targetTierId) return tierCollisions;

        // 2. Filter droppables to only include items belonging to THIS tier
        const itemsInThisTier = droppableContainers.filter((container) => {
            const data = container.data.current;
            // Must be an item (has data.item) AND belong to this tier
            return data && data.item && data.tierId === targetTierId;
        });

        // 3. Find closest item within this tier
        if (itemsInThisTier.length > 0) {
            // Improvements: Only consider items that actually intersect with the pointer/rect
            // This prevents "magnetic" behavior where an item far away is picked even when hovering empty space
            const intersectingItems = rectIntersection({
                ...args,
                droppableContainers: itemsInThisTier,
            });

            if (intersectingItems.length > 0) {
                // If we intersect multiple items, pick the closest center among them
                const closest = closestCenter({
                    ...args,
                    droppableContainers: itemsInThisTier.filter(c => intersectingItems.some(i => i.id === c.id))
                });

                if (closest.length > 0) {
                    return closest;
                }
                return intersectingItems;
            }
        }

        // If no item collision (e.g. hovering empty space in local tier), return the tier itself
        return tierCollisions;
    }

    // Fallback: If not over any tier, verify if we are over any item directly (edge case)
    // Logic: Only items that are NOT tier containers
    return closestCenter({
        ...args,
        droppableContainers: droppableContainers.filter((c) => {
            const data = c.data.current;
            return data && data.item;
        }),
    });
};
