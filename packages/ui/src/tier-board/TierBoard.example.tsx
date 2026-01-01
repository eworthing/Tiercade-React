/**
 * TierBoard Advanced Features - Usage Examples
 *
 * This file demonstrates how to use the new drag monitoring,
 * validation, and preview features in TierBoard.
 */

import React, { useState } from "react";
import { TierBoard } from "./TierBoard";
import type { Items } from "@tiercade/core";

// ============================================================================
// Example 1: Basic Usage with Drag Monitoring
// ============================================================================

export function BasicMonitoringExample() {
  const [tiers, setTiers] = useState<Items>({
    S: [
      { id: "1", attributes: { name: "Amazing Item" } },
      { id: "2", attributes: { name: "Best Item" } },
    ],
    A: [{ id: "3", attributes: { name: "Great Item" } }],
    B: [],
    unranked: [{ id: "4", attributes: { name: "Unranked Item" } }],
  });

  const [dragStatus, setDragStatus] = useState<string>("");
  const [dragHistory, setDragHistory] = useState<string[]>([]);

  const handleDragStart = (itemId: string, tierId: string) => {
    setDragStatus(`Dragging "${itemId}" from ${tierId}`);
    console.log("Drag started:", { itemId, tierId });
  };

  const handleDragComplete = (itemId: string, fromTier: string, toTier: string) => {
    const message = `Moved "${itemId}" from ${fromTier} → ${toTier}`;
    setDragStatus(message);
    setDragHistory((prev) => [message, ...prev.slice(0, 9)]); // Keep last 10
    console.log("Drag completed:", { itemId, fromTier, toTier });
  };

  const handleDragCancel = (itemId: string) => {
    setDragStatus(`Cancelled dragging "${itemId}"`);
    console.log("Drag cancelled:", itemId);
  };

  const handleMoveItem = (itemId: string, targetTier: string) => {
    setTiers((prev) => {
      // Find and remove item from source tier
      const newTiers = { ...prev };
      let sourceItem;
      for (const tier in newTiers) {
        const index = newTiers[tier].findIndex((item) => item.id === itemId);
        if (index !== -1) {
          sourceItem = newTiers[tier][index];
          newTiers[tier] = newTiers[tier].filter((item) => item.id !== itemId);
          break;
        }
      }

      // Add to target tier
      if (sourceItem) {
        newTiers[targetTier] = [...(newTiers[targetTier] || []), sourceItem];
      }

      return newTiers;
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Drag Status</h3>
        <p className="text-sm text-slate-300">{dragStatus || "No active drag"}</p>
      </div>

      <TierBoard
        tiers={tiers}
        tierOrder={["S", "A", "B"]}
        onMoveItem={handleMoveItem}
        onDragStart={handleDragStart}
        onDragComplete={handleDragComplete}
        onDragCancel={handleDragCancel}
      />

      <div className="p-4 bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
        <ul className="text-sm text-slate-300 space-y-1">
          {dragHistory.map((msg, i) => (
            <li key={i}>• {msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Example 2: Validation Rules with cancelDrop
// ============================================================================

export function ValidationExample() {
  const [tiers, setTiers] = useState<Items>({
    S: [{ id: "1", attributes: { name: "Elite Item" } }],
    A: [
      { id: "2", attributes: { name: "Good Item 1" } },
      { id: "3", attributes: { name: "Good Item 2" } },
    ],
    B: [],
    unranked: [{ id: "4", attributes: { name: "Unranked Item" } }],
  });

  const [validationMessage, setValidationMessage] = useState<string>("");

  const validateDrop = (itemId: string, fromTier: string, toTier: string) => {
    // Rule 1: S-tier can only have max 3 items
    if (toTier === "S" && (tiers.S?.length || 0) >= 3) {
      const reason = "S-tier is full (max 3 items)";
      setValidationMessage(`❌ ${reason}`);
      setTimeout(() => setValidationMessage(""), 3000);
      return { allowed: false, reason };
    }

    // Rule 2: Can't move last item out of a non-empty tier to unranked
    if (toTier === "unranked" && (tiers[fromTier]?.length || 0) === 1) {
      const reason = "Can't leave tier empty by moving to unranked";
      setValidationMessage(`❌ ${reason}`);
      setTimeout(() => setValidationMessage(""), 3000);
      return { allowed: false, reason };
    }

    // Rule 3: Items with "Elite" in the name can only go in S or A tier
    const item = Object.values(tiers)
      .flat()
      .find((i) => i.id === itemId);
    if (
      item?.attributes.name?.includes("Elite") &&
      !["S", "A"].includes(toTier)
    ) {
      const reason = "Elite items can only be placed in S or A tier";
      setValidationMessage(`❌ ${reason}`);
      setTimeout(() => setValidationMessage(""), 3000);
      return { allowed: false, reason };
    }

    setValidationMessage(`✅ Moving "${itemId}" to ${toTier}`);
    setTimeout(() => setValidationMessage(""), 2000);
    return { allowed: true };
  };

  const handleMoveItem = (itemId: string, targetTier: string) => {
    setTiers((prev) => {
      const newTiers = { ...prev };
      let sourceItem;
      for (const tier in newTiers) {
        const index = newTiers[tier].findIndex((item) => item.id === itemId);
        if (index !== -1) {
          sourceItem = newTiers[tier][index];
          newTiers[tier] = newTiers[tier].filter((item) => item.id !== itemId);
          break;
        }
      }
      if (sourceItem) {
        newTiers[targetTier] = [...(newTiers[targetTier] || []), sourceItem];
      }
      return newTiers;
    });
  };

  return (
    <div className="space-y-4">
      {validationMessage && (
        <div
          className={`p-4 rounded-lg ${
            validationMessage.startsWith("✅")
              ? "bg-green-900/20 border border-green-500"
              : "bg-red-900/20 border border-red-500"
          }`}
        >
          <p className="text-sm font-semibold">{validationMessage}</p>
        </div>
      )}

      <div className="p-4 bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Validation Rules</h3>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• S-tier max: 3 items</li>
          <li>• Can't leave tier empty when moving to unranked</li>
          <li>• "Elite" items must stay in S or A tier</li>
        </ul>
      </div>

      <TierBoard
        tiers={tiers}
        tierOrder={["S", "A", "B"]}
        onMoveItem={handleMoveItem}
        validateDrop={validateDrop}
      />
    </div>
  );
}

// ============================================================================
// Example 3: Analytics & Undo/Redo
// ============================================================================

interface DragEvent {
  itemId: string;
  fromTier: string;
  toTier: string;
  timestamp: Date;
}

export function AnalyticsExample() {
  const [tiers, setTiers] = useState<Items>({
    S: [{ id: "1", attributes: { name: "Item 1" } }],
    A: [{ id: "2", attributes: { name: "Item 2" } }],
    B: [{ id: "3", attributes: { name: "Item 3" } }],
    unranked: [],
  });

  const [analytics, setAnalytics] = useState({
    totalDrags: 0,
    successfulMoves: 0,
    cancelledDrags: 0,
  });

  const [history, setHistory] = useState<DragEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleDragComplete = (itemId: string, fromTier: string, toTier: string) => {
    setAnalytics((prev) => ({
      ...prev,
      totalDrags: prev.totalDrags + 1,
      successfulMoves: prev.successfulMoves + 1,
    }));

    // Add to undo history
    const newEvent: DragEvent = {
      itemId,
      fromTier,
      toTier,
      timestamp: new Date(),
    };
    setHistory((prev) => [...prev.slice(0, currentIndex + 1), newEvent]);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleDragCancel = () => {
    setAnalytics((prev) => ({
      ...prev,
      totalDrags: prev.totalDrags + 1,
      cancelledDrags: prev.cancelledDrags + 1,
    }));
  };

  const undo = () => {
    if (currentIndex < 0) return;

    const event = history[currentIndex];
    // Reverse the move
    handleMoveItemDirect(event.itemId, event.fromTier);
    setCurrentIndex((prev) => prev - 1);
  };

  const redo = () => {
    if (currentIndex >= history.length - 1) return;

    const event = history[currentIndex + 1];
    handleMoveItemDirect(event.itemId, event.toTier);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleMoveItemDirect = (itemId: string, targetTier: string) => {
    setTiers((prev) => {
      const newTiers = { ...prev };
      let sourceItem;
      for (const tier in newTiers) {
        const index = newTiers[tier].findIndex((item) => item.id === itemId);
        if (index !== -1) {
          sourceItem = newTiers[tier][index];
          newTiers[tier] = newTiers[tier].filter((item) => item.id !== itemId);
          break;
        }
      }
      if (sourceItem) {
        newTiers[targetTier] = [...(newTiers[targetTier] || []), sourceItem];
      }
      return newTiers;
    });
  };

  const handleMoveItem = (itemId: string, targetTier: string) => {
    handleMoveItemDirect(itemId, targetTier);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-400">Total Drags</h3>
          <p className="text-2xl font-bold">{analytics.totalDrags}</p>
        </div>
        <div className="p-4 bg-green-900/20 rounded-lg border border-green-500">
          <h3 className="text-sm font-semibold text-slate-400">Successful</h3>
          <p className="text-2xl font-bold text-green-400">
            {analytics.successfulMoves}
          </p>
        </div>
        <div className="p-4 bg-red-900/20 rounded-lg border border-red-500">
          <h3 className="text-sm font-semibold text-slate-400">Cancelled</h3>
          <p className="text-2xl font-bold text-red-400">
            {analytics.cancelledDrags}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={currentIndex < 0}
          className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↶ Undo
        </button>
        <button
          onClick={redo}
          disabled={currentIndex >= history.length - 1}
          className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↷ Redo
        </button>
      </div>

      <TierBoard
        tiers={tiers}
        tierOrder={["S", "A", "B"]}
        onMoveItem={handleMoveItem}
        onDragComplete={handleDragComplete}
        onDragCancel={handleDragCancel}
      />
    </div>
  );
}

// ============================================================================
// Example 4: Real-time Preview & Stats
// ============================================================================

export function PreviewExample() {
  const [tiers, setTiers] = useState<Items>({
    S: [{ id: "1", attributes: { name: "Item 1" } }],
    A: [
      { id: "2", attributes: { name: "Item 2" } },
      { id: "3", attributes: { name: "Item 3" } },
    ],
    B: [],
    unranked: [{ id: "4", attributes: { name: "Item 4" } }],
  });

  const [currentDrag, setCurrentDrag] = useState<{
    itemId: string;
    fromTier: string;
  } | null>(null);

  const handleDragStart = (itemId: string, tierId: string) => {
    setCurrentDrag({ itemId, fromTier: tierId });
  };

  const handleDragComplete = () => {
    setCurrentDrag(null);
  };

  const handleDragCancel = () => {
    setCurrentDrag(null);
  };

  const handleMoveItem = (itemId: string, targetTier: string) => {
    setTiers((prev) => {
      const newTiers = { ...prev };
      let sourceItem;
      for (const tier in newTiers) {
        const index = newTiers[tier].findIndex((item) => item.id === itemId);
        if (index !== -1) {
          sourceItem = newTiers[tier][index];
          newTiers[tier] = newTiers[tier].filter((item) => item.id !== itemId);
          break;
        }
      }
      if (sourceItem) {
        newTiers[targetTier] = [...(newTiers[targetTier] || []), sourceItem];
      }
      return newTiers;
    });
  };

  return (
    <div className="space-y-4">
      {currentDrag && (
        <div className="p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
          <p className="text-sm font-semibold">
            📦 Dragging "{currentDrag.itemId}" from {currentDrag.fromTier}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Drop on a tier to move, or press Escape to cancel
          </p>
        </div>
      )}

      <TierBoard
        tiers={tiers}
        tierOrder={["S", "A", "B"]}
        onMoveItem={handleMoveItem}
        onDragStart={handleDragStart}
        onDragComplete={handleDragComplete}
        onDragCancel={handleDragCancel}
      />
    </div>
  );
}
