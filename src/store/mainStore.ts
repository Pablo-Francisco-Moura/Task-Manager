import { create } from "zustand";
import { TypeTab } from "@/types/Main";
import { defaultSelectedTab } from "@/constants/app";

interface MainState {
  selectedTab: TypeTab;
  setSelectedTab: (tab: TypeTab) => void;
}

export const useMainStore = create<MainState>((set) => ({
  selectedTab: defaultSelectedTab,
  setSelectedTab: (tab) => set({ selectedTab: tab }),
}));
