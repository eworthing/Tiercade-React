import React, { useEffect, useState, useCallback, Suspense, useRef, lazy } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";

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
import { ActionButton } from "@react-spectrum/s2";
import { PageErrorBoundary } from "../components/ErrorBoundary";
import { OnboardingWizard } from "../components/OnboardingWizard";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";

export const AppShell: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
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

  return (
    <>
      {/* Onboarding Wizard */}
      {!hasCompletedOnboarding && <OnboardingWizard />}

      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--spectrum-gray-50)",
        color: "var(--spectrum-gray-900)"
      }}>
        {/* Header */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: "1px solid var(--spectrum-gray-200)",
          backgroundColor: "var(--spectrum-gray-75)"
        }}>
          <div style={{
            maxWidth: 1152,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 16px"
          }}>
            {/* Logo & Project Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <NavLink
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--spectrum-gray-900)",
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                <svg
                  style={{ width: 24, height: 24, color: "var(--spectrum-blue-800)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                <span>Tiercade</span>
              </NavLink>

              {isOnBoard && (
                <>
                  <span style={{ color: "var(--spectrum-gray-500)" }}>/</span>
                  {isEditingName ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={handleNameKeyDown}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "var(--spectrum-gray-100)",
                        border: "1px solid var(--spectrum-gray-300)",
                        borderRadius: 4,
                        fontSize: 14,
                        color: "var(--spectrum-gray-900)"
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setIsEditingName(true)}
                      style={{
                        fontSize: 14,
                        color: "var(--spectrum-gray-700)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                      title="Click to rename"
                    >
                      {projectName}
                      <svg
                        style={{ width: 12, height: 12, opacity: 0.5 }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Navigation */}
            <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 24 }} role="navigation">
              <NavItem to="/" end>Board</NavItem>
              <NavItem to="/templates">Templates</NavItem>
              <NavItem to="/head-to-head">Head-to-Head</NavItem>
              <NavItem to="/themes">Themes</NavItem>
              <NavItem to="/analytics">Analytics</NavItem>
              <NavItem to="/import-export">Import/Export</NavItem>
            </nav>

            {/* Right side actions */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {/* Undo/Redo */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, borderRight: "1px solid var(--spectrum-gray-300)", paddingRight: 8, marginRight: 4 }}>
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
              <span style={{ fontSize: 12, color: "var(--spectrum-green-800)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--spectrum-green-700)"
                }} />
                Saved
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          maxWidth: 1152,
          width: "100%",
          margin: "0 auto",
          padding: "24px 16px",
          opacity: isTransitioning ? 0 : 1,
          transition: "opacity 300ms"
        }}>
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
          borderTop: "1px solid var(--spectrum-gray-200)",
          padding: "16px",
          textAlign: "center",
          fontSize: 12,
          color: "var(--spectrum-gray-600)"
        }}>
          Tiercade • Your data is stored locally in this browser
        </footer>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  );
};

// Navigation item component
const NavItem: React.FC<{
  to: string;
  end?: boolean;
  children: React.ReactNode;
}> = ({ to, end, children }) => (
  <NavLink
    to={to}
    end={end}
    style={({ isActive }) => ({
      padding: "6px 12px",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      textDecoration: "none",
      transition: "background-color 150ms",
      backgroundColor: isActive ? "var(--spectrum-blue-100)" : "transparent",
      color: isActive ? "var(--spectrum-blue-900)" : "var(--spectrum-gray-700)"
    })}
  >
    {children}
  </NavLink>
);

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
