import {
  accountWorkspaceRequest,
  isAccountSessionExpired,
} from "@/lib/accountWorkspaceApi";
import { useRouter } from "next/navigation";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { workspaceUrl } from "@/utils/workspaceUrl";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { ACCOUNT_SESSION_STORAGE_KEY } from "@/constants/session";
import type { TypeAccountSessionState, TypeWorkspaceMembership } from "@/types";

interface IProps {
  accountSession: TypeAccountSessionState | null;
  newWorkspaceName: string;
  accountWorkspaces: TypeWorkspaceMembership[];
  activeWorkspaceId: string | null;
  workspaceToDelete: TypeWorkspaceMembership | null;
  renamedWorkspaceName: string;
  setProfileAnchor: (anchor: HTMLElement | null) => void;
  setWorkspaceError: (error: string | null) => void;
  setAccountSession: (session: TypeAccountSessionState) => void;
  setAccountWorkspaces: React.Dispatch<
    React.SetStateAction<TypeWorkspaceMembership[]>
  >;
  setNewWorkspaceName: (name: string) => void;
  setActiveWorkspaceId: (workspaceId: string | null) => void;
  setWorkspaceToDelete: (workspace: TypeWorkspaceMembership | null) => void;
  setIsCreatingWorkspace: (loading: boolean) => void;
  setIsDeletingWorkspace: (loading: boolean) => void;
  setIsRenamingWorkspace: (loading: boolean) => void;
  setRenamedWorkspaceName: (name: string) => void;
  setSwitchingWorkspaceId: (workspaceId: string | null) => void;
  setIsCreateWorkspaceOpen: (open: boolean) => void;
  setIsRenameWorkspaceOpen: (open: boolean) => void;
}

