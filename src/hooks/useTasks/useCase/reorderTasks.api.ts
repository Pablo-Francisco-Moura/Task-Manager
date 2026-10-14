import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type { TypeReorderTasksInput, TypeReorderTasksResponse } from "@/types";

export async function reorderTasks({
  projectId,
  orderedTaskIdsByStatus,
}: TypeReorderTasksInput): Promise<TypeReorderTasksResponse> {
  const response = await api.patch<TypeReorderTasksResponse>(
    `${ROUTES.TASK}/reorder`,
    { projectId, orderedTaskIdsByStatus },
  );
  return response.data;
}
