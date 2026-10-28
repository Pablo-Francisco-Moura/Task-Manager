import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LOCAL_STORAGE_KEY } from "@/constants/localData";
import { accountWorkspaceRequest } from "@/lib/accountWorkspaceApi";
import { importLocalWorkspaceData } from "@/lib/localDataRepository";
import { ACCOUNT_IMPORT_STORAGE_KEY } from "@/constants/session";

export function useWorkspaceImportActions() {
  const { t } = useTranslation();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const importLocalWorkspaceIntoAccount = async () => {
    const savedWorkspaceData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedWorkspaceData) return { projectCount: 0, taskCount: 0 };

    return importLocalWorkspaceData({
      createProject: async ({ name, description }) => {
        const payload = await accountWorkspaceRequest<{ id: number }>(
          "/api/project",
          {
            method: "POST",
            body: JSON.stringify({ name, description }),
          },
        );
        const projectId = Number(payload.id);
        if (!Number.isFinite(projectId)) {
          throw new Error(t("account.create.error"));
        }
        return { id: projectId };
      },
      createTask: async ({
        name,
        projectId,
        description,
        dueDate,
        dueAt,
        status,
        priority,
      }) =>
        accountWorkspaceRequest("/api/task", {
          method: "POST",
          body: JSON.stringify({
            name,
            projectId,
            description,
            dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : undefined,
            dueAt: dueAt ? dueAt.toISOString() : undefined,
            status,
            priority,
          }),
        }),
    });
  };

  const closeImportDialog = async (nextStatus?: "imported" | "dismissed") => {
    if (nextStatus === "imported") {
      try {
        await importLocalWorkspaceIntoAccount();
      } catch {
        return;
      }
    }

    setIsImportDialogOpen(false);
    try {
      window.localStorage.setItem(
        ACCOUNT_IMPORT_STORAGE_KEY,
        JSON.stringify({
          status: nextStatus ?? "dismissed",
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Keep the flow in memory when local storage is unavailable.
    }
  };

  return {
    isImportDialogOpen,
    setIsImportDialogOpen,
    closeImportDialog,
  };
}
