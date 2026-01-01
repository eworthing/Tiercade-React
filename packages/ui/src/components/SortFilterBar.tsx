import React, { useState, useCallback } from "react";
import type { GlobalSortMode, MediaType } from "@tiercade/core";
import type { ItemFilters } from "@tiercade/core";
import { hasActiveFilters } from "@tiercade/core";

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

const MEDIA_TYPES: { type: MediaType; label: string; icon: React.ReactNode }[] = [
  {
    type: "image",
    label: "Images",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: "gif",
    label: "GIFs",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: "video",
    label: "Videos",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: "audio",
    label: "Audio",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
];

const SORT_OPTIONS: { mode: GlobalSortMode; label: string }[] = [
  { mode: { type: "custom" }, label: "Custom Order" },
  { mode: { type: "alphabetical", ascending: true }, label: "A to Z" },
  { mode: { type: "alphabetical", ascending: false }, label: "Z to A" },
];

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

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  const getSortLabel = (mode: GlobalSortMode): string => {
    if (mode.type === "custom") return "Custom";
    if (mode.type === "alphabetical") return mode.ascending ? "A-Z" : "Z-A";
    return "Custom";
  };

  return (
    <div className="space-y-2">
      {/* Main bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search items..."
            value={filters.searchText ?? ""}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-button bg-surface-raised border border-border text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
          {filters.searchText && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-soft text-text-subtle hover:text-text transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative group">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-button bg-surface-raised border border-border text-text hover:border-text-subtle transition-all"
            aria-label="Sort options"
          >
            <svg className="w-4 h-4 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>{getSortLabel(sortMode)}</span>
            <svg className="w-3 h-3 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 py-1 bg-surface-raised border border-border rounded-lg shadow-modal opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[140px]">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => onSortModeChange(option.mode)}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-surface-soft flex items-center gap-2 transition-colors ${
                  JSON.stringify(sortMode) === JSON.stringify(option.mode)
                    ? "text-accent"
                    : "text-text"
                }`}
              >
                {option.label}
                {JSON.stringify(sortMode) === JSON.stringify(option.mode) && (
                  <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-button border transition-all ${
            hasFilters
              ? "bg-accent/10 border-accent text-accent"
              : "bg-surface-raised border-border text-text hover:border-text-subtle"
          }`}
          aria-expanded={isExpanded}
          aria-label="Toggle filters"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          {hasFilters && (
            <span className="flex items-center justify-center w-4 h-4 text-2xs font-medium bg-accent text-white rounded-full">
              {(filters.mediaTypes?.length ?? 0) + (filters.searchText ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="px-2 py-1.5 text-sm text-text-subtle hover:text-text transition-colors"
          >
            Clear
          </button>
        )}

        {/* Item count */}
        {isFiltered && (
          <span className="text-sm text-text-muted ml-auto">
            Showing {filteredItems} of {totalItems}
          </span>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="flex items-center gap-2 flex-wrap p-3 bg-surface-soft rounded-card border border-border">
          <span className="text-xs font-medium text-text-subtle uppercase tracking-wide">
            Media Type:
          </span>
          {MEDIA_TYPES.map(({ type, label, icon }) => {
            const isActive = filters.mediaTypes?.includes(type) ?? false;
            return (
              <button
                key={type}
                onClick={() => onMediaTypeToggle(type)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all ${
                  isActive
                    ? "bg-accent text-white border-accent"
                    : "bg-surface-raised text-text-muted border-border hover:border-text-subtle hover:text-text"
                }`}
                aria-pressed={isActive}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
