import { create } from "zustand";
import type { TypeFeedbackSeverity } from "@/types";

interface IFeedbackState {
  open: boolean;
  message: string;
  severity: TypeFeedbackSeverity;
  showFeedback: (message: string, severity?: TypeFeedbackSeverity) => void;
  closeFeedback: () => void;
}

export const useFeedbackStore = create<IFeedbackState>((set) => ({
  open: false,
  message: "",
  severity: "success",
  showFeedback: (message, severity = "success") =>
    set({ message, severity, open: true }),
  closeFeedback: () => set({ open: false }),
}));
