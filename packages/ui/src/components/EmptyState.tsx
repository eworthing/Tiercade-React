import React from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: "tier" | "items" | "search" | "error" | "success";
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = "tier",
  action,
  className = "",
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center py-12 px-6 text-center
        animate-fade-in
        ${className}
      `}
    >
      {/* Animated illustration */}
      <div className="relative mb-6">
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-accent-subtle rounded-full blur-2xl opacity-50 animate-pulse-soft" />

        {/* Icon container */}
        <div className="relative w-24 h-24 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center shadow-card floating">
          <EmptyStateIcon type={icon} />
        </div>

        {/* Decorative particles */}
        <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-gradient-start opacity-60 animate-float" />
        <div className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-gradient-mid opacity-40 animate-float-slow" />
        <div className="absolute top-1/2 -right-4 w-2 h-2 rounded-full bg-gradient-end opacity-50 animate-float" style={{ animationDelay: "1s" }} />
      </div>

      {/* Text content */}
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-xs mb-6">{description}</p>
      )}

      {/* Action */}
      {action && <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>{action}</div>}
    </div>
  );
};

const EmptyStateIcon: React.FC<{ type: EmptyStateProps["icon"] }> = ({ type }) => {
  const iconClass = "w-10 h-10 text-text-muted";

  switch (type) {
    case "tier":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
          <circle cx="8" cy="6" r="1.5" fill="currentColor" className="text-gradient-start" />
          <circle cx="8" cy="10" r="1.5" fill="currentColor" className="text-gradient-mid" />
          <circle cx="8" cy="14" r="1.5" fill="currentColor" className="text-gradient-end" />
        </svg>
      );

    case "items":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15l-2 2m0 0l2 2m-2-2h4"
            className="text-accent"
          />
        </svg>
      );

    case "search":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      );

    case "error":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );

    case "success":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            className="text-success"
          />
        </svg>
      );

    default:
      return null;
  }
};

// Preset empty states for common use cases
export const EmptyTierList: React.FC<{ onAddItems?: () => void }> = ({ onAddItems }) => (
  <EmptyState
    icon="tier"
    title="No items yet"
    description="Add some items to start ranking. Drag and drop them into tiers to organize your list."
    action={
      onAddItems && (
        <button
          onClick={onAddItems}
          className="btn-gradient text-white px-4 py-2 rounded-button text-sm font-medium
            transform-gpu transition-all duration-200 ease-spring
            hover:scale-[1.02] hover:shadow-glow-gradient active:scale-[0.98]"
        >
          Add Your First Item
        </button>
      )
    }
  />
);

export const EmptySearchResults: React.FC<{ query?: string }> = ({ query }) => (
  <EmptyState
    icon="search"
    title="No results found"
    description={query ? `We couldn't find anything matching "${query}"` : "Try adjusting your search"}
  />
);
