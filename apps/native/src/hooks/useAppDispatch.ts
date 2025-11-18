import { useDispatch } from "react-redux";
import type { AppDispatch } from "@tiercade/state";

export const useAppDispatch: () => AppDispatch = useDispatch;

