"use client";

import {
  GUEST_PROFILE_STORAGE_KEY,
  ACCOUNT_IMPORT_STORAGE_KEY,
  ACCOUNT_SESSION_STORAGE_KEY,
  MINIMUM_SESSION_LOADING_REPEAT_MS,
  SESSION_PROGRESS_COMPLETE_DISPLAY_MS,
  SESSION_BOOTSTRAP_COMPLETED_STORAGE_KEY,
} from "@/constants/session";
import {
  defaultSelectedTab,
  selectedTabStorageKey,
  selectedProjectStorageKey,
} from "@/constants/app";
import {
  accountWorkspaceRequest,
  isAccountSessionExpired,
  ACCOUNT_SESSION_EXPIRED_EVENT,
} from "@/lib/accountWorkspaceApi";
import { useRouter } from "next/navigation";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { ProfileMenu } from "./ProfileMenu";
import { useMainStore } from "@/store/mainStore";
import { workspaceUrl } from "@/utils/workspaceUrl";
import { AppBarDialogs } from "./AppBarDialogs";
import { AccountDialog } from "./AccountDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { LOCAL_STORAGE_KEY } from "@/constants/localData";
import { useWorkspaceActions } from "./useWorkspaceActions";
import { WorkspaceInviteBell } from "../Notifications/WorkspaceInviteBell";
import { WorkspaceInviteDialog } from "../Notifications/WorkspaceInviteDialog";
import { importLocalWorkspaceData } from "@/lib/localDataRepository";
import { useEffect, useRef, useState } from "react";
import { Stack, Button, IconButton, Typography } from "@mui/material";
import type {
  TypeAccountDialogMode,
  TypeGuestProfileState,
  TypeAccountSessionState,
  TypeWorkspaceMembership,
} from "@/types";
import styles from "./AppBarTop.module.css";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import WorkspacesOutlinedIcon from "@mui/icons-material/WorkspacesOutlined";

export function resolveAccountDialogContent(
  mode: TypeAccountDialogMode,
  t: (key: string) => string,
) {
  const isSignIn = mode === "signIn";

  return {
    title: isSignIn ? t("account.signIn.title") : t("account.create.title"),
    submit: isSignIn ? t("account.signIn.submit") : t("account.create.submit"),
  };
}

