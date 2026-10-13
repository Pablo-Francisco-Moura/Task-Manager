import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type { TypeUpdateTaskInput, TypeUpdateTaskResponse } from "@/types";

export async function updateTask({
  id,
  name,
  projectId,
}: TypeUpdateTaskInput): Promise<TypeUpdateTaskResponse> {
  const response = await api.patch<TypeUpdateTaskResponse>(
    `${ROUTES.TASK}/${id}`,
    {
      name,
      projectId,
    },
  );
  return response.data;
}
