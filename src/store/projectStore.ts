import { create } from "zustand";
import { selectedProjectStorageKey } from "@/constants/app";
import type { TypeLocalProject } from "@/types/localData";

interface IProjectState {
  selectedProject: TypeLocalProject | null;
  selectedProjectId: number | null;
  preferencesLoaded: boolean;
  setSelectedProject: (project: TypeLocalProject | null) => void;
  setSelectedProjectId: (projectId: number | null) => void;
  setPreferencesLoaded: () => void;
}

export const useProjectStore = create<IProjectState>((set) => ({
  selectedProject: null,
  selectedProjectId: null,
  preferencesLoaded: false,
  setSelectedProject: (project) => {
    set({ selectedProject: project, selectedProjectId: project?.id ?? null });
    try {
      if (typeof window !== "undefined") {
        if (project) {
          window.localStorage.setItem(
            selectedProjectStorageKey,
            String(project.id),
          );
        } else {
          window.localStorage.removeItem(selectedProjectStorageKey);
        }
      }
    } catch {
      // Keep project selection usable when browser storage is unavailable.
    }
  },
  setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),
  setPreferencesLoaded: () => set({ preferencesLoaded: true }),
}));
