import React, { useEffect, useRef, useCallback, useState, useId } from "react";
import { createPortal } from "react-dom";
import { DURATION } from "@tiercade/theme";

/** Get all focusable elements within a container */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
  );
  return Array.from(elements);
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = "",
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Generate unique IDs for accessibility
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  // Handle open/close with animation - sync internal state with open prop
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible && !isClosing) {
      // Parent set open=false, animate out
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, DURATION.NORMAL);
    }
  }, [open, isVisible, isClosing]);

  // Size classes
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, DURATION.NORMAL);
  }, [onClose]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      handleClose();
    }
  };

  // Focus trap, escape key, and body scroll management
  useEffect(() => {
    if (open) {
      // Store current focus
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the first focusable element using requestAnimationFrame for reliable timing
      requestAnimationFrame(() => {
        if (contentRef.current) {
          const focusables = getFocusableElements(contentRef.current);
          focusables[0]?.focus();
        }
      });

      // Handle keyboard events (escape + focus trap)
      const handleKeyDown = (e: KeyboardEvent) => {
        // Escape key closes modal
        if (e.key === "Escape" && closeOnEscape) {
          e.preventDefault();
          handleClose();
          return;
        }

        // Tab key focus trap
        if (e.key === "Tab" && contentRef.current) {
          const focusables = getFocusableElements(contentRef.current);
          if (focusables.length === 0) return;

          const firstFocusable = focusables[0];
          const lastFocusable = focusables[focusables.length - 1];

          // Shift+Tab on first element -> focus last element
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
          // Tab on last element -> focus first element
          else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      };
      document.addEventListener("keydown", handleKeyDown);

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";

        // Restore focus after DOM updates complete
        const elementToRestore = previousActiveElement.current;
        if (elementToRestore && document.body.contains(elementToRestore)) {
          requestAnimationFrame(() => {
            elementToRestore.focus();
          });
        }
      };
    }
  }, [open, closeOnEscape, handleClose]);

  if (!open && !isVisible) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/60 backdrop-blur-md
        ${isClosing ? "animate-backdrop-out" : "animate-backdrop-in"}
      `}
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        className={`
          w-full ${sizes[size]}
          bg-surface-soft/95 backdrop-blur-lg border border-border-subtle
          rounded-modal shadow-modal
          flex flex-col max-h-[90vh]
          transform-gpu will-change-transform
          ${isClosing ? "animate-modal-out" : "animate-modal-in"}
          ${className}
        `}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-modal-padding border-b border-border-soft">
            <div>
              {title && (
                <h2
                  id={titleId}
                  className="text-lg font-semibold text-text"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descriptionId}
                  className="mt-1 text-sm text-text-muted"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 -m-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-modal-padding">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-modal-padding border-t border-border-soft">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

Modal.displayName = "Modal";

// Confirm dialog variant
export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
}) => {
  const buttonVariants = {
    danger: "bg-danger text-white hover:bg-danger-soft",
    warning: "bg-warning text-white hover:bg-warning-soft",
    default: "bg-accent text-white hover:bg-accent-hover",
  };

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-text-muted">{message}</p>
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${buttonVariants[variant]}`}
        >
          {loading ? "Loading..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

ConfirmDialog.displayName = "ConfirmDialog";
