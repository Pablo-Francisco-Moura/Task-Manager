import { ROUTES } from "@/constants";
import { api } from "@/lib/axios";
import { GetProjectResponse } from "./getProjects.types";

export async function getProjects() {
  const response = await api.get<GetProjectResponse>(ROUTES.PROJECT);
  const data = response.data;

  return data;
}
