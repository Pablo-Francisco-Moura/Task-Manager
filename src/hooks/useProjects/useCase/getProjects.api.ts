import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type { TypeGetProjectResponse } from "@/types";

export async function getProjects() {
  const response = await api.get<TypeGetProjectResponse>(ROUTES.PROJECT);
  const data = response.data;

  return data;
}
