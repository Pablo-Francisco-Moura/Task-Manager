import {
  Box,
  Alert,
  Radio,
  Button,
  Dialog,
  Checkbox,
  FormGroup,
  RadioGroup,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from "@mui/material";
import {
  getWorkspaceMemberColor,
  isWorkspaceMemberColorIndex,
  WORKSPACE_MEMBER_COLOR_INDICES,
} from "@/utils/workspaceMemberColors";
import { useTranslation } from "react-i18next";
import type {
  TypeMemberProject,
  TypeWorkspaceMember,
  TypeWorkspaceMemberColorIndex,
} from "@/types";

interface IProps {
  projects: TypeMemberProject[];
  memberToEdit: TypeWorkspaceMember | null;
  memberToColor: TypeWorkspaceMember | null;
  mutationError: string | null;
  isSavingColor: boolean;
  memberToRemove: TypeWorkspaceMember | null;
  isSavingProjects: boolean;
  isRemovingMember: boolean;
  selectedProjectIds: number[];
  selectedColorIndex: TypeWorkspaceMemberColorIndex;
  onCloseEdit: () => void;
  onSaveColor: () => void;
  onCloseColor: () => void;
  onCloseRemove: () => void;
  onSaveProjects: () => void;
  onRemoveMember: () => void;
  onSelectedProjectIdsChange: (projectIds: number[]) => void;
  onSelectedColorIndexChange: (
    colorIndex: TypeWorkspaceMemberColorIndex,
  ) => void;
}

export function MemberManagementDialogs({
  projects,
  memberToEdit,
  memberToColor,
  mutationError,
  isSavingColor,
  memberToRemove,
  isSavingProjects,
  isRemovingMember,
  selectedProjectIds,
  selectedColorIndex,
  onCloseEdit,
  onSaveColor,
  onCloseColor,
  onCloseRemove,
  onSaveProjects,
  onRemoveMember,
  onSelectedProjectIdsChange,
  onSelectedColorIndexChange,
}: IProps) {
  const { t } = useTranslation();

  return (
    <>
      <Dialog
        open={memberToColor !== null}
        onClose={onCloseColor}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {t("members.chatColorTitle", {
            name: memberToColor?.displayName ?? "",
          })}
        </DialogTitle>
        <DialogContent>
          {mutationError ? (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {mutationError}
            </Alert>
          ) : null}
          <RadioGroup
            value={selectedColorIndex}
            onChange={(event) => {
              const nextColorIndex = Number(event.target.value);
              if (isWorkspaceMemberColorIndex(nextColorIndex)) {
                onSelectedColorIndexChange(nextColorIndex);
              }
            }}
          >
            {WORKSPACE_MEMBER_COLOR_INDICES.map((colorIndex) => (
              <FormControlLabel
                key={colorIndex}
                value={colorIndex}
                control={<Radio />}
                label={
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        bgcolor: getWorkspaceMemberColor(colorIndex),
                      }}
                    />
                    {t("members.chatColorOption", { colorIndex })}
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseColor} disabled={isSavingColor}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={isSavingColor}
            onClick={onSaveColor}
          >
            {isSavingColor ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

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
