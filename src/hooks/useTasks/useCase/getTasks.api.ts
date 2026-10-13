import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type { TypeGetTaskResponse } from "@/types";

export async function getTasks(projectId?: number) {
  if (!projectId) return [];
  const response = await api.get<TypeGetTaskResponse>(
    `${ROUTES.TASK}?projectId=${projectId}`,
  );
  return response.data;
}
