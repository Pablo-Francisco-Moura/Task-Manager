import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import { DeleteProjectResponse } from "./deleteProject.types";

export async function deleteProject(id: number) {
  const response = await api.delete<DeleteProjectResponse>(
    `${ROUTES.PROJECT}/${id}`,
  );
  return response.data;
}
