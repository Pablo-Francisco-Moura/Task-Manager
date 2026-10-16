import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { ACCOUNT_WORKSPACE_SUGGESTIONS } from "@/constants/session";
import type { ReactNode } from "react";
import type { TypeWorkspaceMembership } from "@/types";
import WorkspacesOutlinedIcon from "@mui/icons-material/WorkspacesOutlined";

interface IProps {
  children: ReactNode;
  newWorkspaceName: string;
  isEditProfileOpen: boolean;
  editedProfileName: string;
  workspaceToDelete: TypeWorkspaceMembership | null;
  isImportDialogOpen: boolean;
  isDeletingWorkspace: boolean;
  isCreatingWorkspace: boolean;
  isRenamingWorkspace: boolean;
  renamedWorkspaceName: string;
  isResettingWorkspace: boolean;
  isRenameWorkspaceOpen: boolean;
  isCreateWorkspaceOpen: boolean;
  onCreateWorkspace: () => void;
  onRenameWorkspace: () => void;
  onDeleteWorkspace: () => void;
  onSaveGuestProfile: () => void;
  onCloseEditProfile: () => void;
  onCloseImportDialog: (status: "imported" | "dismissed") => void;
  onCloseCreateWorkspace: () => void;
  onCloseRenameWorkspace: () => void;
  onCloseDeleteWorkspace: () => void;
  onNewWorkspaceNameChange: (name: string) => void;
  onEditedProfileNameChange: (name: string) => void;
  onRenamedWorkspaceNameChange: (name: string) => void;
}

export function AppBarDialogs({
  children,
  newWorkspaceName,
  isEditProfileOpen,
  editedProfileName,
  workspaceToDelete,
  isImportDialogOpen,
  isDeletingWorkspace,
  isCreatingWorkspace,
  isRenamingWorkspace,
  isResettingWorkspace,
  renamedWorkspaceName,
  isRenameWorkspaceOpen,
  isCreateWorkspaceOpen,
  onCreateWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  onSaveGuestProfile,
  onCloseEditProfile,
  onCloseImportDialog,
  onCloseRenameWorkspace,
  onCloseCreateWorkspace,
  onCloseDeleteWorkspace,
  onNewWorkspaceNameChange,
  onEditedProfileNameChange,
  onRenamedWorkspaceNameChange,
}: IProps) {
  const { t } = useTranslation();

  return (
    <>
      <Dialog
        open={isImportDialogOpen}
        onClose={() => onCloseImportDialog("dismissed")}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("account.import.title")}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {t("account.import.description")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onCloseImportDialog("dismissed")}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => onCloseImportDialog("imported")}
          >
            {t("account.import.submit")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isCreateWorkspaceOpen}
        onClose={() => !isCreatingWorkspace && onCloseCreateWorkspace()}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("account.workspaceCreateTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("account.workspaceName")}
            value={newWorkspaceName}
            onChange={(event) => onNewWorkspaceNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onCreateWorkspace();
            }}
          />
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {t("account.suggestions")}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ mt: 1 }}
            >
              {ACCOUNT_WORKSPACE_SUGGESTIONS.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  variant={
                    newWorkspaceName === suggestion ? "filled" : "outlined"
                  }
                  onClick={() => onNewWorkspaceNameChange(suggestion)}
                  clickable
                />
              ))}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onCloseCreateWorkspace}
            disabled={isCreatingWorkspace}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={onCreateWorkspace}
            disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
          >
            {isCreatingWorkspace
              ? t("common.saving")
              : t("account.workspaceCreate")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isRenameWorkspaceOpen}
        onClose={() => !isRenamingWorkspace && onCloseRenameWorkspace()}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("account.workspaceRenameTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("account.workspaceName")}
            value={renamedWorkspaceName}
            onChange={(event) =>
              onRenamedWorkspaceNameChange(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") onRenameWorkspace();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onCloseRenameWorkspace}
            disabled={isRenamingWorkspace}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={onRenameWorkspace}
            disabled={isRenamingWorkspace || !renamedWorkspaceName.trim()}
          >
            {isRenamingWorkspace
              ? t("common.saving")
              : t("account.workspaceRename")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={workspaceToDelete !== null}
        onClose={() => !isDeletingWorkspace && onCloseDeleteWorkspace()}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("account.workspaceDeleteTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("account.workspaceDeleteConfirm", {
              name: workspaceToDelete?.name ?? "",
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onCloseDeleteWorkspace}
            disabled={isDeletingWorkspace}
          >
            {t("common.cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={onDeleteWorkspace}
            disabled={isDeletingWorkspace}
          >
            {isDeletingWorkspace
              ? t("common.deleting")
              : t("account.workspaceDelete")}
          </Button>
        </DialogActions>
      </Dialog>
      {children}
      <Dialog
        open={isEditProfileOpen}
        onClose={onCloseEditProfile}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("profile.editTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("account.displayName")}
            value={editedProfileName}
            onChange={(event) => onEditedProfileNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSaveGuestProfile();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseEditProfile}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={onSaveGuestProfile}>
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
      {isResettingWorkspace ? (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal + 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            bgcolor: "background.default",
            color: "text.primary",
          }}
        >
          <WorkspacesOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
          <CircularProgress size={28} aria-label={t("common.sessionLoading")} />
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="h6">{t("common.sessionLoading")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("common.sessionLoadingDetail")}
            </Typography>
          </Stack>
        </Box>
      ) : null}
    </>
  );
}
