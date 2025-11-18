import { useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState } from "@tiercade/state";

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

