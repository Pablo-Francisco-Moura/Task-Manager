import { create } from "zustand";

export type MainTab = "project" | "task";

interface MainState {
  selectedTab: MainTab;
  setSelectedTab: (tab: MainTab) => void;
}

export const useMainStore = create<MainState>((set) => ({
  selectedTab: "project",
  setSelectedTab: (tab) => set({ selectedTab: tab }),
}));
