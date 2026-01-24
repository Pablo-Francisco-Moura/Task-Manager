import { create } from "zustand";
import { TypeProject } from "@/types/Project";

interface ProjectState {
  selectedProject: TypeProject | null;
  setSelectedProject: (project: TypeProject | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  selectedProject: null,
  setSelectedProject: (project) => set({ selectedProject: project }),
}));
