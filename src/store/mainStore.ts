import { create } from "zustand";
import { TypeTab } from "@/types/Main";
import { defaultSelectedTab, selectedTabStorageKey } from "@/constants/app";

interface IMainState {
  selectedTab: TypeTab;
  setSelectedTab: (tab: TypeTab) => void;
}

export const useMainStore = create<IMainState>((set) => ({
  selectedTab: defaultSelectedTab,
  setSelectedTab: (tab) => {
    set({ selectedTab: tab });
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(selectedTabStorageKey, tab);
      }
    } catch {
      // Keep navigation usable when browser storage is unavailable.
    }
  },
}));
