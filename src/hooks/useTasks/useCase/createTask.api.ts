import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import { CreateTaskResponse } from "./createTasks.types";

export interface CreateTaskInput {
  name: string;
  projectId: number;
}

export async function createTask(
  data: CreateTaskInput,
): Promise<CreateTaskResponse> {
  const response = await api.post(ROUTES.TASK, data);
  return response.data;
}
