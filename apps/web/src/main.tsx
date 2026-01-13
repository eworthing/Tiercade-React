import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { Provider as SpectrumProvider, ToastContainer } from "@react-spectrum/s2";
import { BrowserRouter } from "react-router-dom";
import { store } from "@tiercade/state";
import { AppShell } from "./shell/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "@react-spectrum/s2/page.css"; // S2 page styles for full-page app
import "./index.css";

const rootElement = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ReduxProvider store={store}>
        {/* S2 Provider: innermost when using multiple providers */}
        <SpectrumProvider
          background="base"
          colorScheme="dark"
          locale="en-US" // Required to prevent SSR hydration errors
        >
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
          <ToastContainer />
        </SpectrumProvider>
      </ReduxProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
