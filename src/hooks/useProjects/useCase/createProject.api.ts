import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import { CreateProjectResponse } from "./createProject.types";

export interface CreateProjectInput {
  name: string;
}

export async function createProject(
  data: CreateProjectInput,
): Promise<CreateProjectResponse> {
  const response = await api.post<CreateProjectResponse>(ROUTES.PROJECT, data);
  return response.data;
}
