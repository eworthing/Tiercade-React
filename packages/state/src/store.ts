import { configureStore } from "@reduxjs/toolkit";
import { tierReducer } from "./tierSlice";
import { headToHeadReducer } from "./headToHeadSlice";
import { themeReducer } from "./themeSlice";
import { undoRedoReducer } from "./undoRedoSlice";

export const store = configureStore({
  reducer: {
    tier: tierReducer,
    headToHead: headToHeadReducer,
    theme: themeReducer,
    undoRedo: undoRedoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
