import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@react-spectrum/s2";

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback UI to show on error */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Title for the default error UI */
  title?: string;
  /** Whether to show the retry button */
  showRetry?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch and handle React errors
 *
 * Prevents a single component error from crashing the entire app
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <SomeComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              marginBottom: 16,
              borderRadius: "50%",
              backgroundColor: "rgba(var(--spectrum-negative-visual-color-rgb, 211, 21, 16), 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              style={{ width: 24, height: 24, color: "var(--spectrum-negative-visual-color, #d31510)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--spectrum-gray-900)",
              marginBottom: 8,
            }}
          >
            {this.props.title ?? "Something went wrong"}
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "var(--spectrum-gray-600)",
              marginBottom: 16,
              maxWidth: 384,
            }}
          >
            {this.state.error?.message ?? "An unexpected error occurred"}
          </p>
          {(this.props.showRetry ?? true) && (
            <Button variant="secondary" onPress={this.handleRetry}>
              Try Again
            </Button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error fallback component
 */
export const ErrorFallback: React.FC<{
  error?: Error | null;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
      padding: 24,
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        marginBottom: 16,
        borderRadius: "50%",
        backgroundColor: "rgba(var(--spectrum-negative-visual-color-rgb, 211, 21, 16), 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        style={{ width: 24, height: 24, color: "var(--spectrum-negative-visual-color, #d31510)" }}
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
    </div>
    <h3
      style={{
        fontSize: 18,
        fontWeight: 600,
        color: "var(--spectrum-gray-900)",
        marginBottom: 8,
      }}
    >
      Error
    </h3>
    <p
      style={{
        fontSize: 14,
        color: "var(--spectrum-gray-600)",
        marginBottom: 16,
        maxWidth: 384,
      }}
    >
      {error?.message ?? "Something went wrong"}
    </p>
    {onRetry && (
      <Button variant="secondary" onPress={onRetry}>
        Retry
      </Button>
    )}
  </div>
);

ErrorFallback.displayName = "ErrorFallback";

/**
 * Page-level error fallback with more context
 */
export const PageErrorFallback: React.FC<{
  error?: Error | null;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 400,
      padding: 32,
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        marginBottom: 24,
        borderRadius: "50%",
        backgroundColor: "rgba(var(--spectrum-negative-visual-color-rgb, 211, 21, 16), 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        style={{ width: 32, height: 32, color: "var(--spectrum-negative-visual-color, #d31510)" }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
    <h2
      style={{
        fontSize: 20,
        fontWeight: 600,
        color: "var(--spectrum-gray-900)",
        marginBottom: 8,
      }}
    >
      Oops! Something went wrong
    </h2>
    <p
      style={{
        color: "var(--spectrum-gray-600)",
        marginBottom: 24,
        maxWidth: 448,
      }}
    >
      We encountered an unexpected error while loading this page.
      You can try refreshing or contact support if the problem persists.
    </p>
    {error && (
      <details
        style={{
          marginBottom: 24,
          textAlign: "left",
          width: "100%",
          maxWidth: 448,
        }}
      >
        <summary
          style={{
            fontSize: 14,
            color: "var(--spectrum-gray-500)",
            cursor: "pointer",
          }}
        >
          Technical details
        </summary>
        <pre
          style={{
            marginTop: 8,
            padding: 12,
            backgroundColor: "var(--spectrum-gray-100)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--spectrum-gray-600)",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    )}
    <div style={{ display: "flex", gap: 12 }}>
      {onRetry && (
        <Button variant="accent" onPress={onRetry}>
          Try Again
        </Button>
      )}
      <Button variant="secondary" onPress={() => window.location.reload()}>
        Refresh Page
      </Button>
    </div>
  </div>
);

PageErrorFallback.displayName = "PageErrorFallback";
