import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import { DeleteTaskResponse } from "./deleteTasks.types";

export async function deleteTask(id: number) {
  const response = await api.delete<DeleteTaskResponse>(`${ROUTES.TASK}/${id}`);
  return response.data;
}
