import {
  mapAccountProject,
  accountWorkspaceRequest,
  hasStoredAccountSession,
} from "@/lib/accountWorkspaceApi";
import { updateLocalProject } from "@/lib/localDataRepository";
import type {
  TypeSerializedProject,
  TypeUpdateProjectInput,
  TypeUpdateProjectResponse,
} from "@/types";

export async function updateProject({
  id,
  name,
  description,
}: TypeUpdateProjectInput): Promise<TypeUpdateProjectResponse> {
  if (hasStoredAccountSession()) {
    const project = await accountWorkspaceRequest<TypeSerializedProject>(
      `/api/project/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name, description }),
      },
    );
    return mapAccountProject(project);
  }

  return updateLocalProject(id, { name, description });
}
