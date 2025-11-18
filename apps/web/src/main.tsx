import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "@tiercade/state";
import { AppShell } from "./shell/AppShell";
import "./index.css";

const rootElement = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

