import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type { TypeCreateTaskInput, TypeCreateTaskResponse } from "@/types";

export async function createTask(
  data: TypeCreateTaskInput,
): Promise<TypeCreateTaskResponse> {
  const response = await api.post<TypeCreateTaskResponse>(ROUTES.TASK, data);
  return response.data;
}
