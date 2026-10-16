import {
  mapAccountTask,
  accountWorkspaceRequest,
  hasStoredAccountSession,
} from "@/lib/accountWorkspaceApi";
import { updateLocalTask } from "@/lib/localDataRepository";
import type {
  TypeSerializedTask,
  TypeUpdateTaskInput,
  TypeUpdateTaskResponse,
} from "@/types";

export async function updateTask({
  id,
  name,
  dueAt,
  status,
  dueDate,
  priority,
  projectId,
  description,
}: TypeUpdateTaskInput): Promise<TypeUpdateTaskResponse> {
  if (hasStoredAccountSession()) {
    const task = await accountWorkspaceRequest<TypeSerializedTask>(
      `/api/task/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name,
          dueAt,
          status,
          dueDate,
          priority,
          projectId,
          description,
        }),
      },
    );
    return mapAccountTask(task);
  }

  return updateLocalTask(id, {
    name,
    dueAt: typeof dueAt === "string" ? new Date(dueAt) : dueAt,
    status,
    dueDate:
      typeof dueDate === "string"
        ? new Date(`${dueDate}T00:00:00.000Z`)
        : dueDate,
    priority,
    projectId,
    description,
  });
}
