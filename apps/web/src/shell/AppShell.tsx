import React, { useEffect, useState, useCallback, Suspense, useRef, lazy } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

// Eager load the main page for fast initial render
import { TierBoardPage } from "../pages/TierBoardPage";

// Lazy load secondary pages for code splitting
const HeadToHeadPage = lazy(() => import("../pages/HeadToHeadPage").then(m => ({ default: m.HeadToHeadPage })));
const ThemesPage = lazy(() => import("../pages/ThemesPage").then(m => ({ default: m.ThemesPage })));
const AnalyticsPage = lazy(() => import("../pages/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));
const ImportExportPage = lazy(() => import("../pages/ImportExportPage").then(m => ({ default: m.ImportExportPage })));
const TemplatesPage = lazy(() => import("../pages/TemplatesPage").then(m => ({ default: m.TemplatesPage })));
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import {
  performUndo,
  performRedo,
  setProjectName,
  selectCanUndo,
  selectCanRedo,
  selectProjectName,
  selectHasCompletedOnboarding,
} from "@tiercade/state";
import {
  ActionButton,
  Badge,
  TextField,
  Text,
  Tabs,
  TabList,
  Tab,
} from "@react-spectrum/s2";
import Undo from "@react-spectrum/s2/icons/Undo";
import Redo from "@react-spectrum/s2/icons/Redo";
import { PageErrorBoundary } from "../components/ErrorBoundary";
import { OnboardingWizard } from "../components/OnboardingWizard";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";

export const AppShell: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const projectName = useAppSelector(selectProjectName);
  const hasCompletedOnboarding = useAppSelector(selectHasCompletedOnboarding);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(projectName);

  // Page transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);

  // Trigger page transition animation
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 200);
      prevPathRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Sync edited name when project name changes
  useEffect(() => {
    setEditedName(projectName);
  }, [projectName]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) dispatch(performUndo());
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (canRedo) dispatch(performRedo());
      } else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        if (canRedo) dispatch(performRedo());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, canUndo, canRedo]);

  const handleSaveName = useCallback(() => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== projectName) {
      dispatch(setProjectName(trimmed));
    }
    setIsEditingName(false);
  }, [dispatch, editedName, projectName]);

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditedName(projectName);
      setIsEditingName(false);
    }
  };

  const isOnBoard = location.pathname === "/";

  // Map routes to tab keys
  const routeToTab: Record<string, string> = {
    "/": "board",
    "/templates": "templates",
    "/head-to-head": "compare",
    "/themes": "themes",
    "/analytics": "analytics",
    "/import-export": "export",
  };

  const tabToRoute: Record<string, string> = {
    board: "/",
    templates: "/templates",
    compare: "/head-to-head",
    themes: "/themes",
    analytics: "/analytics",
    export: "/import-export",
  };

  const currentTab = routeToTab[location.pathname] ?? "board";

  const handleTabChange = (key: React.Key) => {
    const route = tabToRoute[String(key)];
    if (route) {
      navigate(route);
    }
  };

  return (
    <>
      {!hasCompletedOnboarding && <OnboardingWizard />}

      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 24px",
          }}>
            {/* Brand */}
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 8,
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "white",
                }}>T</span>
              </div>
              <span style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--spectrum-gray-100)",
              }}>
                Tiercade
              </span>
            </button>

            {/* Project Name */}
            {isOnBoard && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ color: "var(--spectrum-gray-500)", fontSize: 18 }}>/</span>
                {isEditingName ? (
                  <TextField
                    aria-label="Project name"
                    value={editedName}
                    onChange={setEditedName}
                    onKeyDown={handleNameKeyDown}
                    onBlur={handleSaveName}
                    autoFocus
                    size="S"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--spectrum-gray-300)",
                    }}
                  >
                    {projectName}
                  </button>
                )}
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Actions */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <ActionButton
                isQuiet
                size="S"
                onPress={() => dispatch(performUndo())}
                isDisabled={!canUndo}
                aria-label="Undo"
              >
                <Undo />
              </ActionButton>
              <ActionButton
                isQuiet
                size="S"
                onPress={() => dispatch(performRedo())}
                isDisabled={!canRedo}
                aria-label="Redo"
              >
                <Redo />
              </ActionButton>

              <Badge size="S" variant="neutral">
                Saved
              </Badge>
            </div>
          </div>

          {/* Navigation Tabs - Using S2 Tabs */}
          <div style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 24px",
          }}>
            <Tabs
              aria-label="Main navigation"
              selectedKey={currentTab}
              onSelectionChange={handleTabChange}
            >
              <TabList>
                <Tab id="board">Board</Tab>
                <Tab id="templates">Templates</Tab>
                <Tab id="compare">Compare</Tab>
                <Tab id="themes">Themes</Tab>
                <Tab id="analytics">Analytics</Tab>
                <Tab id="export">Export</Tab>
              </TabList>
            </Tabs>
          </div>
        </header>

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            maxWidth: 1400,
            width: "100%",
            margin: "0 auto",
            padding: 24,
            opacity: isTransitioning ? 0.5 : 1,
            transition: "opacity 200ms ease",
          }}
        >
          <PageErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<TierBoardPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/head-to-head" element={<HeadToHeadPage />} />
                <Route path="/themes" element={<ThemesPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/import-export" element={<ImportExportPage />} />
              </Routes>
            </Suspense>
          </PageErrorBoundary>
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "16px 24px",
          textAlign: "center",
        }}>
          <Text>
            Tiercade · Your data is stored locally in this browser
          </Text>
        </footer>
      </div>

      <PWAInstallPrompt />
    </>
  );
};

// Loading skeleton
const PageSkeleton: React.FC = () => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    gap: 16,
  }}>
    <div style={{
      height: 32,
      width: 200,
      borderRadius: 8,
      background: "rgba(255, 255, 255, 0.05)",
    }} />
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 80,
            borderRadius: 12,
            background: "rgba(255, 255, 255, 0.03)",
          }}
        />
      ))}
    </div>
  </div>
);

PageSkeleton.displayName = "PageSkeleton";
