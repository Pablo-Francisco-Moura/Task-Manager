"use client";

import {
  useEffect,
  type Dispatch,
  type SetStateAction,
  type MutableRefObject,
} from "react";
import {
  GUEST_PROFILE_STORAGE_KEY,
  ACCOUNT_IMPORT_STORAGE_KEY,
  ACCOUNT_SESSION_STORAGE_KEY,
} from "@/constants/session";
import {
  accountWorkspaceRequest,
  isAccountSessionExpired,
  ACCOUNT_SESSION_EXPIRED_EVENT,
} from "@/lib/accountWorkspaceApi";
import { useRouter } from "next/navigation";
import { workspaceUrl } from "@/utils/workspaceUrl";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { LOCAL_STORAGE_KEY } from "@/constants/localData";
import type {
  TypeGuestProfileState,
  TypeAccountSessionState,
  TypeWorkspaceMembership,
} from "@/types";

type Setter<T> = Dispatch<SetStateAction<T>>;

interface IProps {
  accountSession: TypeAccountSessionState | null;
  setAccountSession: Setter<TypeAccountSessionState | null>;
  setGuestProfile: Setter<TypeGuestProfileState>;
  accountWorkspaces: TypeWorkspaceMembership[];
  setAccountWorkspaces: Setter<TypeWorkspaceMembership[]>;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: Setter<string | null>;
  setIsImportDialogOpen: Setter<boolean>;
  setIsLoadingWorkspaces: Setter<boolean>;
  setWorkspaceError: Setter<string | null>;
  workspaceListRefreshKey: number;
  signOutActionRef: MutableRefObject<() => Promise<void>>;
}

