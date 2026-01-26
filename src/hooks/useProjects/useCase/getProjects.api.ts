import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import { GetProjectResponse } from "./getProjects.types";

export async function getProjects() {
  const response = await api.get<GetProjectResponse>(ROUTES.PROJECT);
  const data = response.data;

  return data;
}
