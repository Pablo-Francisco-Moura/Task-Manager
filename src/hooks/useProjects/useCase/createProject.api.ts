import {
  mapAccountProject,
  accountWorkspaceRequest,
  hasStoredAccountSession,
} from "@/lib/accountWorkspaceApi";
import { createLocalProject } from "@/lib/localDataRepository";
import type {
  TypeSerializedProject,
  TypeCreateProjectInput,
  TypeCreateProjectResponse,
} from "@/types";

export async function createProject(
  data: TypeCreateProjectInput,
): Promise<TypeCreateProjectResponse> {
  if (hasStoredAccountSession()) {
    const project = await accountWorkspaceRequest<TypeSerializedProject>(
      "/api/project",
      { method: "POST", body: JSON.stringify(data) },
    );
    return mapAccountProject(project);
  }

  return createLocalProject(data);
}
