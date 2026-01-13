import React, { useCallback, useMemo, useState } from "react";
import type { GlobalSortMode, MediaType } from "@tiercade/core";
import type { ItemFilters } from "@tiercade/core";
import { hasActiveFilters } from "@tiercade/core";
import {
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
  Picker,
  PickerItem,
  SearchField,
  Text,
} from "@react-spectrum/s2";

export interface SortFilterBarProps {
  sortMode: GlobalSortMode;
  filters: ItemFilters;
  onSortModeChange: (mode: GlobalSortMode) => void;
  onSearchChange: (search: string) => void;
  onMediaTypeToggle: (mediaType: MediaType) => void;
  onClearFilters: () => void;
  totalItems: number;
  filteredItems: number;
}

const MEDIA_TYPES: { type: MediaType; label: string }[] = [
  {
    type: "image",
    label: "Images",
  },
  {
    type: "gif",
    label: "GIFs",
  },
  {
    type: "video",
    label: "Videos",
  },
  {
    type: "audio",
    label: "Audio",
  },
];

const SORT_OPTIONS: { mode: GlobalSortMode; label: string }[] = [
  { mode: { type: "custom" }, label: "Custom Order" },
  { mode: { type: "alphabetical", ascending: true }, label: "A to Z" },
  { mode: { type: "alphabetical", ascending: false }, label: "Z to A" },
];

/** Compare sort modes without JSON.stringify (O(1) vs O(n) serialization) */
function isSameSortMode(a: GlobalSortMode, b: GlobalSortMode): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "custom") return true;
  if (a.type === "alphabetical" && b.type === "alphabetical") {
    return a.ascending === b.ascending;
  }
  return false;
}

export const SortFilterBar: React.FC<SortFilterBarProps> = ({
  sortMode,
  filters,
  onSortModeChange,
  onSearchChange,
  onMediaTypeToggle,
  onClearFilters,
  totalItems,
  filteredItems,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasFilters = hasActiveFilters(filters);
  const isFiltered = filteredItems < totalItems;

  const selectedSortKey = useMemo(() => {
    const match = SORT_OPTIONS.find((o) => isSameSortMode(sortMode, o.mode));
    return match?.label ?? SORT_OPTIONS[0].label;
  }, [sortMode]);

  const mediaTypes = filters.mediaTypes ?? [];
  const filterBadgeCount = (filters.searchText ? 1 : 0) + mediaTypes.length;

  const handleMediaTypesChange = useCallback(
    (next: string[]) => {
      const nextSet = new Set(next as MediaType[]);
      const prevSet = new Set(mediaTypes);

      for (const type of MEDIA_TYPES) {
        const was = prevSet.has(type.type);
        const now = nextSet.has(type.type);
        if (was !== now) {
          onMediaTypeToggle(type.type);
        }
      }
    },
    [mediaTypes, onMediaTypeToggle]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 360 }}>
          <SearchField
            aria-label="Search items"
            placeholder="Search items…"
            value={filters.searchText ?? ""}
            onChange={onSearchChange}
          />
        </div>

        <Picker
          aria-label="Sort"
          selectedKey={selectedSortKey}
          onSelectionChange={(key) => {
            const option = SORT_OPTIONS.find((o) => o.label === String(key));
            if (option) onSortModeChange(option.mode);
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <PickerItem key={option.label} id={option.label}>
              {option.label}
            </PickerItem>
          ))}
        </Picker>

        <Button
          variant="secondary"
          onPress={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
        >
          Filters
          {hasFilters && filterBadgeCount > 0 && (
            <Badge variant="informative" fillStyle="subtle">
              {filterBadgeCount}
            </Badge>
          )}
        </Button>

        {hasFilters && (
          <Button variant="secondary" fillStyle="outline" onPress={onClearFilters}>
            Clear
          </Button>
        )}

        {isFiltered && (
          <Text>{`Showing ${filteredItems} of ${totalItems}`}</Text>
        )}
      </div>

      {isExpanded && (
        <CheckboxGroup
          label="Media types"
          value={mediaTypes}
          onChange={handleMediaTypesChange}
          orientation="horizontal"
        >
          {MEDIA_TYPES.map((t) => (
            <Checkbox key={t.type} value={t.type}>
              {t.label}
            </Checkbox>
          ))}
        </CheckboxGroup>
      )}
    </div>
  );
};
