"use client";

import { useRouter } from "next/navigation";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { workspaceUrl } from "@/utils/workspaceUrl";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { ACCOUNT_SESSION_STORAGE_KEY } from "@/constants/session";
import type { Dispatch, SetStateAction } from "react";
import type { TypeAccountDialogMode, TypeAccountSessionState } from "@/types";

interface IProps {
  email: string;
  username: string;
  password: string;
  displayName: string;
  workspaceName: string;
  confirmPassword: string;
  accountDialogMode: TypeAccountDialogMode;
  setEmail: Dispatch<SetStateAction<string>>;
  setUsername: Dispatch<SetStateAction<string>>;
  setPassword: Dispatch<SetStateAction<string>>;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  setDisplayName: Dispatch<SetStateAction<string>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  setWorkspaceName: Dispatch<SetStateAction<string>>;
  setAccountSession: Dispatch<SetStateAction<TypeAccountSessionState | null>>;
  setConfirmPassword: Dispatch<SetStateAction<string>>;
  closeCreateAccountDialog: () => void;
  setHasAttemptedAccountSubmit: Dispatch<SetStateAction<boolean>>;
}

export function useAccountSubmission({
  email,
  username,
  password,
  displayName,
  workspaceName,
  confirmPassword,
  accountDialogMode,
  setEmail,
  setPassword,
  setUsername,
  setDisplayName,
  setSubmitError,
  setIsSubmitting,
  setWorkspaceName,
  setAccountSession,
  setConfirmPassword,
  closeCreateAccountDialog,
  setHasAttemptedAccountSubmit,
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
  return handleCreateAccount;
}
