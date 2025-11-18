import React, { useEffect } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { TierBoardPage } from "../pages/TierBoardPage";
import { HeadToHeadPage } from "../pages/HeadToHeadPage";
import { ThemesPage } from "../pages/ThemesPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { ImportExportPage } from "../pages/ImportExportPage";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { performUndo, performRedo } from "@tiercade/state";

export const AppShell: React.FC = () => {
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector((state) => state.undoRedo.past.length > 0);
  const canRedo = useAppSelector((state) => state.undoRedo.future.length > 0);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, canUndo, canRedo]);

  const handleUndo = () => {
    if (canUndo) {
      dispatch(performUndo());
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      dispatch(performRedo());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <nav className="mx-auto max-w-6xl flex items-center gap-4 px-4 py-3 text-sm font-medium">
          <span className="text-slate-200 font-semibold mr-6">Tiercade</span>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "text-white" : "text-slate-400")}>
            Board
          </NavLink>
          <NavLink to="/head-to-head" className={({ isActive }) => (isActive ? "text-white" : "text-slate-400")}>
            Head-to-Head
          </NavLink>
          <NavLink to="/themes" className={({ isActive }) => (isActive ? "text-white" : "text-slate-400")}>
            Themes
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? "text-white" : "text-slate-400")}>
            Analytics
          </NavLink>
          <NavLink to="/import-export" className={({ isActive }) => (isActive ? "text-white" : "text-slate-400")}>
            Import/Export
          </NavLink>

          {/* Undo/Redo toolbar */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 enabled:hover:text-white"
              title="Undo (Cmd+Z)"
            >
              ↶ Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 enabled:hover:text-white"
              title="Redo (Cmd+Shift+Z)"
            >
              ↷ Redo
            </button>
          </div>
        </nav>
      </header>
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-4">
        <Routes>
          <Route path="/" element={<TierBoardPage />} />
          <Route path="/head-to-head" element={<HeadToHeadPage />} />
          <Route path="/themes" element={<ThemesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
        </Routes>
      </main>
    </div>
  );
};
