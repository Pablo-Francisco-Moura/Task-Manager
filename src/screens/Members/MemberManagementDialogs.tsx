import {
  Alert,
  Button,
  Dialog,
  Checkbox,
  FormGroup,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TypeMemberProject, TypeWorkspaceMember } from "@/types";

interface IProps {
  projects: TypeMemberProject[];
  memberToEdit: TypeWorkspaceMember | null;
  mutationError: string | null;
  memberToRemove: TypeWorkspaceMember | null;
  isSavingProjects: boolean;
  isRemovingMember: boolean;
  selectedProjectIds: number[];
  onCloseEdit: () => void;
  onCloseRemove: () => void;
  onSaveProjects: () => void;
  onRemoveMember: () => void;
  onSelectedProjectIdsChange: (projectIds: number[]) => void;
}

export function MemberManagementDialogs({
  projects,
  memberToEdit,
  mutationError,
  memberToRemove,
  isSavingProjects,
  isRemovingMember,
  selectedProjectIds,
  onCloseEdit,
  onCloseRemove,
  onSaveProjects,
  onRemoveMember,
  onSelectedProjectIdsChange,
}: IProps) {
  const { t } = useTranslation();

  return (
    <>
      <Dialog
        open={memberToEdit !== null}
        onClose={onCloseEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {t("members.manageTitle", { name: memberToEdit?.displayName ?? "" })}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t("members.manageDescription")}
          </Typography>
          {mutationError ? (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {mutationError}
            </Alert>
          ) : null}
          <FormGroup>
            {projects.map((project) => (
              <FormControlLabel
                key={project.id}
                label={project.name}
                control={
                  <Checkbox
                    checked={selectedProjectIds.includes(project.id)}
                    onChange={(event) =>
                      onSelectedProjectIdsChange(
                        event.target.checked
                          ? [...selectedProjectIds, project.id]
                          : selectedProjectIds.filter(
                              (id) => id !== project.id,
                            ),
                      )
                    }
                  />
                }
              />
            ))}
            {!projects.length ? (
              <Typography variant="body2" color="text.secondary">
                {t("members.noProjects")}
              </Typography>
            ) : null}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseEdit}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            disabled={isSavingProjects}
            onClick={onSaveProjects}
          >
            {isSavingProjects ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={memberToRemove !== null}
        onClose={onCloseRemove}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("members.removeTitle")}</DialogTitle>
        <DialogContent>
          {mutationError ? (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {mutationError}
            </Alert>
          ) : null}
          <Typography variant="body2">
            {t("members.removeConfirm", {
              name: memberToRemove?.displayName ?? "",
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseRemove}>{t("common.cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={isRemovingMember}
            onClick={onRemoveMember}
          >
            {isRemovingMember ? t("common.saving") : t("members.remove")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
