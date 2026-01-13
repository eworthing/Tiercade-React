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
      <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: "gif",
    label: "GIFs",
    icon: (
      <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: "video",
    label: "Videos",
    icon: (
      <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: "audio",
    label: "Audio",
    icon: (
      <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [clearHover, setClearHover] = useState(false);
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

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };

  const mainBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  };

  const searchContainerStyle: React.CSSProperties = {
    position: "relative",
    flex: 1,
    minWidth: 200,
    maxWidth: 320,
  };

  const searchIconStyle: React.CSSProperties = {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    width: 16,
    height: 16,
    color: "var(--spectrum-gray-600)",
    pointerEvents: "none",
  };

  const searchInputStyle: React.CSSProperties = {
    width: "100%",
    paddingLeft: 36,
    paddingRight: 12,
    paddingTop: 6,
    paddingBottom: 6,
    fontSize: 14,
    borderRadius: 6,
    backgroundColor: "var(--spectrum-gray-100)",
    border: "1px solid var(--spectrum-gray-300)",
    color: "var(--spectrum-gray-900)",
    outline: "none",
    transition: "all 0.15s ease",
  };

  const buttonBaseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    fontSize: 14,
    borderRadius: 6,
    backgroundColor: "var(--spectrum-gray-100)",
    border: "1px solid var(--spectrum-gray-300)",
    color: "var(--spectrum-gray-900)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 4,
    padding: 4,
    backgroundColor: "var(--spectrum-gray-100)",
    border: "1px solid var(--spectrum-gray-300)",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 20,
    minWidth: 140,
    opacity: showDropdown ? 1 : 0,
    visibility: showDropdown ? "visible" : "hidden",
    transition: "opacity 0.15s ease, visibility 0.15s ease",
  };

  const filterToggleStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: hasFilters ? "rgba(var(--spectrum-blue-900-rgb, 20, 115, 230), 0.1)" : "var(--spectrum-gray-100)",
    borderColor: hasFilters ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-300)",
    color: hasFilters ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-900)",
  };

  const expandedFiltersStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    padding: 12,
    backgroundColor: "var(--spectrum-gray-75)",
    borderRadius: 8,
    border: "1px solid var(--spectrum-gray-300)",
  };

  return (
    <div style={containerStyle}>
      {/* Main bar */}
      <div style={mainBarStyle}>
        {/* Search input */}
        <div style={searchContainerStyle}>
          <svg style={searchIconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            style={searchInputStyle}
          />
          {filters.searchText && (
            <button
              onClick={() => onSearchChange("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                padding: 2,
                borderRadius: 4,
                backgroundColor: "transparent",
                border: "none",
                color: "var(--spectrum-gray-600)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Clear search"
            >
              <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <button style={buttonBaseStyle} aria-label="Sort options">
            <svg style={{ width: 16, height: 16, color: "var(--spectrum-gray-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>{getSortLabel(sortMode)}</span>
            <svg style={{ width: 12, height: 12, color: "var(--spectrum-gray-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Dropdown */}
          <div style={dropdownStyle}>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  onSortModeChange(option.mode);
                  setShowDropdown(false);
                }}
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  textAlign: "left",
                  fontSize: 14,
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: isSameSortMode(sortMode, option.mode)
                    ? "var(--spectrum-blue-700)"
                    : "var(--spectrum-gray-900)",
                  borderRadius: 4,
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--spectrum-gray-200)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {option.label}
                {isSameSortMode(sortMode, option.mode) && (
                  <svg style={{ width: 16, height: 16, marginLeft: "auto" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          style={filterToggleStyle}
          aria-expanded={isExpanded}
          aria-label="Toggle filters"
        >
          <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          {hasFilters && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 16,
                height: 16,
                fontSize: 10,
                fontWeight: 500,
                backgroundColor: "var(--spectrum-blue-700)",
                color: "white",
                borderRadius: "50%",
              }}
            >
              {(filters.mediaTypes?.length ?? 0) + (filters.searchText ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={onClearFilters}
            onMouseEnter={() => setClearHover(true)}
            onMouseLeave={() => setClearHover(false)}
            style={{
              padding: "6px 8px",
              fontSize: 14,
              backgroundColor: "transparent",
              border: "none",
              color: clearHover ? "var(--spectrum-gray-900)" : "var(--spectrum-gray-600)",
              cursor: "pointer",
              transition: "color 0.15s ease",
            }}
          >
            Clear
          </button>
        )}

        {/* Item count */}
        {isFiltered && (
          <span style={{ fontSize: 14, color: "var(--spectrum-gray-500)", marginLeft: "auto" }}>
            Showing {filteredItems} of {totalItems}
          </span>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div style={expandedFiltersStyle}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--spectrum-gray-600)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Media Type:
          </span>
          {MEDIA_TYPES.map(({ type, label, icon }) => {
            const isActive = filters.mediaTypes?.includes(type) ?? false;
            return (
              <MediaTypeButton
                key={type}
                type={type}
                label={label}
                icon={icon}
                isActive={isActive}
                onClick={() => onMediaTypeToggle(type)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// Separate component for media type buttons to handle hover state
const MediaTypeButton: React.FC<{
  type: MediaType;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    fontSize: 12,
    borderRadius: 9999,
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.15s ease",
    backgroundColor: isActive ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-100)",
    color: isActive ? "white" : isHovered ? "var(--spectrum-gray-900)" : "var(--spectrum-gray-600)",
    borderColor: isActive ? "var(--spectrum-blue-700)" : isHovered ? "var(--spectrum-gray-500)" : "var(--spectrum-gray-300)",
  };

  return (
    <button
      onClick={onClick}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-pressed={isActive}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
