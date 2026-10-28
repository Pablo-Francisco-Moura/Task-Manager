import {
  Box,
  Stack,
  Button,
  Divider,
  Select,
  MenuItem,
  Typography,
  IconButton,
  FormControl,
  ButtonGroup,
} from "@mui/material";
import { ThemeSwitch } from "../ThemeSwitch";
import { useTranslation } from "react-i18next";
import type { TypeAccountSessionState, TypeWorkspaceMembership } from "@/types";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";

interface IWorkspaceSectionProps {
  accountSession: TypeAccountSessionState;
  accountWorkspaces: TypeWorkspaceMembership[];
  activeWorkspaceId: string | null;
  isLoadingWorkspaces: boolean;
  switchingWorkspaceId: string | null;
  onSwitchWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
  onRenameWorkspace: () => void;
  onDeleteWorkspace: (workspace: TypeWorkspaceMembership) => void;
  onInviteMember: () => void;
}

export function ProfileWorkspaceSection({
  accountSession,
  accountWorkspaces,
  activeWorkspaceId,
  isLoadingWorkspaces,
  switchingWorkspaceId,
  onSwitchWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  onInviteMember,
}: IWorkspaceSectionProps) {
  const { t } = useTranslation();
  const activeWorkspace = accountWorkspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

  return (
    <>
      <Divider sx={{ my: 1 }} />
      <Box
        sx={{
          minWidth: 240,
          px: 2,
          pb: 0,
          "& .workspace-action": {
            opacity: 0,
            pointerEvents: "none",
            transition: "opacity 120ms ease",
          },
          "&:hover .workspace-action, &:focus-within .workspace-action": {
            opacity: 1,
            pointerEvents: "auto",
          },
          "&:hover .workspace-invite-action, &:focus-within .workspace-invite-action":
            {
              display: "inline-flex",
            },
          "@media (hover: none)": {
            "& .workspace-action": {
              opacity: 1,
              pointerEvents: "auto",
            },
            "& .workspace-invite-action": {
              display: "inline-flex",
            },
          },
        }}
      >
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
                disabled={isLoadingWorkspaces || switchingWorkspaceId !== null}
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
            className="workspace-action"
            size="small"
            aria-label={t("account.workspaceCreate")}
            title={t("account.workspaceCreate")}
            onClick={onCreateWorkspace}
          >
            <AddOutlinedIcon fontSize="small" />
          </IconButton>
          {activeWorkspace?.role === "owner" ? (
            <IconButton
              className="workspace-action"
              size="small"
              aria-label={t("account.workspaceRename")}
              title={t("account.workspaceRename")}
              onClick={onRenameWorkspace}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          ) : null}
          {accountWorkspaces.length > 1 && activeWorkspace?.role === "owner" ? (
            <IconButton
              className="workspace-action"
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
            className="workspace-action workspace-invite-action"
            size="small"
            startIcon={<GroupAddOutlinedIcon />}
            onClick={onInviteMember}
            sx={{ display: "none", mt: 1 }}
          >
            {t("notifications.manageInvites")}
          </Button>
        ) : null}
      </Box>
    </>
  );
}

interface IPreferencesSectionProps {
  language: "pt" | "en";
  onSelectLanguage: (language: "pt" | "en") => void;
  onOpenColorSettings: () => void;
}

export function ProfilePreferencesSection({
  language,
  onSelectLanguage,
  onOpenColorSettings,
}: IPreferencesSectionProps) {
  const { t } = useTranslation();

  return (
    <>
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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 1 }}
        >
          <Typography variant="body2">{t("colors.label")}</Typography>
          <Button
            size="small"
            startIcon={<PaletteOutlinedIcon />}
            onClick={onOpenColorSettings}
          >
            {t("colors.customize")}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
