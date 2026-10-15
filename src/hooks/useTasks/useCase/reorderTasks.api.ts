import { reorderLocalTasks } from "@/lib/localDataRepository";
import type { TypeReorderTasksInput, TypeReorderTasksResponse } from "@/types";

export async function reorderTasks({
  projectId,
  orderedTaskIdsByStatus,
}: TypeReorderTasksInput): Promise<TypeReorderTasksResponse> {
  return reorderLocalTasks({ projectId, orderedTaskIdsByStatus });
}
