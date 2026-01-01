# TierBoard Advanced Features Guide

This guide covers the advanced drag-and-drop features implemented in TierBoard using dnd-kit v6+.

## Table of Contents

1. [Quick Wins Implemented](#quick-wins-implemented)
2. [Drag Monitoring](#drag-monitoring)
3. [Drop Validation](#drop-validation)
4. [Live Preview](#live-preview)
5. [Complete API Reference](#complete-api-reference)
6. [Usage Examples](#usage-examples)

---

## Quick Wins Implemented

### ✅ 1. Touch Sensor Configuration
**Better mobile experience** - Touch devices now have optimized activation constraints:

- **250ms delay** - Prevents conflicts with scrolling
- **5px tolerance** - Allows small movements during press-and-hold
- No more accidental drags while scrolling on mobile!

```typescript
// Automatically configured in TierBoard
useSensor(TouchSensor, {
  activationConstraint: {
    delay: 250,     // Press and hold 250ms
    tolerance: 5,   // Can move 5px during press
  },
})
```

### ✅ 2. Drag Handles
**Click text without dragging** - Each card now has a dedicated drag handle (⋮⋮ icon):

- Only the handle triggers drag operations
- Users can select/click card text freely
- Better keyboard accessibility
- Clear visual indicator of draggable area

```typescript
// Visible on the left side of each card
<button className="drag-handle" aria-label="Drag item">
  ⋮⋮
</button>
```

### ✅ 3. Movement Modifiers
**Keeps overlay visible** - Drag overlay stays within window bounds:

```typescript
// Automatically applied to DragOverlay
modifiers={[restrictToWindowEdges]}
```

### ✅ 4. Auto-Scroll Tuning
**Smoother edge scrolling** - Optimized auto-scroll for better UX:

- Triggers at 20% from edge
- 10x acceleration for responsive scrolling
- 5ms update interval

```typescript
autoScroll={{
  threshold: { x: 0.2, y: 0.2 },
  acceleration: 10,
  interval: 5,
}}
```

---

## Drag Monitoring

Track drag events for analytics, global state, or undo/redo functionality.

### Callbacks

#### `onDragStart`
Called when a drag operation begins.

```typescript
interface TierBoardProps {
  onDragStart?: (itemId: string, tierId: string) => void;
}
```

**Use cases:**
- Show global "Dragging X..." indicator
- Track analytics (which items are moved most)
- Prepare undo state
- Disable other UI during drag

**Example:**
```typescript
<TierBoard
  {...otherProps}
  onDragStart={(itemId, tierId) => {
    console.log(`Started dragging ${itemId} from ${tierId}`);
    setDragStatus(`Moving "${itemId}"...`);
  }}
/>
```

#### `onDragComplete`
Called when a drag successfully completes (item was moved).

```typescript
interface TierBoardProps {
  onDragComplete?: (itemId: string, fromTier: string, toTier: string) => void;
}
```

**Use cases:**
- Track successful moves for analytics
- Save to undo history
- Update external state
- Trigger side effects (API calls, notifications)

**Example:**
```typescript
<TierBoard
  {...otherProps}
  onDragComplete={(itemId, fromTier, toTier) => {
    console.log(`Moved ${itemId}: ${fromTier} → ${toTier}`);
    saveToUndoHistory({ itemId, fromTier, toTier });
    trackAnalyticsEvent('tier_move', { fromTier, toTier });
  }}
/>
```

#### `onDragCancel`
Called when a drag is cancelled (Escape key, dropped outside, or validation failed).

```typescript
interface TierBoardProps {
  onDragCancel?: (itemId: string) => void;
}
```

**Use cases:**
- Track cancelled drags
- Clear drag indicators
- Reset temporary state

**Example:**
```typescript
<TierBoard
  {...otherProps}
  onDragCancel={(itemId) => {
    console.log(`Cancelled dragging ${itemId}`);
    setDragStatus("");
  }}
/>
```

---

## Drop Validation

Prevent invalid moves with custom business logic.

### `validateDrop`

```typescript
interface TierBoardProps {
  validateDrop?: (
    itemId: string,
    fromTier: string,
    toTier: string
  ) => {
    allowed: boolean;
    reason?: string;
  };
}
```

**How it works:**
1. User attempts to drop item
2. `validateDrop` is called before the move
3. If `allowed: false`, the drop is cancelled
4. `onDragCancel` is called instead of `onDragComplete`
5. Parent can show error message using `reason`

### Validation Examples

#### Tier Size Limits
```typescript
const validateDrop = (itemId, fromTier, toTier) => {
  // S-tier can only have 5 items
  if (toTier === 'S' && tiers.S.length >= 5) {
    return {
      allowed: false,
      reason: 'S-tier is full (max 5 items)'
    };
  }

  return { allowed: true };
};
```

#### Prevent Empty Tiers
```typescript
const validateDrop = (itemId, fromTier, toTier) => {
  // Can't move last item to unranked
  if (toTier === 'unranked' && tiers[fromTier].length === 1) {
    return {
      allowed: false,
      reason: "Can't leave tier empty"
    };
  }

  return { allowed: true };
};
```

#### Item-Specific Rules
```typescript
const validateDrop = (itemId, fromTier, toTier) => {
  const item = findItemById(itemId);

  // "Elite" items can only go in S or A tier
  if (item.name.includes('Elite') && !['S', 'A'].includes(toTier)) {
    return {
      allowed: false,
      reason: 'Elite items must be in S or A tier'
    };
  }

  return { allowed: true };
};
```

#### Show Validation Errors
```typescript
const [errorMessage, setErrorMessage] = useState("");

const validateDrop = (itemId, fromTier, toTier) => {
  const validation = myValidationLogic(itemId, fromTier, toTier);

  if (!validation.allowed) {
    setErrorMessage(validation.reason || "Invalid move");
    setTimeout(() => setErrorMessage(""), 3000); // Clear after 3s
  }

  return validation;
};

return (
  <>
    {errorMessage && (
      <div className="error-toast">{errorMessage}</div>
    )}
    <TierBoard validateDrop={validateDrop} {...props} />
  </>
);
```

---

## Live Preview

Visual feedback showing where an item will land during drag.

### How It Works

The `onDragOver` callback internally updates preview state, which highlights the target tier in real-time:

- **Blue ring** appears around target tier
- **Enhanced border** shows drop zone
- **Smooth animations** during hover transitions

### Preview Visual Indicators

When hovering over a tier during drag:
- `border-blue-500` - Blue border
- `ring-2 ring-blue-400/50` - Glowing ring effect
- `scale-[1.01]` - Slight scale-up
- `shadow-lg` - Enhanced shadow

No additional code needed - it's built into TierBoard!

### Custom Preview Indicators (Optional)

If you want to show additional preview info:

```typescript
const [previewInfo, setPreviewInfo] = useState<string | null>(null);

const handleDragStart = (itemId, tierId) => {
  const item = findItemById(itemId);
  setPreviewInfo(`Moving: ${item.name}`);
};

const handleDragComplete = () => {
  setPreviewInfo(null);
};

return (
  <>
    {previewInfo && (
      <div className="preview-banner">
        {previewInfo}
      </div>
    )}
    <TierBoard
      onDragStart={handleDragStart}
      onDragComplete={handleDragComplete}
      {...props}
    />
  </>
);
```

---

## Complete API Reference

### TierBoardProps (Updated)

```typescript
export interface TierBoardProps {
  // Core props (existing)
  tiers: Items;
  tierOrder: string[];
  onMoveItem?: (itemId: string, targetTierName: string) => void;
  tierColors?: Record<string, string>;
  tierLabels?: Record<string, string>;
  cardOrientation?: "portrait" | "landscape";

  // NEW: Monitoring callbacks
  /** Called when drag starts - useful for analytics/global state */
  onDragStart?: (itemId: string, tierId: string) => void;

  /** Called when drag completes - useful for analytics/undo tracking */
  onDragComplete?: (itemId: string, fromTier: string, toTier: string) => void;

  /** Called when drag is cancelled */
  onDragCancel?: (itemId: string) => void;

  // NEW: Validation
  /**
   * Validation function to prevent invalid drops
   * Return { allowed: false, reason: "..." } to cancel the drop
   */
  validateDrop?: (
    itemId: string,
    fromTier: string,
    toTier: string
  ) => {
    allowed: boolean;
    reason?: string;
  };
}
```

---

## Usage Examples

See complete working examples in [`TierBoard.example.tsx`](./TierBoard.example.tsx):

1. **BasicMonitoringExample** - Track drag events and show live status
2. **ValidationExample** - Enforce tier limits and item rules
3. **AnalyticsExample** - Full analytics with undo/redo
4. **PreviewExample** - Real-time drag indicators

### Quick Example: Complete Implementation

```typescript
import { TierBoard } from "@tiercade/ui";
import { useState } from "react";

function MyTierList() {
  const [tiers, setTiers] = useState({
    S: [{ id: "1", attributes: { name: "Best Item" } }],
    A: [],
    B: [],
    unranked: [],
  });

  const [status, setStatus] = useState("");

  const handleMove = (itemId: string, targetTier: string) => {
    setTiers((prev) => {
      // Move item logic
      const newTiers = { ...prev };
      // ... find and move item ...
      return newTiers;
    });
  };

  const validateDrop = (itemId, fromTier, toTier) => {
    // S-tier max 3 items
    if (toTier === "S" && tiers.S.length >= 3) {
      return { allowed: false, reason: "S-tier is full" };
    }
    return { allowed: true };
  };

  return (
    <div>
      <div className="status-bar">{status}</div>

      <TierBoard
        tiers={tiers}
        tierOrder={["S", "A", "B"]}
        onMoveItem={handleMove}
        onDragStart={(item, tier) => setStatus(`Dragging ${item}...`)}
        onDragComplete={(item, from, to) => setStatus(`Moved to ${to}!`)}
        onDragCancel={() => setStatus("Cancelled")}
        validateDrop={validateDrop}
      />
    </div>
  );
}
```

---

## Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| **Touch devices** | Accidental drags while scrolling | 250ms delay prevents conflicts |
| **Card interaction** | Entire card draggable | Dedicated handle, can click text |
| **Drag feedback** | Basic overlay | Window-edge restriction + preview |
| **Scrolling** | Basic auto-scroll | Optimized thresholds & acceleration |
| **Monitoring** | No callbacks | onDragStart/Complete/Cancel |
| **Validation** | No validation | validateDrop with error messages |
| **Preview** | Static highlight | Real-time tier highlighting |

---

## Performance Notes

- **Callbacks are optional** - Only use what you need
- **Validation is lightweight** - Called once per drop attempt
- **Preview state is memoized** - No unnecessary re-renders
- **Touch sensor** - No impact on desktop performance

---

## Migration Guide

### From Basic TierBoard

```typescript
// Before
<TierBoard
  tiers={tiers}
  tierOrder={tierOrder}
  onMoveItem={handleMove}
/>

// After (backward compatible!)
<TierBoard
  tiers={tiers}
  tierOrder={tierOrder}
  onMoveItem={handleMove}
  // NEW: Add callbacks as needed
  onDragStart={trackDragStart}
  validateDrop={enforceRules}
/>
```

All new props are **optional** - existing code works without changes!

---

## Browser Support

- **Desktop:** All modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile:** iOS Safari 12+, Chrome Android 80+
- **Touch:** Full support with optimized activation constraints
- **Keyboard:** Arrow keys + Enter/Space for accessibility

---

## Next Steps

1. **Try the examples** - See [`TierBoard.example.tsx`](./TierBoard.example.tsx)
2. **Add monitoring** - Track analytics with `onDragComplete`
3. **Add validation** - Enforce business rules with `validateDrop`
4. **Test on mobile** - Try the touch improvements on real devices

---

## Questions?

- Check the examples in `TierBoard.example.tsx`
- Read the dnd-kit docs: https://docs.dndkit.com
- See Context7 library docs via MCP tools
