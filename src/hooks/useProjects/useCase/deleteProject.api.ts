import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type { TypeDeleteProjectResponse } from "@/types";

export async function deleteProject(id: number) {
  const response = await api.delete<TypeDeleteProjectResponse>(
    `${ROUTES.PROJECT}/${id}`,
  );
  return response.data;
}
