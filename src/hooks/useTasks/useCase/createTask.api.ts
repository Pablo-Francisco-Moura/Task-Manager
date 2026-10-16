import {
  mapAccountTask,
  accountWorkspaceRequest,
  hasStoredAccountSession,
} from "@/lib/accountWorkspaceApi";
import { createLocalTask } from "@/lib/localDataRepository";
import type {
  TypeSerializedTask,
  TypeCreateTaskInput,
  TypeCreateTaskResponse,
} from "@/types";

export async function createTask(
  data: TypeCreateTaskInput,
): Promise<TypeCreateTaskResponse> {
  if (hasStoredAccountSession()) {
    const task = await accountWorkspaceRequest<TypeSerializedTask>(
      "/api/task",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    return mapAccountTask(task);
  }

  return createLocalTask({
    ...data,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00.000Z`) : null,
  });
}
