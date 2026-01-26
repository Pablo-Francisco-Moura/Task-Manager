import { api } from "@/lib/axios";
import { ROUTES } from "@/constants";
import { UpdateProjectResponse } from "./updateProject.types";

export async function updateProject({
  id,
  name,
}: UpdateProjectResponse): Promise<UpdateProjectResponse> {
  const response = await api.patch<UpdateProjectResponse>(
    `${ROUTES.PROJECT}/${id}`,
    {
      name,
    },
  );

  return response.data;
}
