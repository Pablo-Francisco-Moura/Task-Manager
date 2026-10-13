import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type { TypeDeleteTaskResponse } from "@/types";

export async function deleteTask(id: number) {
  const response = await api.delete<TypeDeleteTaskResponse>(
    `${ROUTES.TASK}/${id}`,
  );
  return response.data;
}
