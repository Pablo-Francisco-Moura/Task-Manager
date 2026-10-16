import type { TypeLocalWorkspaceData } from "@/types/localData";

export const LOCAL_STORAGE_KEY = "project_task_workspace_v1";

export const EMPTY_WORKSPACE_DATA: TypeLocalWorkspaceData = {
  nextProjectId: 1,
  nextTaskId: 1,
  projects: [],
  tasks: [],
};
