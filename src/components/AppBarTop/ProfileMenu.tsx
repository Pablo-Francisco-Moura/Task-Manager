import {
  Box,
  Menu,
  Stack,
  Select,
  Button,
  Divider,
  MenuItem,
  IconButton,
  Typography,
  ButtonGroup,
  FormControl,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { ThemeSwitch } from "../ThemeSwitch";
import { useTranslation } from "react-i18next";
import type {
  TypeAccountDialogMode,
  TypeGuestProfileState,
  TypeAccountSessionState,
  TypeWorkspaceMembership,
} from "@/types";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";

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
  onEditGuestProfile: () => void;
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
  onEditGuestProfile,
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
  const activeWorkspace = accountWorkspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

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
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body1" sx={{ flex: 1 }} noWrap>
            {accountSession?.displayName ||
              guestProfile.displayName ||
              t("profile.unnamed")}
          </Typography>
          {!accountSession ? (
            <IconButton
              size="small"
              aria-label={t("profile.editName")}
              title={t("profile.editName")}
              onClick={onEditGuestProfile}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Stack>
      </Box>
      {accountSession ? (
        [
          <Divider key="workspace-divider" sx={{ my: 1 }} />,
          <Box key="workspace-content" sx={{ minWidth: 240, px: 2, pb: 1 }}>
            <Typography
              id="active-workspace-label"
              variant="overline"
              color="text.secondary"
            >
              {t("account.workspaceLabel")}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {accountWorkspaces.length > 1 ? (
                <FormControl size="small" fullWidth>
                  <Select
                    value={activeWorkspaceId ?? ""}
                    aria-labelledby="active-workspace-label"
                    onChange={(event) => onSwitchWorkspace(event.target.value)}
                    disabled={
                      isLoadingWorkspaces || switchingWorkspaceId !== null
                    }
                  >
                    {accountWorkspaces.map((workspace) => (
                      <MenuItem key={workspace.id} value={workspace.id}>
                        {workspace.name} · {t(`account.role.${workspace.role}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                  {accountSession.workspaceName}
                </Typography>
              )}
              <IconButton
                size="small"
                aria-label={t("account.workspaceCreate")}
                title={t("account.workspaceCreate")}
                onClick={onCreateWorkspace}
              >
                <AddOutlinedIcon fontSize="small" />
              </IconButton>
              {activeWorkspace?.role === "owner" ? (
                <IconButton
                  size="small"
                  aria-label={t("account.workspaceRename")}
                  title={t("account.workspaceRename")}
                  onClick={onRenameWorkspace}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              ) : null}
              {accountWorkspaces.length > 1 &&
              activeWorkspace?.role === "owner" ? (
                <IconButton
                  size="small"
                  color="error"
                  aria-label={t("account.workspaceDelete")}
                  title={t("account.workspaceDelete")}
                  onClick={() => onDeleteWorkspace(activeWorkspace)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              ) : null}
            </Stack>
            {activeWorkspace?.role === "owner" ? (
              <Button
                size="small"
                startIcon={<GroupAddOutlinedIcon />}
                onClick={onInviteMember}
                sx={{ mt: 1 }}
              >
                {t("notifications.manageInvites")}
              </Button>
            ) : null}
          </Box>,
        ]
      ) : null}
      {workspaceError ? (
        <Box sx={{ maxWidth: 280, px: 2, py: 1 }}>
          <Typography variant="caption" color="error.main">
            {workspaceError}
          </Typography>
        </Box>
      ) : null}
      <Divider sx={{ my: 1 }} />
      <Box sx={{ minWidth: 240, px: 2, py: 1 }}>
        <Typography variant="overline" color="text.secondary">
          {t("profile.preferences")}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 0.5 }}
        >
          <Typography variant="body2">{t("app.language")}</Typography>
          <ButtonGroup size="small" aria-label={t("app.language")}>
            <Button
              aria-pressed={language === "pt"}
              onClick={() => onSelectLanguage("pt")}
              variant={language === "pt" ? "contained" : "outlined"}
            >
              PT
            </Button>
            <Button
              aria-pressed={language === "en"}
              onClick={() => onSelectLanguage("en")}
              variant={language === "en" ? "contained" : "outlined"}
            >
              EN
            </Button>
          </ButtonGroup>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 1 }}
        >
          <Typography variant="body2">{t("theme.label")}</Typography>
          <ThemeSwitch />
        </Stack>
      </Box>
      <Divider sx={{ my: 1 }} />
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
