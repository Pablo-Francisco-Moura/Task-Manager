import { Task } from "@prisma/client";
import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import { UpdateTaskResponse } from "./updateTask.types";

export async function updateTask({
  id,
  name,
  projectId,
}: Task): Promise<UpdateTaskResponse> {
  const response = await api.patch(`${ROUTES.TASK}/${id}`, {
    name,
    projectId,
  });
  return response.data;
}
