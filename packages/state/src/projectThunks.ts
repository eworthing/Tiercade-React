/**
 * Thunks for loading projects using ModelResolver
 */

import { ModelResolver, Project } from "@tiercade/core";
import { loadProject } from "./tierSlice";
import { captureSnapshot } from "./undoRedoThunks";
import type { AppThunk } from "./headToHeadThunks"; // Reuse the AppThunk type

/**
 * Load a Project into the tier state.
 * Uses ModelResolver to convert the project into the app's state shape.
 */
export function loadProjectFromData(project: Project): AppThunk {
  return (dispatch) => {
    const resolved = ModelResolver.resolvedTierState(project);

    dispatch(
      loadProject({
        tiers: resolved.items,
        tierOrder: resolved.order,
        tierLabels: resolved.labels,
        tierColors: resolved.colors,
      })
    );
  };
}

/**
 * Load the default bundled project (for initial app state).
 */
export function loadDefaultProject(): AppThunk {
  return async (dispatch) => {
    // Dynamic import to avoid bundling JSON at top level
    const { DEFAULT_PROJECT } = await import("@tiercade/core/src/bundled");
    dispatch(loadProjectFromData(DEFAULT_PROJECT));
  };
}

/**
 * Import from JSON string.
 */
export function importJSON(jsonString: string): AppThunk {
  return (dispatch) => {
    dispatch(captureSnapshot("Import JSON"));
    const project = ModelResolver.decodeProject(jsonString);
    dispatch(loadProjectFromData(project));
  };
}

/**
 * Import from CSV string.
 */
export function importCSV(csvString: string): AppThunk {
  return (dispatch, getState) => {
    dispatch(captureSnapshot("Import CSV"));

    const currentTierOrder = getState().tier.tierOrder;
    const { items, discoveredTiers } = ModelResolver.parseCSV(
      csvString,
      currentTierOrder
    );

    // Merge discovered tiers into tier order
    const newTierOrder = [
      ...currentTierOrder,
      ...discoveredTiers.filter((t) => !currentTierOrder.includes(t)),
    ];

    dispatch(
      loadProject({
        tiers: items,
        tierOrder: newTierOrder,
        tierLabels: {}, // CSV import doesn't provide labels
        tierColors: {}, // CSV import doesn't provide colors
      })
    );
  };
}
