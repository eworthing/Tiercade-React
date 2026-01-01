import { useEffect, useRef, type RefObject } from "react";

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  const focusableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])",
  ].join(", ");

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  active: boolean;
  /** Whether to restore focus on deactivation */
  restoreFocus?: boolean;
  /** Initial element to focus (defaults to first focusable) */
  initialFocus?: RefObject<HTMLElement>;
  /** Element to focus when deactivated */
  returnFocus?: RefObject<HTMLElement>;
}

/**
 * Hook to trap focus within a container element
 *
 * Used for modals, dialogs, and overlays to ensure keyboard
 * navigation stays within the component.
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(containerRef, { active: isOpen });
 *
 * return (
 *   <div ref={containerRef}>
 *     <button>First</button>
 *     <button>Last</button>
 *   </div>
 * );
 * ```
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  options: UseFocusTrapOptions
): void {
  const { active, restoreFocus = true, initialFocus, returnFocus } = options;
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store currently focused element for restoration
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Focus initial element or first focusable
    const focusInitial = () => {
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else {
        const focusables = getFocusableElements(containerRef.current);
        if (focusables.length > 0) {
          focusables[0].focus();
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(focusInitial);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !containerRef.current) return;

      const focusables = getFocusableElements(containerRef.current);
      if (focusables.length === 0) return;

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];

      // Shift+Tab on first element -> go to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> go to first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restore focus on cleanup
      if (restoreFocus) {
        const elementToFocus = returnFocus?.current ?? previouslyFocusedRef.current;
        if (elementToFocus && typeof elementToFocus.focus === "function") {
          // Use requestAnimationFrame to ensure focus happens after DOM updates
          requestAnimationFrame(() => {
            elementToFocus.focus();
          });
        }
      }
    };
  }, [active, containerRef, initialFocus, returnFocus, restoreFocus]);
}

/**
 * Hook to announce content changes to screen readers
 *
 * @example
 * ```tsx
 * const announce = useAriaLive();
 * announce("Item added to tier S");
 * ```
 */
export function useAriaLive() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create aria-live region if it doesn't exist
    let region = document.getElementById("aria-live-region") as HTMLDivElement;
    if (!region) {
      region = document.createElement("div");
      region.id = "aria-live-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      region.className = "sr-only";
      document.body.appendChild(region);
    }
    regionRef.current = region;

    return () => {
      // Clean up on unmount only if we're the last user
      // (In practice, we leave the region for other components)
    };
  }, []);

  return (message: string, priority: "polite" | "assertive" = "polite") => {
    if (regionRef.current) {
      regionRef.current.setAttribute("aria-live", priority);
      regionRef.current.textContent = message;
    }
  };
}
