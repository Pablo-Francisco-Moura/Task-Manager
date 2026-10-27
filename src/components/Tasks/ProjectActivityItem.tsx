import {
  Box,
  Stack,
  Button,
  Tooltip,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TypeProjectActivity } from "@/types";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface IProps {
  activity: TypeProjectActivity;
  isSaving: boolean;
  editingContent: string;
  editingActivity: number | null;
  onDelete: (activityId: number) => void;
  formatDate: (value: string) => string;
  onEditSave: (activityId: number) => void;
  onEditStart: (activity: TypeProjectActivity) => void;
  onEditCancel: () => void;
  getActivityDetails: (activity: TypeProjectActivity) => string[];
  onEditContentChange: (content: string) => void;
}

export function ProjectActivityItem({
  activity,
  isSaving,
  editingContent,
  editingActivity,
  onDelete,
  onEditSave,
  formatDate,
  onEditStart,
  onEditCancel,
  getActivityDetails,
  onEditContentChange,
}: IProps) {
  const { t } = useTranslation();
  const isEditing = editingActivity === activity.id;

  return (
    <Box sx={{ py: 1.5 }}>
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {activity.type === "comment" ? (
            <>
              <Typography variant="body2" fontWeight={700}>
                {activity.actorName}
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  value={editingContent}
                  onChange={(event) => onEditContentChange(event.target.value)}
                />
              ) : (
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {activity.isDeleted
                    ? t("activity.commentDeleted")
                    : activity.content}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography variant="body2">
                {t(`activity.${activity.type}`, {
                  actor: activity.actorName,
                  task: activity.taskName ?? "",
                  project:
                    activity.details?.projectName ?? activity.taskName ?? "",
                  member: activity.details?.memberName ?? "",
                })}
              </Typography>
              {getActivityDetails(activity).map((detail, index) => (
                <Typography
                  key={`${activity.id}-detail-${index}`}
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", overflowWrap: "anywhere" }}
                >
                  {detail}
                </Typography>
              ))}
            </>
          )}
          <Typography variant="caption" color="text.secondary">
            {formatDate(activity.createdAt)}
          </Typography>
        </Box>
        {activity.type === "comment" && !activity.isDeleted ? (
          <Stack direction="row" spacing={0.25}>
            {activity.canEdit && !isEditing ? (
              <Tooltip title={t("activity.edit")}>
                <IconButton
                  size="small"
                  aria-label={t("activity.edit")}
                  onClick={() => onEditStart(activity)}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            {activity.canDelete ? (
              <Tooltip title={t("activity.delete")}>
                <IconButton
                  size="small"
                  aria-label={t("activity.delete")}
                  disabled={isSaving}
                  onClick={() => onDelete(activity.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ) : null}
        {isEditing ? (
          <Stack direction="row" spacing={0.5}>
            <Button
              size="small"
              disabled={isSaving || !editingContent.trim()}
              onClick={() => onEditSave(activity.id)}
            >
              {t("activity.save")}
            </Button>
            <Button size="small" onClick={onEditCancel}>
              {t("activity.cancel")}
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
