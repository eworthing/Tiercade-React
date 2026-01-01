import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delay = 300,
  className = "",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const showTooltip = useCallback(() => {
    if (disabled) return;

    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let x = 0;
        let y = 0;

        switch (position) {
          case "top":
            x = rect.left + scrollX + rect.width / 2;
            y = rect.top + scrollY - 8;
            break;
          case "bottom":
            x = rect.left + scrollX + rect.width / 2;
            y = rect.bottom + scrollY + 8;
            break;
          case "left":
            x = rect.left + scrollX - 8;
            y = rect.top + scrollY + rect.height / 2;
            break;
          case "right":
            x = rect.right + scrollX + 8;
            y = rect.top + scrollY + rect.height / 2;
            break;
        }

        setCoords({ x, y });
        setIsVisible(true);
      }
    }, delay);
  }, [position, delay, disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses: Record<TooltipPosition, string> = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2",
    left: "-translate-x-full -translate-y-1/2",
    right: "-translate-y-1/2",
  };

  const arrowClasses: Record<TooltipPosition, string> = {
    top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45",
    bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45",
    left: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 rotate-45",
    right: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45",
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible &&
        createPortal(
          <div
            role="tooltip"
            className={`
              fixed z-[200] pointer-events-none
              ${positionClasses[position]}
              animate-fade-in
            `}
            style={{
              left: coords.x,
              top: coords.y,
            }}
          >
            <div
              className={`
                relative px-3 py-2 rounded-lg text-sm
                bg-surface-raised/95 backdrop-blur-md
                border border-border-subtle
                shadow-dropdown text-text
                max-w-xs
                ${className}
              `}
            >
              {/* Arrow */}
              <div
                className={`
                  absolute w-2 h-2 bg-surface-raised border-border-subtle
                  ${arrowClasses[position]}
                `}
                style={{
                  borderWidth: position === "top" || position === "left" ? "0 1px 1px 0" : "1px 0 0 1px",
                }}
              />
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

// Rich tooltip with preview
interface RichTooltipProps {
  title: string;
  description?: string;
  image?: string;
  children: React.ReactNode;
  position?: TooltipPosition;
}

export const RichTooltip: React.FC<RichTooltipProps> = ({
  title,
  description,
  image,
  children,
  position = "top",
}) => {
  return (
    <Tooltip
      position={position}
      delay={400}
      content={
        <div className="flex gap-3 items-start">
          {image && (
            <img
              src={image}
              alt={title}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium text-text truncate">{title}</p>
            {description && (
              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{description}</p>
            )}
          </div>
        </div>
      }
    >
      {children}
    </Tooltip>
  );
};
