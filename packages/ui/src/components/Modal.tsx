import React, { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";

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
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [open]);

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
    }, 200); // Match modal-out duration
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

      // Focus the modal content
      setTimeout(() => {
        const focusable = contentRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }, 0);

      // Handle escape key with animated close
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && closeOnEscape) {
          e.preventDefault();
          handleClose();
        }
      };
      document.addEventListener("keydown", handleKeyDown);

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";

        // Restore focus
        previousActiveElement.current?.focus();
      };
    }
  }, [open, closeOnEscape, handleClose]);

  if (!open && !isVisible) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
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
        `}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-modal-padding border-b border-border-soft">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-text"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
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
