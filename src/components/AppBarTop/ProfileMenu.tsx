import {
  Box,
  Menu,
  Stack,
  MenuItem,
  IconButton,
  Typography,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  ProfileWorkspaceSection,
  ProfilePreferencesSection,
} from "./ProfileMenuSections";
import { useTranslation } from "react-i18next";
import type {
  TypeAccountDialogMode,
  TypeGuestProfileState,
  TypeAccountSessionState,
  TypeWorkspaceMembership,
} from "@/types";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

interface IProps {
  anchor: HTMLElement | null;
  language: "pt" | "en";
  guestProfile: TypeGuestProfileState;
  isSigningOut: boolean;
  workspaceError: string | null;
  accountSession: TypeAccountSessionState | null;
  accountWorkspaces: TypeWorkspaceMembership[];
  activeWorkspaceId: string | null;
  isLoadingWorkspaces: boolean;
  switchingWorkspaceId: string | null;
  onClose: () => void;
  onSignOut: () => void;
  onSelectLanguage: (language: "pt" | "en") => void;
  onSwitchWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
  onRenameWorkspace: () => void;
  onDeleteWorkspace: (workspace: TypeWorkspaceMembership) => void;
  onEditProfile: () => void;
  onOpenAccountDialog: (mode: TypeAccountDialogMode) => void;
  onInviteMember: () => void;
}

export function ProfileMenu({
  anchor,
  accountSession,
  accountWorkspaces,
  activeWorkspaceId,
  guestProfile,
  workspaceError,
  isLoadingWorkspaces,
  switchingWorkspaceId,
  isSigningOut,
  language,
  onClose,
  onEditProfile,
  onSwitchWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  onSelectLanguage,
  onSignOut,
  onOpenAccountDialog,
  onInviteMember,
}: IProps) {
  const { t } = useTranslation();

  return (
    <Menu
      anchorEl={anchor}
      open={Boolean(anchor)}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Box sx={{ minWidth: 240, px: 2, py: 1 }}>
        <Typography variant="overline" color="text.secondary">
          {accountSession ? t("profile.account") : t("profile.guest")}
        </Typography>
        <Stack
          className="profile-name-row"
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            "&:hover .profile-name-edit, &:focus-within .profile-name-edit": {
              opacity: 1,
              pointerEvents: "auto",
            },
          }}
        >
          <Typography variant="body1" sx={{ flex: 1 }} noWrap>
            {accountSession?.displayName ||
              guestProfile.displayName ||
              t("profile.unnamed")}
          </Typography>
          <IconButton
            className="profile-name-edit"
            size="small"
            aria-label={t("profile.editName")}
            title={t("profile.editName")}
            onClick={onEditProfile}
            sx={{
              opacity: 0,
              pointerEvents: "none",
              transition: "opacity 120ms ease",
              "@media (hover: none)": {
                opacity: 1,
                pointerEvents: "auto",
              },
            }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      {accountSession ? (
        <ProfileWorkspaceSection
          accountSession={accountSession}
          accountWorkspaces={accountWorkspaces}
          activeWorkspaceId={activeWorkspaceId}
          isLoadingWorkspaces={isLoadingWorkspaces}
          switchingWorkspaceId={switchingWorkspaceId}
          onSwitchWorkspace={onSwitchWorkspace}
          onCreateWorkspace={onCreateWorkspace}
          onRenameWorkspace={onRenameWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
          onInviteMember={onInviteMember}
        />
      ) : null}
      {workspaceError ? (
        <Box sx={{ maxWidth: 280, px: 2, py: 1 }}>
          <Typography variant="caption" color="error.main">
            {workspaceError}
          </Typography>
        </Box>
      ) : null}
      <ProfilePreferencesSection
        language={language}
        onSelectLanguage={onSelectLanguage}
      />
      {accountSession ? (
        <MenuItem onClick={onSignOut} disabled={isSigningOut}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isSigningOut ? t("common.saving") : t("account.signOut")}
          </ListItemText>
        </MenuItem>
      ) : null}
      {!accountSession ? (
        <MenuItem onClick={() => onOpenAccountDialog("signIn")}>
          {t("account.signIn.button")}
        </MenuItem>
      ) : null}
      {!accountSession ? (
        <MenuItem onClick={() => onOpenAccountDialog("signUp")}>
          {t("account.create.button")}
        </MenuItem>
      ) : null}
    </Menu>
  );
}
