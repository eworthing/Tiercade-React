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
import { ActionButton, Button, StatusLight, TextField, Text } from "@react-spectrum/s2";
import { PageErrorBoundary } from "../components/ErrorBoundary";
import { OnboardingWizard } from "../components/OnboardingWizard";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

const frameStyles = style({
  minHeight: "[100vh]",
  display: "flex",
  flexDirection: "column",
});

const headerStyles = style({
  position: "sticky",
  top: 0,
  zIndex: 40,
  borderBottomWidth: 1,
  borderColor: "gray-200",
  backgroundColor: "layer-1",
});

const headerInnerStyles = style({
  maxWidth: 1152,
  marginX: "auto",
  display: "flex",
  alignItems: "center",
  gap: 16,
  paddingX: 16,
  paddingY: 12,
});

const mainStyles = style({
  flexGrow: 1,
  maxWidth: 1152,
  width: "[100%]",
  marginX: "auto",
  paddingX: 16,
  paddingY: 24,
});

const footerStyles = style({
  borderTopWidth: 1,
  borderColor: "gray-200",
  paddingX: 16,
  paddingY: 12,
  textAlign: "center",
});

const footerTextStyles = style({
  font: { size: "body-xs" },
  color: "gray-600",
});

const navStyles = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginStart: 24,
});

const brandButtonStyles = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
});

const projectNameRowStyles = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
});

const actionsRowStyles = style({
  marginStart: "auto",
  display: "flex",
  alignItems: "center",
  gap: 12,
});

const undoRedoStyles = style({
  display: "flex",
  alignItems: "center",
  gap: 4,
  paddingEnd: 12,
  marginEnd: 4,
  borderRightWidth: 1,
  borderColor: "gray-200",
});

const brandIconStyles = style({
  color: "accent",
});

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
      const timer = setTimeout(() => setIsTransitioning(false), 300);
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
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          dispatch(performUndo());
        }
      }
      // Cmd/Ctrl + Shift + Z for redo
      else if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (canRedo) {
          dispatch(performRedo());
        }
      }
      // Cmd/Ctrl + Y for redo (alternative)
      else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        if (canRedo) {
          dispatch(performRedo());
        }
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

  const navItems: Array<{ label: string; to: string; end?: boolean }> = [
    { label: "Board", to: "/", end: true },
    { label: "Templates", to: "/templates" },
    { label: "Head-to-Head", to: "/head-to-head" },
    { label: "Themes", to: "/themes" },
    { label: "Analytics", to: "/analytics" },
    { label: "Import/Export", to: "/import-export" },
  ];

  const isRouteActive = (to: string, end?: boolean) => {
    if (end) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <>
      {/* Onboarding Wizard */}
      {!hasCompletedOnboarding && <OnboardingWizard />}

      <div className={frameStyles}>
        {/* Header */}
        <header className={headerStyles}>
          <div className={headerInnerStyles}>
            {/* Brand + Project */}
            <div className={projectNameRowStyles}>
              <Button
                variant="secondary"
                fillStyle="outline"
                size="S"
                onPress={() => navigate("/")}
                styles={brandButtonStyles}
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className={brandIconStyles}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                <Text>Tiercade</Text>
              </Button>

              {isOnBoard && (
                <>
                  <Text>/</Text>
                  {isEditingName ? (
                    <TextField
                      aria-label="Project name"
                      value={editedName}
                      onChange={setEditedName}
                      onKeyDown={handleNameKeyDown}
                      onBlur={handleSaveName}
                      autoFocus
                      styles={style({ width: 240 })}
                    />
                  ) : (
                    <Button
                      variant="secondary"
                      fillStyle="outline"
                      size="S"
                      onPress={() => setIsEditingName(true)}
                    >
                      {projectName}
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Navigation */}
            <nav className={navStyles} role="navigation" aria-label="Primary">
              {navItems.map((item) => {
                const isActive = isRouteActive(item.to, item.end);
                return (
                  <Button
                    key={item.to}
                    variant={isActive ? "accent" : "secondary"}
                    fillStyle={isActive ? "fill" : "outline"}
                    size="S"
                    onPress={() => navigate(item.to)}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            {/* Right side actions */}
            <div className={actionsRowStyles}>
              {/* Undo/Redo */}
              <div className={undoRedoStyles}>
                <ActionButton
                  isQuiet
                  size="S"
                  onPress={() => dispatch(performUndo())}
                  isDisabled={!canUndo}
                  aria-label="Undo (Cmd+Z)"
                >
                  <svg
                    width={16}
                    height={16}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </ActionButton>
                <ActionButton
                  isQuiet
                  size="S"
                  onPress={() => dispatch(performRedo())}
                  isDisabled={!canRedo}
                  aria-label="Redo (Cmd+Shift+Z)"
                >
                  <svg
                    width={16}
                    height={16}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                    />
                  </svg>
                </ActionButton>
              </div>

              {/* Saved indicator */}
              <StatusLight variant="positive">Saved</StatusLight>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main
          className={mainStyles}
          style={{
            opacity: isTransitioning ? 0 : 1,
            transition: "opacity 200ms",
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
        <footer className={footerStyles}>
          <Text styles={footerTextStyles}>
            Tiercade • Your data is stored locally in this browser
          </Text>
        </footer>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  );
};

// Loading skeleton
const PageSkeleton: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {/* Title skeleton */}
    <div style={{
      height: 32,
      width: 192,
      borderRadius: 8,
      backgroundColor: "var(--spectrum-gray-200)"
    }} />

    {/* Content skeletons */}
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 80,
            borderRadius: 8,
            backgroundColor: "var(--spectrum-gray-200)"
          }}
        />
      ))}
    </div>
  </div>
);
