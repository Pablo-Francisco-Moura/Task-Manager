import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type {
  TypeCreateProjectInput,
  TypeCreateProjectResponse,
} from "@/types";

export async function createProject(
  data: TypeCreateProjectInput,
): Promise<TypeCreateProjectResponse> {
  const response = await api.post<TypeCreateProjectResponse>(
    ROUTES.PROJECT,
    data,
  );
  return response.data;
}
