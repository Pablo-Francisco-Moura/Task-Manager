import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
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
  const response = await api.patch<TypeUpdateTaskResponse>(
    `${ROUTES.TASK}/${id}`,
    {
      name,
      dueAt,
      status,
      dueDate,
      priority,
      projectId,
      description,
    },
  );
  return response.data;
}