export function AppBarTop() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const language = i18n.language.startsWith("en") ? "en" : "pt";
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedAccountSubmit, setHasAttemptedAccountSubmit] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [accountDialogMode, setAccountDialogMode] =
    useState<TypeAccountDialogMode>("signUp");
  const queryClient = useQueryClient();
  const setSelectedProject = useProjectStore(
    (state) => state.setSelectedProject,
  );
  const setStoreWorkspaceId = useProjectStore(
    (state) => state.setActiveWorkspaceId,
  );
  const setStoreWorkspaceRole = useProjectStore(
    (state) => state.setWorkspaceRole,
  );
  const setSelectedTab = useMainStore((state) => state.setSelectedTab);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [guestProfile, setGuestProfile] = useState<TypeGuestProfileState>({
    displayName: "",
  });
  const [editedProfileName, setEditedProfileName] = useState("");
  const [accountSession, setAccountSession] =
    useState<TypeAccountSessionState | null>(null);
  const [accountWorkspaces, setAccountWorkspaces] = useState<
    TypeWorkspaceMembership[]
  >([]);
  const [workspaceListRefreshKey, setWorkspaceListRefreshKey] = useState(0);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState<
    string | null
  >(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isRenameWorkspaceOpen, setIsRenameWorkspaceOpen] = useState(false);
  const [renamedWorkspaceName, setRenamedWorkspaceName] = useState("");
  const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] =
    useState<TypeWorkspaceMembership | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isResettingWorkspace, setIsResettingWorkspace] = useState(false);
  const signOutActionRef = useRef<() => Promise<void>>(async () => {});
  const isSigningOutRef = useRef(false);
  const workspaceActions = useWorkspaceActions({
    accountSession,
    setAccountSession,
    accountWorkspaces,
    setAccountWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    newWorkspaceName,
    setNewWorkspaceName,
    renamedWorkspaceName,
    setRenamedWorkspaceName,
    workspaceToDelete,
    setWorkspaceToDelete,
    setIsCreateWorkspaceOpen,
    setIsRenameWorkspaceOpen,
    setSwitchingWorkspaceId,
    setIsCreatingWorkspace,
    setIsDeletingWorkspace,
    setIsRenamingWorkspace,
    setProfileAnchor,
    setWorkspaceError,
  });

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
  }, []);

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
  }, []);

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
  }, [accountSession]);

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
  }, [setStoreWorkspaceId]);

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
  }, [accountSession, router, setStoreWorkspaceId, t, workspaceListRefreshKey]);

  useEffect(() => {
    const activeWorkspace = accountWorkspaces.find(
      (workspace) => workspace.id === activeWorkspaceId,
    );
    setStoreWorkspaceRole(activeWorkspace?.role ?? null);
  }, [accountWorkspaces, activeWorkspaceId, setStoreWorkspaceRole]);

  const importLocalWorkspaceIntoAccount = async () => {
    const savedWorkspaceData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedWorkspaceData) {
      return { projectCount: 0, taskCount: 0 };
    }

    const result = await importLocalWorkspaceData({
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
      }) => {
        return accountWorkspaceRequest("/api/task", {
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
        });
      },
    });

    return result;
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

  const selectLanguage = (nextLanguage: "pt" | "en") => {
    void i18n.changeLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage === "pt" ? "pt-BR" : "en";
    try {
      window.localStorage.setItem("language", nextLanguage);
    } catch {
      // The current selection still applies for this session.
    }
  };

  const openCreateAccountDialog = (mode: TypeAccountDialogMode = "signUp") => {
    setAccountDialogMode(mode);
    setDisplayName(accountSession?.displayName || guestProfile.displayName);
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
    setSubmitError(null);
    setHasAttemptedAccountSubmit(false);
    setIsCreateAccountOpen(true);
  };

  const saveProfileName = async () => {
    const trimmedProfileName = editedProfileName.trim();
    if (!trimmedProfileName) {
      return;
    }

    if (accountSession) {
      try {
        const response = await fetch("/api/session/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ displayName: trimmedProfileName }),
        });

        if (!response.ok) {
          throw new Error(t("account.updateError"));
        }

        const payload = (await response.json().catch(() => ({}))) as {
          displayName?: string;
        };

        const nextSession = {
          ...accountSession,
          displayName: payload.displayName ?? trimmedProfileName,
        };

        setAccountSession(nextSession);
        try {
          window.localStorage.setItem(
            ACCOUNT_SESSION_STORAGE_KEY,
            JSON.stringify(nextSession),
          );
        } catch {
          // Keep the active account state in memory even when storage is unavailable.
        }
      } catch {
        setWorkspaceError(t("account.updateError"));
      }

      setIsEditProfileOpen(false);
      setEditedProfileName("");
      return;
    }

    const nextProfile = { displayName: trimmedProfileName };

    try {
      window.localStorage.setItem(
        GUEST_PROFILE_STORAGE_KEY,
        JSON.stringify(nextProfile),
      );
    } catch {
      // Keep the edited profile available for the current session.
    }

    setGuestProfile(nextProfile);
    setIsEditProfileOpen(false);
    setEditedProfileName("");
  };

  const closeCreateAccountDialog = () => {
    setIsCreateAccountOpen(false);
    setSubmitError(null);
    setHasAttemptedAccountSubmit(false);
    setAccountDialogMode("signUp");
  };

  const { switchWorkspace, createWorkspace, deleteWorkspace, renameWorkspace } =
    workspaceActions;

  const signOut = async () => {
    if (isSigningOutRef.current) return;
    isSigningOutRef.current = true;
    const resetStartedAt = Date.now();
    setIsSigningOut(true);
    setIsResettingWorkspace(true);
    setWorkspaceError(null);
    setProfileAnchor(null);
    try {
      const response = await fetch("/api/session/sign-out", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error(t("account.signOutError"));
      }

      await Promise.all([
        queryClient.cancelQueries({ queryKey: [QUERY_KEYS.PROJECTS] }),
        queryClient.cancelQueries({ queryKey: [QUERY_KEYS.TASKS] }),
      ]);
      queryClient.clear();

      try {
        for (const storageKey of [
          ACCOUNT_SESSION_STORAGE_KEY,
          ACCOUNT_IMPORT_STORAGE_KEY,
          GUEST_PROFILE_STORAGE_KEY,
          SESSION_BOOTSTRAP_COMPLETED_STORAGE_KEY,
          LOCAL_STORAGE_KEY,
          selectedProjectStorageKey,
          selectedTabStorageKey,
        ]) {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        // Continue resetting the in-memory workspace when browser storage fails.
      }
      setAccountSession(null);
      setAccountWorkspaces([]);
      setActiveWorkspaceId(null);
      setStoreWorkspaceId(null);
      setSelectedProject(null);
      setSelectedTab(defaultSelectedTab);
      setGuestProfile({ displayName: "" });
      setEditedProfileName("");
      setDisplayName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setWorkspaceName("");
      setNewWorkspaceName("");
      setSubmitError(null);
      setWorkspaceError(null);
      setIsCreateAccountOpen(false);
      setIsCreateWorkspaceOpen(false);
      setWorkspaceToDelete(null);
      setIsEditProfileOpen(false);

      const guestResponse = await fetch("/api/session/guest", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!guestResponse.ok) {
        throw new Error(t("common.sessionLoadError"));
      }

      const minimumLoadingDuration =
        MINIMUM_SESSION_LOADING_REPEAT_MS +
        SESSION_PROGRESS_COMPLETE_DISPLAY_MS;
      const remainingLoadingTime =
        minimumLoadingDuration - (Date.now() - resetStartedAt);
      if (remainingLoadingTime > 0) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, remainingLoadingTime),
        );
      }
      window.location.reload();
    } catch (error) {
      setWorkspaceError(
        error instanceof Error ? error.message : t("account.signOutError"),
      );
    } finally {
      isSigningOutRef.current = false;
      setIsSigningOut(false);
      setIsResettingWorkspace(false);
    }
  };
  signOutActionRef.current = signOut;

  const handleCreateAccount = async () => {
    const trimmedDisplayName = displayName.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password;
    const trimmedWorkspaceName =
      workspaceName.trim() || t("account.workspaceDefault");

    if (accountDialogMode === "signIn") {
      setHasAttemptedAccountSubmit(true);
      if (!trimmedEmail || trimmedPassword.length < 6) return;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch("/api/session/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            identifier: trimmedEmail,
            password: trimmedPassword,
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? t("account.signIn.error")
              : typeof payload?.error === "string"
                ? payload.error
                : t("account.signIn.error"),
          );
        }

        const nextAccountSession: TypeAccountSessionState = {
          displayName:
            typeof payload.user?.displayName === "string" &&
            payload.user.displayName.trim()
              ? payload.user.displayName.trim()
              : trimmedDisplayName || t("profile.unnamed"),
          workspaceName:
            typeof payload.workspaceName === "string" &&
            payload.workspaceName.trim()
              ? payload.workspaceName.trim()
              : trimmedWorkspaceName,
          workspaceId:
            typeof payload.workspaceId === "string"
              ? payload.workspaceId
              : undefined,
        };

        try {
          window.localStorage.setItem(
            ACCOUNT_SESSION_STORAGE_KEY,
            JSON.stringify(nextAccountSession),
          );
        } catch {
          // Keep the active account state in memory even when storage is unavailable.
        }

        setAccountSession(nextAccountSession);
        setStoreWorkspaceId(nextAccountSession.workspaceId ?? null);
        setSelectedProject(null);
        if (nextAccountSession.workspaceId) {
          router.push(
            workspaceUrl({
              id: nextAccountSession.workspaceId,
              name: nextAccountSession.workspaceName,
            }),
          );
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] }),
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] }),
        ]);
        setDisplayName("");
        setEmail("");
        setPassword("");
        setWorkspaceName("");
        closeCreateAccountDialog();
        return;
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : t("account.signIn.error"),
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    setHasAttemptedAccountSubmit(true);
    if (
      !trimmedDisplayName ||
      !/^[a-z0-9._-]{3,32}$/.test(trimmedUsername) ||
      trimmedPassword.length < 6 ||
      confirmPassword !== trimmedPassword ||
      (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
    ) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/session/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          displayName: trimmedDisplayName,
          username: trimmedUsername,
          ...(trimmedEmail ? { email: trimmedEmail } : {}),
          password: trimmedPassword,
          workspaceName: trimmedWorkspaceName,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 400) {
          setHasAttemptedAccountSubmit(true);
          return;
        }
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : t("account.create.error"),
        );
      }

      const nextAccountSession: TypeAccountSessionState = {
        displayName:
          typeof payload.user?.displayName === "string" &&
          payload.user.displayName.trim()
            ? payload.user.displayName.trim()
            : trimmedDisplayName,
        workspaceName:
          typeof payload.workspaceName === "string" &&
          payload.workspaceName.trim()
            ? payload.workspaceName.trim()
            : trimmedWorkspaceName,
        workspaceId:
          typeof payload.workspaceId === "string"
            ? payload.workspaceId
            : undefined,
      };

      try {
        window.localStorage.setItem(
          ACCOUNT_SESSION_STORAGE_KEY,
          JSON.stringify(nextAccountSession),
        );
      } catch {
        // Keep the active account state in memory even when storage is unavailable.
      }

      setAccountSession(nextAccountSession);
      setStoreWorkspaceId(nextAccountSession.workspaceId ?? null);
      setSelectedProject(null);
      if (nextAccountSession.workspaceId) {
        router.push(
          workspaceUrl({
            id: nextAccountSession.workspaceId,
            name: nextAccountSession.workspaceName,
          }),
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] }),
      ]);
      setDisplayName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setHasAttemptedAccountSubmit(false);
      setWorkspaceName("");
      closeCreateAccountDialog();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t("account.create.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header
        className={`${styles.header} app-header w-full transition-colors`}
      >
        <div className="app-header-inner mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="app-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <WorkspacesOutlinedIcon fontSize="small" />
            </span>
            <div className="flex min-w-0 flex-col">
              <h1 className="app-brand-title truncate">{t("app.title")}</h1>
              {accountSession ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {t("account.workspaceLabel")} · {accountSession.workspaceName}
                </Typography>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!accountSession && (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => openCreateAccountDialog("signIn")}
                >
                  {t("account.signIn.button")}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => openCreateAccountDialog("signUp")}
                >
                  {t("account.create.button")}
                </Button>
              </Stack>
            )}
            <WorkspaceInviteBell
              enabled={Boolean(accountSession)}
              language={language}
              onInviteAccepted={() =>
                setWorkspaceListRefreshKey((current) => current + 1)
              }
            />
            <IconButton
              aria-label={t("profile.open")}
              aria-haspopup="menu"
              aria-expanded={Boolean(profileAnchor)}
              onClick={(event) => setProfileAnchor(event.currentTarget)}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
          </div>
        </div>
      </header>

      <AccountDialog
        open={isCreateAccountOpen}
        mode={accountDialogMode}
        displayName={displayName}
        username={username}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        workspaceName={workspaceName}
        isPasswordVisible={isPasswordVisible}
        isConfirmPasswordVisible={isConfirmPasswordVisible}
        hasAttemptedSubmit={hasAttemptedAccountSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onChange={(field, value) => {
          if (field === "displayName") setDisplayName(value);
          if (field === "username") setUsername(value);
          if (field === "email") setEmail(value);
          if (field === "password") setPassword(value);
          if (field === "confirmPassword") setConfirmPassword(value);
          if (field === "workspaceName") setWorkspaceName(value);
        }}
        onTogglePassword={(field) => {
          if (field === "password") {
            setIsPasswordVisible((visible) => !visible);
          } else {
            setIsConfirmPasswordVisible((visible) => !visible);
          }
        }}
        onClose={closeCreateAccountDialog}
        onSubmit={() => void handleCreateAccount()}
      />

      <AppBarDialogs
        isImportDialogOpen={isImportDialogOpen}
        onCloseImportDialog={(status) => void closeImportDialog(status)}
        isCreateWorkspaceOpen={isCreateWorkspaceOpen}
        isCreatingWorkspace={isCreatingWorkspace}
        newWorkspaceName={newWorkspaceName}
        onNewWorkspaceNameChange={setNewWorkspaceName}
        onCreateWorkspace={() => void createWorkspace()}
        onCloseCreateWorkspace={() => setIsCreateWorkspaceOpen(false)}
        isRenameWorkspaceOpen={isRenameWorkspaceOpen}
        isRenamingWorkspace={isRenamingWorkspace}
        renamedWorkspaceName={renamedWorkspaceName}
        onRenamedWorkspaceNameChange={setRenamedWorkspaceName}
        onRenameWorkspace={() => void renameWorkspace()}
        onCloseRenameWorkspace={() => setIsRenameWorkspaceOpen(false)}
        workspaceToDelete={workspaceToDelete}
        isDeletingWorkspace={isDeletingWorkspace}
        onDeleteWorkspace={() => void deleteWorkspace()}
        onCloseDeleteWorkspace={() => setWorkspaceToDelete(null)}
        isEditProfileOpen={isEditProfileOpen}
        editedProfileName={editedProfileName}
        onEditedProfileNameChange={setEditedProfileName}
        onSaveGuestProfile={saveProfileName}
        onCloseEditProfile={() => {
          setEditedProfileName("");
          setIsEditProfileOpen(false);
        }}
        isResettingWorkspace={isResettingWorkspace}
      >
        <ProfileMenu
          anchor={profileAnchor}
          accountSession={accountSession}
          accountWorkspaces={accountWorkspaces}
          activeWorkspaceId={activeWorkspaceId}
          guestProfile={guestProfile}
          workspaceError={workspaceError}
          isLoadingWorkspaces={isLoadingWorkspaces}
          switchingWorkspaceId={switchingWorkspaceId}
          isSigningOut={isSigningOut}
          language={language}
          onClose={() => setProfileAnchor(null)}
          onEditProfile={() => {
            setEditedProfileName(
              accountSession?.displayName ?? guestProfile.displayName,
            );
            setProfileAnchor(null);
            setIsEditProfileOpen(true);
          }}
          onSwitchWorkspace={(workspaceId) => void switchWorkspace(workspaceId)}
          onCreateWorkspace={() => {
            setNewWorkspaceName("");
            setProfileAnchor(null);
            setIsCreateWorkspaceOpen(true);
          }}
          onRenameWorkspace={() => {
            setRenamedWorkspaceName(accountSession?.workspaceName ?? "");
            setProfileAnchor(null);
            setIsRenameWorkspaceOpen(true);
          }}
          onDeleteWorkspace={(workspace) => {
            setProfileAnchor(null);
            setWorkspaceToDelete(workspace);
          }}
          onSelectLanguage={selectLanguage}
          onSignOut={() => void signOut()}
          onOpenAccountDialog={(mode) => {
            setProfileAnchor(null);
            openCreateAccountDialog(mode);
          }}
          onInviteMember={() => {
            setProfileAnchor(null);
            setIsInviteDialogOpen(true);
          }}
        />
      </AppBarDialogs>
      <WorkspaceInviteDialog
        open={isInviteDialogOpen}
        workspaceId={activeWorkspaceId}
        onClose={() => setIsInviteDialogOpen(false)}
      />
    </>
  );
}