export function useWorkspaceActions({
  accountSession,
  newWorkspaceName,
  workspaceToDelete,
  accountWorkspaces,
  activeWorkspaceId,
  renamedWorkspaceName,
  setProfileAnchor,
  setAccountSession,
  setWorkspaceError,
  setNewWorkspaceName,
  setAccountWorkspaces,
  setActiveWorkspaceId,
  setWorkspaceToDelete,
  setIsCreatingWorkspace,
  setIsDeletingWorkspace,
  setIsRenamingWorkspace,
  setRenamedWorkspaceName,
  setSwitchingWorkspaceId,
  setIsCreateWorkspaceOpen,
  setIsRenameWorkspaceOpen,
}: IProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSelectedProject = useProjectStore(
    (state) => state.setSelectedProject,
  );
  const setStoreWorkspaceId = useProjectStore(
    (state) => state.setActiveWorkspaceId,
  );

  const switchWorkspace = async (workspaceId: string) => {
    if (!accountSession || workspaceId === activeWorkspaceId) {
      setProfileAnchor(null);
      return;
    }

    setSwitchingWorkspaceId(workspaceId);
    setWorkspaceError(null);
    try {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: [QUERY_KEYS.PROJECTS] }),
        queryClient.cancelQueries({ queryKey: [QUERY_KEYS.TASKS] }),
      ]);
      const payload = await accountWorkspaceRequest<{
        activeWorkspaceId: string;
        workspace: TypeWorkspaceMembership;
      }>("/api/session/workspace", {
        method: "PATCH",
        body: JSON.stringify({ workspaceId }),
      });
      const nextSession = {
        ...accountSession,
        workspaceId: payload.activeWorkspaceId,
        workspaceName: payload.workspace.name,
      };
      persistAccountSession(nextSession);
      setAccountSession(nextSession);
      setAccountWorkspaces((workspaces) =>
        workspaces.map((workspace) =>
          workspace.id === payload.workspace.id ? payload.workspace : workspace,
        ),
      );
      setActiveWorkspaceId(payload.activeWorkspaceId);
      setStoreWorkspaceId(payload.activeWorkspaceId);
      setSelectedProject(null);
      setProfileAnchor(null);
      router.push(workspaceUrl(payload.workspace));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] }),
      ]);
    } catch (error) {
      if (!isAccountSessionExpired(error)) {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : t("account.workspaceSwitchError"),
        );
      }
    } finally {
      setSwitchingWorkspaceId(null);
    }
  };

  const createWorkspace = async () => {
    const name = newWorkspaceName.trim();
    if (!name) return;

    setIsCreatingWorkspace(true);
    setWorkspaceError(null);
    try {
      const payload = await accountWorkspaceRequest<{
        workspace: TypeWorkspaceMembership;
        activeWorkspaceId: string;
      }>("/api/session/workspace", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const nextSession = {
        ...accountSession!,
        workspaceId: payload.activeWorkspaceId,
        workspaceName: payload.workspace.name,
      };
      persistAccountSession(nextSession);
      setAccountSession(nextSession);
      setAccountWorkspaces((workspaces) => [...workspaces, payload.workspace]);
      setActiveWorkspaceId(payload.activeWorkspaceId);
      setStoreWorkspaceId(payload.activeWorkspaceId);
      setSelectedProject(null);
      router.push(workspaceUrl(payload.workspace));
      setIsCreateWorkspaceOpen(false);
      setNewWorkspaceName("");
      setProfileAnchor(null);
      await invalidateWorkspaceQueries(queryClient);
    } catch (error) {
      if (!isAccountSessionExpired(error)) {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : t("account.workspaceCreateError"),
        );
      }
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const deleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    setIsDeletingWorkspace(true);
    setWorkspaceError(null);
    try {
      const payload = await accountWorkspaceRequest<{
        deletedWorkspaceId: string;
        activeWorkspaceId: string;
        workspaceName: string;
      }>(`/api/session/workspace/${workspaceToDelete.id}`, {
        method: "DELETE",
      });
      const nextSession = {
        ...accountSession!,
        workspaceId: payload.activeWorkspaceId,
        workspaceName: payload.workspaceName,
      };
      persistAccountSession(nextSession);
      setAccountSession(nextSession);
      setAccountWorkspaces((workspaces) =>
        workspaces.filter(
          (workspace) => workspace.id !== payload.deletedWorkspaceId,
        ),
      );
      setActiveWorkspaceId(payload.activeWorkspaceId);
      setStoreWorkspaceId(payload.activeWorkspaceId);
      if (payload.deletedWorkspaceId === activeWorkspaceId) {
        router.push(
          workspaceUrl({
            id: payload.activeWorkspaceId,
            name: payload.workspaceName,
          }),
        );
      }
      if (payload.deletedWorkspaceId === activeWorkspaceId) {
        setSelectedProject(null);
      }
      setWorkspaceToDelete(null);
      setProfileAnchor(null);
      await invalidateWorkspaceQueries(queryClient);
    } catch (error) {
      if (!isAccountSessionExpired(error)) {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : t("account.workspaceDeleteError"),
        );
      }
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  const renameWorkspace = async () => {
    const activeWorkspace = accountWorkspaces.find(
      (workspace) => workspace.id === activeWorkspaceId,
    );
    const name = renamedWorkspaceName.trim();
    if (!activeWorkspace || !name) return;

    setIsRenamingWorkspace(true);
    setWorkspaceError(null);
    try {
      const payload = await accountWorkspaceRequest<{
        workspace: TypeWorkspaceMembership;
      }>(`/api/session/workspace/${activeWorkspace.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      const nextSession = {
        ...accountSession!,
        workspaceName: payload.workspace.name,
      };
      persistAccountSession(nextSession);
      setAccountSession(nextSession);
      setAccountWorkspaces((workspaces) =>
        workspaces.map((workspace) =>
          workspace.id === payload.workspace.id ? payload.workspace : workspace,
        ),
      );
      router.replace(workspaceUrl(payload.workspace));
      setIsRenameWorkspaceOpen(false);
      setRenamedWorkspaceName("");
    } catch (error) {
      if (!isAccountSessionExpired(error)) {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : t("account.workspaceRenameError"),
        );
      }
    } finally {
      setIsRenamingWorkspace(false);
    }
  };

  return { switchWorkspace, createWorkspace, deleteWorkspace, renameWorkspace };
}

function persistAccountSession(session: TypeAccountSessionState) {
  try {
    window.localStorage.setItem(
      ACCOUNT_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
  } catch {
    // Keep the active workspace in memory when local storage is unavailable.
  }
}

async function invalidateWorkspaceQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] }),
  ]);
}