export function useAppBarSession({
  accountSession,
  setAccountSession,
  setGuestProfile,
  accountWorkspaces,
  setAccountWorkspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  setIsImportDialogOpen,
  setIsLoadingWorkspaces,
  setWorkspaceError,
  workspaceListRefreshKey,
  signOutActionRef,
}: IProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const setStoreWorkspaceId = useProjectStore(
    (state) => state.setActiveWorkspaceId,
  );
  const setStoreWorkspaceRole = useProjectStore(
    (state) => state.setWorkspaceRole,
  );

  useEffect(() => {
    const handleExpiredAccountSession = () => {
      void signOutActionRef.current();
    };
    window.addEventListener(
      ACCOUNT_SESSION_EXPIRED_EVENT,
      handleExpiredAccountSession,
    );
    return () => {
      window.removeEventListener(
        ACCOUNT_SESSION_EXPIRED_EVENT,
        handleExpiredAccountSession,
      );
    };
  }, [signOutActionRef]);

  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem(
        GUEST_PROFILE_STORAGE_KEY,
      );
      if (!savedProfile) return;

      const parsedProfile = JSON.parse(
        savedProfile,
      ) as Partial<TypeGuestProfileState>;
      setGuestProfile({
        displayName:
          typeof parsedProfile.displayName === "string"
            ? parsedProfile.displayName.trim()
            : "",
      });
    } catch {
      setGuestProfile({ displayName: "" });
    }
  }, [setGuestProfile]);

  useEffect(() => {
    if (!accountSession) {
      setIsImportDialogOpen(false);
      return;
    }

    try {
      const savedImportState = window.localStorage.getItem(
        ACCOUNT_IMPORT_STORAGE_KEY,
      );
      if (savedImportState) {
        return;
      }

      const savedWorkspaceData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!savedWorkspaceData) {
        return;
      }

      const parsedWorkspaceData = JSON.parse(savedWorkspaceData) as {
        projects?: Array<unknown>;
        tasks?: Array<unknown>;
      };

      const hasLocalWorkspaceData =
        Array.isArray(parsedWorkspaceData.projects) &&
        parsedWorkspaceData.projects.length > 0
          ? true
          : Array.isArray(parsedWorkspaceData.tasks) &&
            parsedWorkspaceData.tasks.length > 0;

      if (hasLocalWorkspaceData) {
        setIsImportDialogOpen(true);
      }
    } catch {
      setIsImportDialogOpen(false);
    }
  }, [accountSession, setIsImportDialogOpen]);

  useEffect(() => {
    let isCurrent = true;
    const restoreAccountSession = async () => {
      try {
        const savedValue = window.localStorage.getItem(
          ACCOUNT_SESSION_STORAGE_KEY,
        );
        if (savedValue) {
          const parsedValue = JSON.parse(
            savedValue,
          ) as Partial<TypeAccountSessionState>;
          const restoredSession: TypeAccountSessionState = {
            displayName:
              typeof parsedValue.displayName === "string"
                ? parsedValue.displayName.trim()
                : "",
            workspaceName:
              typeof parsedValue.workspaceName === "string" &&
              parsedValue.workspaceName.trim()
                ? parsedValue.workspaceName.trim()
                : "Pessoal",
            workspaceId:
              typeof parsedValue.workspaceId === "string"
                ? parsedValue.workspaceId
                : undefined,
          };
          setAccountSession(restoredSession);
          setStoreWorkspaceId(restoredSession.workspaceId ?? null);
          return;
        }

        const response = await fetch("/api/session/workspace", {
          credentials: "same-origin",
        });
        if (!response.ok) return;

        const payload = (await response.json()) as {
          user?: { displayName?: unknown };
          activeWorkspaceId?: unknown;
          workspaces?: TypeWorkspaceMembership[];
        };
        const activeWorkspaceId =
          typeof payload.activeWorkspaceId === "string"
            ? payload.activeWorkspaceId
            : null;
        const activeWorkspace = payload.workspaces?.find(
          (workspace) => workspace.id === activeWorkspaceId,
        );
        if (!activeWorkspaceId || !activeWorkspace || !isCurrent) return;

        const restoredSession: TypeAccountSessionState = {
          displayName:
            typeof payload.user?.displayName === "string"
              ? payload.user.displayName
              : "",
          workspaceName: activeWorkspace.name,
          workspaceId: activeWorkspaceId,
        };
        setAccountSession(restoredSession);
        setStoreWorkspaceId(activeWorkspaceId);
        try {
          window.localStorage.setItem(
            ACCOUNT_SESSION_STORAGE_KEY,
            JSON.stringify(restoredSession),
          );
        } catch {
          // Continue with the server-backed account state when storage is unavailable.
        }
      } catch {
        if (isCurrent) setAccountSession(null);
      }
    };

    void restoreAccountSession();
    return () => {
      isCurrent = false;
    };
  }, [setAccountSession, setStoreWorkspaceId]);

  useEffect(() => {
    if (!accountSession) {
      setAccountWorkspaces([]);
      setActiveWorkspaceId(null);
      setStoreWorkspaceId(null);
      setWorkspaceError(null);
      return;
    }

    let isCurrent = true;
    setIsLoadingWorkspaces(true);
    setWorkspaceError(null);
    void accountWorkspaceRequest<{
      activeWorkspaceId: string;
      workspaces: TypeWorkspaceMembership[];
    }>("/api/session/workspace")
      .then((payload) => {
        if (!isCurrent) return;

        setAccountWorkspaces(payload.workspaces);
        setActiveWorkspaceId(payload.activeWorkspaceId);
        setStoreWorkspaceId(payload.activeWorkspaceId);
        const activeWorkspace = payload.workspaces.find(
          (workspace) => workspace.id === payload.activeWorkspaceId,
        );
        if (activeWorkspace && window.location.pathname === "/") {
          router.replace(workspaceUrl(activeWorkspace));
        }
        if (
          activeWorkspace &&
          (accountSession.workspaceId !== activeWorkspace.id ||
            accountSession.workspaceName !== activeWorkspace.name)
        ) {
          const nextSession = {
            ...accountSession,
            workspaceId: activeWorkspace.id,
            workspaceName: activeWorkspace.name,
          };
          setAccountSession(nextSession);
          try {
            window.localStorage.setItem(
              ACCOUNT_SESSION_STORAGE_KEY,
              JSON.stringify(nextSession),
            );
          } catch {
            // Keep the active workspace in memory when storage is unavailable.
          }
        }
      })
      .catch((error: unknown) => {
        if (isCurrent && !isAccountSessionExpired(error)) {
          setWorkspaceError(
            error instanceof Error
              ? error.message
              : t("account.workspaceLoadError"),
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingWorkspaces(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [
    accountSession,
    router,
    setAccountSession,
    setAccountWorkspaces,
    setActiveWorkspaceId,
    setIsLoadingWorkspaces,
    setStoreWorkspaceId,
    setWorkspaceError,
    t,
    workspaceListRefreshKey,
  ]);

  useEffect(() => {
    const activeWorkspace = accountWorkspaces.find(
      (workspace) => workspace.id === activeWorkspaceId,
    );
    setStoreWorkspaceRole(activeWorkspace?.role ?? null);
  }, [accountWorkspaces, activeWorkspaceId, setStoreWorkspaceRole]);
}
