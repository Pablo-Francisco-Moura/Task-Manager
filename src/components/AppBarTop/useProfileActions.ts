import {
  GUEST_PROFILE_STORAGE_KEY,
  ACCOUNT_SESSION_STORAGE_KEY,
} from "@/constants/session";
import { useTranslation } from "react-i18next";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { TypeGuestProfileState, TypeAccountSessionState } from "@/types";

interface IProps {
  guestProfile: TypeGuestProfileState;
  accountSession: TypeAccountSessionState | null;
  setGuestProfile: Dispatch<SetStateAction<TypeGuestProfileState>>;
  setAccountSession: Dispatch<SetStateAction<TypeAccountSessionState | null>>;
  setWorkspaceError: Dispatch<SetStateAction<string | null>>;
}

export function useProfileActions({
  guestProfile,
  accountSession,
  setGuestProfile,
  setAccountSession,
  setWorkspaceError,
}: IProps) {
  const { t } = useTranslation();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editedProfileName, setEditedProfileName] = useState("");

  const openEditProfile = () => {
    setEditedProfileName(
      accountSession?.displayName ?? guestProfile.displayName,
    );
    setIsEditProfileOpen(true);
  };

  const closeEditProfile = () => {
    setEditedProfileName("");
    setIsEditProfileOpen(false);
  };

  const saveProfileName = async () => {
    const trimmedProfileName = editedProfileName.trim();
    if (!trimmedProfileName) return;

    if (accountSession) {
      try {
        const response = await fetch("/api/session/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ displayName: trimmedProfileName }),
        });

        if (!response.ok) throw new Error(t("account.updateError"));

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
          // Keep the active account state in memory when storage is unavailable.
        }
      } catch {
        setWorkspaceError(t("account.updateError"));
      }

      closeEditProfile();
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
    closeEditProfile();
  };

  return {
    isEditProfileOpen,
    editedProfileName,
    setEditedProfileName,
    openEditProfile,
    closeEditProfile,
    saveProfileName,
  };
}
