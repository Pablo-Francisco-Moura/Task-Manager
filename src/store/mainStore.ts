import { create } from "zustand";
import { TypeTab } from "@/types/Main";

interface MainState {
  selectedTab: TypeTab;
  setSelectedTab: (tab: TypeTab) => void;
}

export const useMainStore = create<MainState>((set) => ({
  selectedTab: "project",
  setSelectedTab: (tab) => set({ selectedTab: tab }),
}));
