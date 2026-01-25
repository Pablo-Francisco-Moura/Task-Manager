import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import { GetTaskResponse } from "./getTasks.types";

export async function getTasks(projectId?: number) {
  if (!projectId) return [];
  const response = await api.get<GetTaskResponse>(
    `${ROUTES.TASK}?projectId=${projectId}`,
  );
  return response.data;
}
