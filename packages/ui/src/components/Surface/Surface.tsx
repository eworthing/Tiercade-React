import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { scaleVariants, springs } from "@tiercade/theme";

export type SurfaceVariant = "default" | "soft" | "elevated" | "glass";
export type SurfaceSize = "sm" | "md" | "lg";

export interface SurfaceProps extends Omit<HTMLMotionProps<"div">, "children"> {
  /** Visual variant of the surface */
  variant?: SurfaceVariant;
  /** Padding size */
  size?: SurfaceSize;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Whether to show hover effects */
  interactive?: boolean;
  /** Whether the surface is in a pressed/active state */
  isPressed?: boolean;
  /** Whether to show a border */
  bordered?: boolean;
  /** Custom border color (CSS color value) */
  borderColor?: string;
  /** Children content */
  children: React.ReactNode;
}

const variantClasses: Record<SurfaceVariant, string> = {
  default: "bg-slate-900",
  soft: "bg-slate-800/50",
  elevated: "bg-slate-800 shadow-lg",
  glass: "bg-slate-900/80 backdrop-blur-md",
};

const sizeClasses: Record<SurfaceSize, string> = {
  sm: "p-2 rounded",
  md: "p-3 rounded-md",
  lg: "p-4 rounded-lg",
};

const interactiveClasses = "cursor-pointer hover:shadow-xl transition-shadow";

export const Surface: React.FC<SurfaceProps> = ({
  variant = "default",
  size = "md",
  animate = false,
  interactive = false,
  isPressed = false,
  bordered = true,
  borderColor,
  children,
  className = "",
  style,
  ...motionProps
}) => {
  const baseClasses = [
    variantClasses[variant],
    sizeClasses[size],
    bordered ? "border border-slate-700" : "",
    interactive ? interactiveClasses : "",
    isPressed ? "ring-2 ring-blue-500 shadow-lg" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(borderColor ? { borderColor } : {}),
  };

  if (animate) {
    return (
      <motion.div
        variants={scaleVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={interactive ? { scale: 1.01, y: -1 } : undefined}
        whileTap={interactive ? { scale: 0.99 } : undefined}
        className={baseClasses}
        style={combinedStyle}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.01, y: -1, transition: springs.snappy } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
      className={baseClasses}
      style={combinedStyle}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default Surface;
