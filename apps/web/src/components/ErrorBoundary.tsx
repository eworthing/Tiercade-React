import React, { Component, type ReactNode } from "react";
import { Button } from "@react-spectrum/s2";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[Tiercade] Error caught by boundary:", error, errorInfo);
    // Future: Send to error tracking service like Sentry
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--spectrum-gray-50)",
          padding: 16
        }}>
          <div style={{ maxWidth: 448, width: "100%", textAlign: "center" }}>
            <div style={{
              width: 64,
              height: 64,
              margin: "0 auto 24px",
              borderRadius: "50%",
              backgroundColor: "var(--spectrum-red-200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg
                style={{ width: 32, height: 32, color: "var(--spectrum-red-900)" }}
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

            <h1 style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--spectrum-gray-900)",
              marginBottom: 8
            }}>
              Something went wrong
            </h1>

            <p style={{ color: "var(--spectrum-gray-700)", marginBottom: 24 }}>
              Don't worry — your tier list data is saved locally and should be
              restored when you refresh the page.
            </p>

            {this.state.error && (
              <details style={{ marginBottom: 24, textAlign: "left" }}>
                <summary style={{
                  fontSize: 14,
                  color: "var(--spectrum-gray-600)",
                  cursor: "pointer"
                }}>
                  Error details
                </summary>
                <pre style={{
                  marginTop: 8,
                  padding: 12,
                  backgroundColor: "var(--spectrum-gray-100)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--spectrum-red-900)",
                  overflowX: "auto"
                }}>
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {"\n\n"}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Button variant="secondary" onPress={this.handleReset}>
                Try Again
              </Button>
              <Button variant="accent" onPress={this.handleReload}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Page-level error boundary with simpler UI
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
          padding: 16,
          textAlign: "center"
        }}>
          <div style={{
            width: 48,
            height: 48,
            marginBottom: 16,
            borderRadius: "50%",
            backgroundColor: "var(--spectrum-red-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg
              style={{ width: 24, height: 24, color: "var(--spectrum-red-900)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 style={{
            fontSize: 18,
            fontWeight: 500,
            color: "var(--spectrum-gray-900)",
            marginBottom: 4
          }}>
            This section couldn't load
          </h2>
          <p style={{
            color: "var(--spectrum-gray-700)",
            fontSize: 14,
            marginBottom: 16
          }}>
            Try refreshing the page or navigating elsewhere.
          </p>
          <Button
            variant="secondary"
            size="S"
            onPress={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
