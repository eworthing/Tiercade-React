import { useSelector, type TypedUseSelectorHook, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@tiercade/state";

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();

