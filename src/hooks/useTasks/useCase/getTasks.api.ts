import {
  mapAccountTask,
  accountWorkspaceRequest,
  hasStoredAccountSession,
} from "@/lib/accountWorkspaceApi";
import { getLocalTasks } from "@/lib/localDataRepository";
import type { TypeGetTaskResponse, TypeSerializedTask } from "@/types";

export async function getTasks(projectId?: number) {
  if (!projectId) return [];
  if (hasStoredAccountSession()) {
    const tasks = await accountWorkspaceRequest<TypeSerializedTask[]>(
      `/api/task?projectId=${projectId}`,
    );
    return tasks.map(mapAccountTask) satisfies TypeGetTaskResponse;
  }

  return getLocalTasks(projectId) satisfies TypeGetTaskResponse;
}
