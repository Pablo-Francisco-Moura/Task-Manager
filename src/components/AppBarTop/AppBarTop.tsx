"use client";

import { ProfileMenu } from "./ProfileMenu";
import { AppBarHeader } from "./AppBarHeader";
import { useMainStore } from "@/store/mainStore";
import { AppBarDialogs } from "./AppBarDialogs";
import { AccountDialog } from "./AccountDialog";
import { useTranslation } from "react-i18next";
import { useAppBarSession } from "./useAppBarSession";
import { useSignOutAction } from "./useSignOutAction";
import { useRef, useState } from "react";
import { useProfileActions } from "./useProfileActions";
import { ColorSettingsDialog } from "./ColorSettingsDialog";
import { useWorkspaceActions } from "./useWorkspaceActions";
import { WorkspaceInviteDialog } from "../Notifications/WorkspaceInviteDialog";
import { useWorkspaceImportActions } from "./useWorkspaceImportActions";
import { useAccountDialogController } from "./useAccountDialogController";
export { resolveAccountDialogContent } from "./AccountDialog";
import type {
  TypeGuestProfileState,
  TypeAccountSessionState,
  TypeWorkspaceMembership,
} from "@/types";

export function AppBarTop() {
  const { i18n } = useTranslation();
  const {
    isImportDialogOpen,
    setIsImportDialogOpen,
    closeImportDialog,
  } = useWorkspaceImportActions();
  const language = i18n.language.startsWith("en") ? "en" : "pt";
  const setSelectedTab = useMainStore((state) => state.setSelectedTab);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [isColorSettingsOpen, setIsColorSettingsOpen] = useState(false);
  const [guestProfile, setGuestProfile] = useState<TypeGuestProfileState>({
    displayName: "",
  });
  const [accountSession, setAccountSession] =
    useState<TypeAccountSessionState | null>(null);
  const accountDialog = useAccountDialogController({
    accountSession,
    guestProfile,
    setAccountSession,
  });
  const {
    displayName,
    username,
    email,
    password,
    confirmPassword,
    isPasswordVisible,
    isConfirmPasswordVisible,
    submitError,
    hasAttemptedAccountSubmit,
    isSubmitting,
    workspaceName,
    isCreateAccountOpen,
    accountDialogMode,
    updateField,
    togglePassword,
    resetAccountForm,
    openCreateAccountDialog,
    closeCreateAccountDialog,
    handleCreateAccount,
  } = accountDialog;
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
  const profileActions = useProfileActions({
    accountSession,
    setAccountSession,
    guestProfile,
    setGuestProfile,
    setWorkspaceError,
  });
  const {
    isEditProfileOpen,
    editedProfileName,
    setEditedProfileName,
    openEditProfile,
    closeEditProfile,
    saveProfileName,
  } = profileActions;
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

  const signOut = useSignOutAction({
    setAccountSession,
    setAccountWorkspaces,
    setActiveWorkspaceId,
    setIsSigningOut,
    setIsResettingWorkspace,
    setWorkspaceError,
    setProfileAnchor,
    setGuestProfile,
    setNewWorkspaceName,
    setIsCreateWorkspaceOpen,
    setWorkspaceToDelete,
    resetAccountForm,
    closeCreateAccountDialog,
    closeEditProfile,
  });
  signOutActionRef.current = signOut;

  useAppBarSession({
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
  });

  const selectLanguage = (nextLanguage: "pt" | "en") => {
    void i18n.changeLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage === "pt" ? "pt-BR" : "en";
    try {
      window.localStorage.setItem("language", nextLanguage);
    } catch {
      // The current selection still applies for this session.
    }
  };

  const { switchWorkspace, createWorkspace, deleteWorkspace, renameWorkspace } =
    workspaceActions;





  return (
    <>
      <AppBarHeader
        accountSession={accountSession}
        language={language}
        profileAnchor={profileAnchor}
        onOpenAccountDialog={openCreateAccountDialog}
        onInviteAccepted={() =>
          setWorkspaceListRefreshKey((current) => current + 1)
        }
        onOpenProfile={setProfileAnchor}
      />

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
        onChange={updateField}
        onTogglePassword={togglePassword}
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
        onCloseEditProfile={closeEditProfile}
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
            setProfileAnchor(null);
            openEditProfile();
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
          onOpenColorSettings={() => setIsColorSettingsOpen(true)}
        />
        <ColorSettingsDialog
          open={isColorSettingsOpen}
          onClose={() => setIsColorSettingsOpen(false)}
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
