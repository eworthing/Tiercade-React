import React, { useState, useRef, useEffect } from "react";
import { Button } from "@tiercade/ui";

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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-raised border border-border rounded-xl shadow-modal backdrop-blur-sm">
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-sm font-bold text-accent">{selectedCount}</span>
          </div>
          <span className="text-sm text-text font-medium">
            {selectedCount === 1 ? "item" : "items"} selected
          </span>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Move to tier dropdown */}
        <div className="relative" ref={moveMenuRef}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            icon={<MoveIcon />}
          >
            Move to...
          </Button>

          {showMoveMenu && (
            <div className="absolute bottom-full left-0 mb-2 py-1 bg-surface-raised border border-border rounded-lg shadow-modal min-w-[160px] max-h-[300px] overflow-y-auto">
              {tierOrder.map((tierId) => (
                <button
                  key={tierId}
                  onClick={() => handleMoveToTier(tierId)}
                  className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-soft flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: tierColors[tierId] ?? "#374151" }}
                  />
                  {tierLabels[tierId] ?? tierId}
                </button>
              ))}
              <div className="border-t border-border my-1" />
              <button
                onClick={() => handleMoveToTier("unranked")}
                className="w-full px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-soft flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: tierColors["unranked"] ?? "#374151" }}
                />
                Unranked
              </button>
            </div>
          )}
        </div>

        {/* Delete button */}
        <Button
          variant={showDeleteConfirm ? "danger" : "ghost"}
          size="sm"
          onClick={handleDelete}
          icon={<TrashIcon />}
        >
          {showDeleteConfirm ? "Confirm Delete" : "Delete"}
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Clear selection */}
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
};

BatchActionBar.displayName = "BatchActionBar";

// Icons
const MoveIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
