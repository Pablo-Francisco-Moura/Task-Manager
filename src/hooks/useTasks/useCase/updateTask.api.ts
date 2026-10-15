import { updateLocalTask } from "@/lib/localDataRepository";
import type { TypeUpdateTaskInput, TypeUpdateTaskResponse } from "@/types";

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
