import React, { useEffect, useState, useCallback, Suspense } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { TierBoardPage } from "../pages/TierBoardPage";
import { HeadToHeadPage } from "../pages/HeadToHeadPage";
import { ThemesPage } from "../pages/ThemesPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { ImportExportPage } from "../pages/ImportExportPage";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { performUndo, performRedo, setProjectName } from "@tiercade/state";
import { Button, IconButton } from "@tiercade/ui";
import { PageErrorBoundary } from "../components/ErrorBoundary";

export const AppShell: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const canUndo = useAppSelector((state) => state.undoRedo.past.length > 0);
  const canRedo = useAppSelector((state) => state.undoRedo.future.length > 0);
  const projectName = useAppSelector((state) => state.tier.projectName);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(projectName);

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
    <div className="min-h-screen flex flex-col bg-surface text-text">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface-soft/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center gap-4 px-4 py-3">
          {/* Logo & Project Name */}
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="flex items-center gap-2 text-text font-semibold hover:text-accent transition-colors"
            >
              <svg
                className="w-6 h-6 text-accent"
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
              <span className="hidden sm:inline">Tiercade</span>
            </NavLink>

            {isOnBoard && (
              <>
                <span className="text-text-subtle">/</span>
                {isEditingName ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={handleNameKeyDown}
                    className="px-2 py-1 bg-surface-raised border border-border rounded text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-sm text-text-muted hover:text-text transition-colors flex items-center gap-1"
                    title="Click to rename"
                  >
                    {projectName}
                    <svg
                      className="w-3 h-3 opacity-50"
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
          <nav className="hidden md:flex items-center gap-1 ml-6" role="navigation">
            <NavItem to="/" end>
              Board
            </NavItem>
            <NavItem to="/head-to-head">Head-to-Head</NavItem>
            <NavItem to="/themes">Themes</NavItem>
            <NavItem to="/analytics">Analytics</NavItem>
            <NavItem to="/import-export">Import/Export</NavItem>
          </nav>

          {/* Mobile nav dropdown would go here */}

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => dispatch(performUndo())}
                disabled={!canUndo}
                label="Undo (Cmd+Z)"
                icon={
                  <svg
                    className="w-4 h-4"
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
                }
              />
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => dispatch(performRedo())}
                disabled={!canRedo}
                label="Redo (Cmd+Shift+Z)"
                icon={
                  <svg
                    className="w-4 h-4"
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
                }
              />
            </div>

            {/* Saved indicator */}
            <span className="text-xs text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Saved
            </span>
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          <NavItem to="/" end>
            Board
          </NavItem>
          <NavItem to="/head-to-head">H2H</NavItem>
          <NavItem to="/themes">Themes</NavItem>
          <NavItem to="/analytics">Stats</NavItem>
          <NavItem to="/import-export">I/O</NavItem>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6">
        <PageErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<TierBoardPage />} />
              <Route path="/head-to-head" element={<HeadToHeadPage />} />
              <Route path="/themes" element={<ThemesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/import-export" element={<ImportExportPage />} />
            </Routes>
          </Suspense>
        </PageErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-soft py-4 px-4 text-center text-xs text-text-subtle">
        Tiercade • Your data is stored locally in this browser
      </footer>
    </div>
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
    className={({ isActive }) =>
      `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-accent text-white"
          : "text-text-muted hover:text-text hover:bg-surface-raised"
      }`
    }
  >
    {children}
  </NavLink>
);

// Loading skeleton for pages
const PageSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-surface-raised rounded w-48" />
    <div className="space-y-3">
      <div className="h-20 bg-surface-raised rounded" />
      <div className="h-20 bg-surface-raised rounded" />
      <div className="h-20 bg-surface-raised rounded" />
    </div>
  </div>
);
