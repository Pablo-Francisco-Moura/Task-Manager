import { create } from "zustand";
import { TypeTab } from "@/types/Main";
import { defaultSelectedTab } from "@/constants/app";

interface IMainState {
  selectedTab: TypeTab;
  setSelectedTab: (tab: TypeTab) => void;
}

export const useMainStore = create<IMainState>((set) => ({
  selectedTab: defaultSelectedTab,
  setSelectedTab: (tab) => set({ selectedTab: tab }),
}));
