import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import type { TypeUpdateProjectResponse } from "@/types";

export async function updateProject({
  id,
  name,
}: TypeUpdateProjectResponse): Promise<TypeUpdateProjectResponse> {
  const response = await api.patch<TypeUpdateProjectResponse>(
    `${ROUTES.PROJECT}/${id}`,
    {
      name,
    },
  );

  return response.data;
}
