import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type {
  TypeUpdateProjectInput,
  TypeUpdateProjectResponse,
} from "@/types";

export async function updateProject({
  id,
  name,
  description,
}: TypeUpdateProjectInput): Promise<TypeUpdateProjectResponse> {
  const response = await api.patch<TypeUpdateProjectResponse>(
    `${ROUTES.PROJECT}/${id}`,
    {
      name,
      description,
    },
  );

  return response.data;
}
