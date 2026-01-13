import React, { useState, useRef, useEffect } from "react";
import { Button } from "@react-spectrum/s2";

interface BatchActionBarProps {
  selectedCount: number;
  tierOrder: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string>;
  onMoveToTier: (tierName: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  tierOrder,
  tierLabels,
  tierColors,
  onMoveToTier,
  onDelete,
  onClear,
}) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(event.target as Node)) {
        setShowMoveMenu(false);
      }
    };

    if (showMoveMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMoveMenu]);

  if (selectedCount === 0) {
    return null;
  }

  const handleMoveToTier = (tierName: string) => {
    onMoveToTier(tierName);
    setShowMoveMenu(false);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-reset confirm state after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 16,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        backgroundColor: "var(--spectrum-gray-100)",
        border: "1px solid var(--spectrum-gray-300)",
        borderRadius: 12,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1)"
      }}>
        {/* Selection count */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "var(--spectrum-blue-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--spectrum-blue-900)" }}>
              {selectedCount}
            </span>
          </div>
          <span style={{ fontSize: 14, color: "var(--spectrum-gray-900)", fontWeight: 500 }}>
            {selectedCount === 1 ? "item" : "items"} selected
          </span>
        </div>

        <div style={{ width: 1, height: 24, backgroundColor: "var(--spectrum-gray-300)" }} />

        {/* Move to tier dropdown */}
        <div style={{ position: "relative" }} ref={moveMenuRef}>
          <Button
            variant="secondary"
            size="S"
            onPress={() => setShowMoveMenu(!showMoveMenu)}
          >
            <MoveIcon /> Move to...
          </Button>

          {showMoveMenu && (
            <div style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              marginBottom: 8,
              padding: "4px 0",
              backgroundColor: "var(--spectrum-gray-100)",
              border: "1px solid var(--spectrum-gray-300)",
              borderRadius: 8,
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              minWidth: 160,
              maxHeight: 300,
              overflowY: "auto"
            }}>
              {tierOrder.map((tierId) => (
                <button
                  key={tierId}
                  onClick={() => handleMoveToTier(tierId)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 14,
                    color: "var(--spectrum-gray-900)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--spectrum-gray-200)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: tierColors[tierId] ?? "#374151"
                    }}
                  />
                  {tierLabels[tierId] ?? tierId}
                </button>
              ))}
              <div style={{ borderTop: "1px solid var(--spectrum-gray-300)", margin: "4px 0" }} />
              <button
                onClick={() => handleMoveToTier("unranked")}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  textAlign: "left",
                  fontSize: 14,
                  color: "var(--spectrum-gray-700)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--spectrum-gray-200)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    backgroundColor: tierColors["unranked"] ?? "#374151"
                  }}
                />
                Unranked
              </button>
            </div>
          )}
        </div>

        {/* Delete button */}
        <Button
          variant={showDeleteConfirm ? "negative" : "secondary"}
          fillStyle={showDeleteConfirm ? "fill" : "outline"}
          size="S"
          onPress={handleDelete}
        >
          <TrashIcon /> {showDeleteConfirm ? "Confirm Delete" : "Delete"}
        </Button>

        <div style={{ width: 1, height: 24, backgroundColor: "var(--spectrum-gray-300)" }} />

        {/* Clear selection */}
        <Button variant="secondary" fillStyle="outline" size="S" onPress={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
};

BatchActionBar.displayName = "BatchActionBar";

// Icons
const MoveIcon = () => (
  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

const TrashIcon = () => (
  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
