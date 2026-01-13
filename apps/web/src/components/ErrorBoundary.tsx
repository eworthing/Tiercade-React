import React, { Component, type ReactNode } from "react";
import {
  Button,
  ButtonGroup,
  Content,
  Heading,
  IllustratedMessage,
  Text,
} from "@react-spectrum/s2";
import BrowserError from "@react-spectrum/s2/illustrations/linear/BrowserError";

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
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 560, width: "100%" }}>
            <IllustratedMessage>
              <BrowserError />
              <Heading>Something went wrong</Heading>
              <Content>
                <Text>
                  Don’t worry — your tier list data is saved locally and should be restored when you refresh the page.
                </Text>
              </Content>
            </IllustratedMessage>

            {this.state.error && (
              <details style={{ marginBottom: 24, textAlign: "left" }}>
                <summary style={{ cursor: "pointer" }}>Error details</summary>
                <pre style={{ marginTop: 8, padding: 12, borderRadius: 8, overflowX: "auto" }}>
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

            <ButtonGroup>
              <Button variant="secondary" onPress={this.handleReset}>
                Try Again
              </Button>
              <Button variant="accent" onPress={this.handleReload}>
                Refresh Page
              </Button>
            </ButtonGroup>
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
        <div style={{ display: "flex", justifyContent: "center", padding: 16, minHeight: 300 }}>
          <IllustratedMessage>
            <BrowserError />
            <Heading>This section couldn’t load</Heading>
            <Content>
              <Text>Try refreshing the page or navigating elsewhere.</Text>
            </Content>
            <Button variant="secondary" size="S" onPress={() => window.location.reload()}>
              Refresh
            </Button>
          </IllustratedMessage>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
