import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";

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
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <div className="w-12 h-12 mb-4 rounded-full bg-danger/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-danger"
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
          <h3 className="text-lg font-semibold text-text mb-2">
            {this.props.title ?? "Something went wrong"}
          </h3>
          <p className="text-sm text-text-muted mb-4 max-w-sm">
            {this.state.error?.message ?? "An unexpected error occurred"}
          </p>
          {(this.props.showRetry ?? true) && (
            <Button variant="secondary" onClick={this.handleRetry}>
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
  <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
    <div className="w-12 h-12 mb-4 rounded-full bg-danger/10 flex items-center justify-center">
      <svg
        className="w-6 h-6 text-danger"
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
    <h3 className="text-lg font-semibold text-text mb-2">Error</h3>
    <p className="text-sm text-text-muted mb-4 max-w-sm">
      {error?.message ?? "Something went wrong"}
    </p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
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
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
    <div className="w-16 h-16 mb-6 rounded-full bg-danger/10 flex items-center justify-center">
      <svg
        className="w-8 h-8 text-danger"
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
    <h2 className="text-xl font-semibold text-text mb-2">
      Oops! Something went wrong
    </h2>
    <p className="text-text-muted mb-6 max-w-md">
      We encountered an unexpected error while loading this page.
      You can try refreshing or contact support if the problem persists.
    </p>
    {error && (
      <details className="mb-6 text-left w-full max-w-md">
        <summary className="text-sm text-text-subtle cursor-pointer hover:text-text-muted">
          Technical details
        </summary>
        <pre className="mt-2 p-3 bg-surface-raised rounded-lg text-xs text-text-muted overflow-auto">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    )}
    <div className="flex gap-3">
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try Again
        </Button>
      )}
      <Button variant="secondary" onClick={() => window.location.reload()}>
        Refresh Page
      </Button>
    </div>
  </div>
);

PageErrorFallback.displayName = "PageErrorFallback";
