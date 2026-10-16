import {
  accountWorkspaceRequest,
  hasStoredAccountSession,
  mapAccountProjectWithTasks,
} from "@/lib/accountWorkspaceApi";
import { getLocalProjects } from "@/lib/localDataRepository";
import type {
  TypeGetProjectResponse,
  TypeSerializedProjectWithTasks,
} from "@/types";

export async function getProjects() {
  if (hasStoredAccountSession()) {
    const projects =
      await accountWorkspaceRequest<TypeSerializedProjectWithTasks[]>(
        "/api/project",
      );
    return projects.map(
      mapAccountProjectWithTasks,
    ) satisfies TypeGetProjectResponse;
  }

  return getLocalProjects() satisfies TypeGetProjectResponse;
}
