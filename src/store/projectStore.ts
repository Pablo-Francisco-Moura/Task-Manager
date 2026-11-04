import { create } from "zustand";
import { selectedProjectStorageKey } from "@/constants/app";
import type { TypeLocalProject } from "@/types/localData";

interface IProjectState {
  workspaceRole: "owner" | "member" | null;
  selectedProject: TypeLocalProject | null;
  selectedProjectId: number | null;
  activeWorkspaceId: string | null;
  preferencesLoaded: boolean;
  requestedActivityProjectId: number | null;
  setWorkspaceRole: (role: "owner" | "member" | null) => void;
  setSelectedProject: (project: TypeLocalProject | null) => void;
  setSelectedProjectId: (projectId: number | null) => void;
  setPreferencesLoaded: () => void;
  setActiveWorkspaceId: (workspaceId: string | null) => void;
  requestActivityForProject: (projectId: number) => void;
  clearRequestedActivityProject: () => void;
}

export const useProjectStore = create<IProjectState>((set) => ({
  workspaceRole: null,
  selectedProject: null,
  selectedProjectId: null,
  activeWorkspaceId: null,
  preferencesLoaded: false,
  requestedActivityProjectId: null,
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
  setActiveWorkspaceId: (workspaceId) =>
    set({ activeWorkspaceId: workspaceId }),
  setWorkspaceRole: (workspaceRole) => set({ workspaceRole }),
  requestActivityForProject: (requestedActivityProjectId) =>
    set({ requestedActivityProjectId }),
  clearRequestedActivityProject: () =>
    set({ requestedActivityProjectId: null }),
  setPreferencesLoaded: () => set({ preferencesLoaded: true }),
}));
