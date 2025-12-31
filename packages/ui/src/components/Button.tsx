import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  className = "",
  children,
  ...props
}) => {
  // GPU-accelerated base styles with spring transitions
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-button
    transition-all duration-200 ease-spring
    transform-gpu will-change-transform
    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    hover:scale-[1.02] active:scale-[0.98]
  `;

  const variants = {
    primary: `
      bg-accent text-white
      hover:bg-accent-hover hover:shadow-glow-accent
      active:bg-blue-600 active:shadow-inner-sm
    `,
    secondary: `
      bg-surface-raised border border-border text-text
      hover:bg-slate-700 hover:border-text-subtle hover:shadow-card-hover
      active:bg-slate-600 active:shadow-inner-sm
    `,
    ghost: `
      text-text-muted
      hover:text-text hover:bg-surface-raised
      active:bg-slate-700 active:shadow-inner-sm
    `,
    danger: `
      bg-danger text-white
      hover:bg-danger-soft hover:shadow-glow-danger
      active:bg-red-700 active:shadow-inner-sm
    `,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

export const IconButton: React.FC<
  Omit<ButtonProps, "children"> & { label: string }
> = ({ label, icon, className = "", size = "md", ...props }) => {
  const sizes = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  return (
    <Button
      {...props}
      size={size}
      className={`${sizes[size]} rounded-full ${className}`}
      aria-label={label}
      title={label}
    >
      {icon}
    </Button>
  );
};

// Glass-style button for overlays
export const GlassButton: React.FC<ButtonProps> = ({
  className = "",
  children,
  ...props
}) => (
  <Button
    {...props}
    variant="ghost"
    className={`
      bg-surface-glass backdrop-blur-md border border-border-subtle
      hover:bg-surface-raised/80 hover:border-border
      ${className}
    `}
  >
    {children}
  </Button>
);
