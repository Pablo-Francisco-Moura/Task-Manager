import { create } from "zustand";
import { Project } from "@prisma/client";
import { selectedProjectStorageKey } from "@/constants/app";

interface IProjectState {
  selectedProject: Project | null;
  selectedProjectId: number | null;
  preferencesLoaded: boolean;
  setSelectedProject: (project: Project | null) => void;
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
