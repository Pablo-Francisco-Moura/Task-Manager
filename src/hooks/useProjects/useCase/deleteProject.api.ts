import {
  accountWorkspaceRequest,
  hasStoredAccountSession,
} from "@/lib/accountWorkspaceApi";
import { deleteLocalProject } from "@/lib/localDataRepository";

export async function deleteProject(id: number) {
  if (hasStoredAccountSession()) {
    await accountWorkspaceRequest(`/api/project/${id}`, { method: "DELETE" });
    return;
  }

  deleteLocalProject(id);
}
