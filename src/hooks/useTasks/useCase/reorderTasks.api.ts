import {
  mapAccountTask,
  accountWorkspaceRequest,
  hasStoredAccountSession,
} from "@/lib/accountWorkspaceApi";
import { reorderLocalTasks } from "@/lib/localDataRepository";
import type {
  TypeSerializedTask,
  TypeReorderTasksInput,
  TypeReorderTasksResponse,
} from "@/types";

export async function reorderTasks({
  projectId,
  orderedTaskIdsByStatus,
}: TypeReorderTasksInput): Promise<TypeReorderTasksResponse> {
  if (hasStoredAccountSession()) {
    const tasks = await accountWorkspaceRequest<TypeSerializedTask[]>(
      "/api/task/reorder",
      {
        method: "PATCH",
        body: JSON.stringify({ projectId, orderedTaskIdsByStatus }),
      },
    );
    return tasks.map(mapAccountTask);
  }

  return reorderLocalTasks({ projectId, orderedTaskIdsByStatus });
}
