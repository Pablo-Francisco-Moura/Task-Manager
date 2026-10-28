"use client";

import {
  defaultSelectedTab,
  selectedTabStorageKey,
  selectedProjectStorageKey,
} from "@/constants/app";
import {
  GUEST_PROFILE_STORAGE_KEY,
  ACCOUNT_IMPORT_STORAGE_KEY,
  ACCOUNT_SESSION_STORAGE_KEY,
  MINIMUM_SESSION_LOADING_REPEAT_MS,
  SESSION_PROGRESS_COMPLETE_DISPLAY_MS,
  SESSION_BOOTSTRAP_COMPLETED_STORAGE_KEY,
} from "@/constants/session";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useMainStore } from "@/store/mainStore";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectStore } from "@/store/projectStore";
import { LOCAL_STORAGE_KEY } from "@/constants/localData";
import { useRef, type Dispatch, type SetStateAction } from "react";
import type {
  TypeGuestProfileState,
  TypeAccountSessionState,
  TypeWorkspaceMembership,
} from "@/types";

interface IProps {
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
  setGuestProfile: Dispatch<SetStateAction<TypeGuestProfileState>>;
  setProfileAnchor: Dispatch<SetStateAction<HTMLElement | null>>;
  setAccountSession: Dispatch<SetStateAction<TypeAccountSessionState | null>>;
  setWorkspaceError: Dispatch<SetStateAction<string | null>>;
  setNewWorkspaceName: Dispatch<SetStateAction<string>>;
  setAccountWorkspaces: Dispatch<SetStateAction<TypeWorkspaceMembership[]>>;
  setActiveWorkspaceId: Dispatch<SetStateAction<string | null>>;
  setWorkspaceToDelete: Dispatch<
    SetStateAction<TypeWorkspaceMembership | null>
  >;
  setIsResettingWorkspace: Dispatch<SetStateAction<boolean>>;
  setIsCreateWorkspaceOpen: Dispatch<SetStateAction<boolean>>;
  resetAccountForm: () => void;
  closeEditProfile: () => void;
  closeCreateAccountDialog: () => void;
}

export function useSignOutAction({
  setIsSigningOut,
  setGuestProfile,
  setProfileAnchor,
  setAccountSession,
  setWorkspaceError,
  setNewWorkspaceName,
  setAccountWorkspaces,
  setActiveWorkspaceId,
  setWorkspaceToDelete,
  setIsResettingWorkspace,
  setIsCreateWorkspaceOpen,
  resetAccountForm,
  closeEditProfile,
  closeCreateAccountDialog,
}: IProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const setStoreWorkspaceId = useProjectStore(
    (state) => state.setActiveWorkspaceId,
  );
  const setSelectedProject = useProjectStore(
    (state) => state.setSelectedProject,
  );
  const setSelectedTab = useMainStore((state) => state.setSelectedTab);
  const isSigningOutRef = useRef(false);

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
      closeEditProfile();
      resetAccountForm();
      setNewWorkspaceName("");
      setWorkspaceError(null);
      closeCreateAccountDialog();
      setIsCreateWorkspaceOpen(false);
      setWorkspaceToDelete(null);

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

  return signOut;
}
