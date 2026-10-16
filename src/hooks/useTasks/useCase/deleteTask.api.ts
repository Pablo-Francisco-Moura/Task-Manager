import {
  accountWorkspaceRequest,
  hasStoredAccountSession,
} from "@/lib/accountWorkspaceApi";
import { deleteLocalTask } from "@/lib/localDataRepository";

export async function deleteTask(id: number) {
  if (hasStoredAccountSession()) {
    await accountWorkspaceRequest(`/api/task/${id}`, { method: "DELETE" });
    return;
  }

  deleteLocalTask(id);
}
