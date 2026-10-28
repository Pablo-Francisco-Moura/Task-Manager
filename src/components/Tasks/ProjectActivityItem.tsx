import {
  Box,
  Chip,
  Stack,
  Button,
  Tooltip,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  TypeLocalTaskStatus,
  TypeProjectActivity,
  TypeTaskMovementDetails,
  TypeProjectActivityDetail,
} from "@/types";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";

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
  getActivityDetails: (
    activity: TypeProjectActivity,
  ) => TypeProjectActivityDetail[];
  getTaskMovementDetails: (
    activity: TypeProjectActivity,
  ) => TypeTaskMovementDetails | null;
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
  getTaskMovementDetails,
}: IProps) {
  const { t } = useTranslation();
  const isEditing = editingActivity === activity.id;
  const isComment = activity.type === "comment";
  const isOwnComment = activity.canEdit;
  const movement = getTaskMovementDetails(activity);

  const renderStatusChip = (status: TypeLocalTaskStatus) => (
    <Chip
      size="small"
      variant="filled"
      sx={{
        height: 22,
        fontWeight: 700,
        bgcolor: `var(--task-status-${status === "in_progress" ? "in-progress" : status}-background)`,
        color: `var(--task-status-${status === "in_progress" ? "in-progress" : status}-foreground)`,
        border: 1,
        borderColor: `var(--task-status-${status === "in_progress" ? "in-progress" : status}-border)`,
      }}
      label={t(
        `task.status.${status === "in_progress" ? "inProgress" : status}`,
      )}
    />
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: isComment
          ? isOwnComment
            ? "flex-end"
            : "flex-start"
          : "center",
        py: isComment ? 0.75 : 1,
      }}
    >
      <Box
        sx={
          isComment
            ? {
                width: "fit-content",
                maxWidth: "88%",
                minWidth: 120,
                px: 1.5,
                py: 1,
                borderRadius: isOwnComment
                  ? "12px 12px 3px 12px"
                  : "12px 12px 12px 3px",
                bgcolor: isOwnComment ? "primary.light" : "background.paper",
                border: 1,
                borderColor: isOwnComment ? "transparent" : "divider",
              }
            : {
                maxWidth: "95%",
                px: 1.25,
                py: 0.75,
                borderRadius: 2,
                bgcolor: "action.hover",
                textAlign: "center",
              }
        }
      >
        {isComment ? (
          <Stack spacing={0.5}>
            <Stack
              direction="row"
              alignItems="baseline"
              justifyContent="space-between"
              spacing={1}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color="primary.main"
              >
                {activity.actorName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                whiteSpace="nowrap"
              >
                {formatDate(activity.createdAt)}
              </Typography>
            </Stack>
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
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {activity.isDeleted
                  ? t("activity.commentDeleted")
                  : activity.content}
              </Typography>
            )}
          </Stack>
        ) : (
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
              spacing={0.5}
            >
              <Typography variant="caption" color="text.secondary">
                {t(`activity.${activity.type}`, {
                  actor: activity.actorName,
                  task: activity.taskName ?? "",
                  project:
                    activity.details?.projectName ?? activity.taskName ?? "",
                  member: activity.details?.memberName ?? "",
                })}
              </Typography>
              {movement?.toStatus ? (
                <Typography variant="caption" color="text.secondary">
                  {t("activity.column")}:
                </Typography>
              ) : null}
              {movement?.fromStatus && movement.toStatus ? (
                movement.fromStatus === movement.toStatus ? (
                  renderStatusChip(movement.toStatus)
                ) : (
                  <>
                    {renderStatusChip(movement.fromStatus)}
                    <SwapHorizOutlinedIcon
                      fontSize="small"
                      color="action"
                      aria-hidden="true"
                    />
                    {renderStatusChip(movement.toStatus)}
                  </>
                )
              ) : null}
            </Stack>
            {movement &&
            movement.fromPosition !== null &&
            movement.toPosition !== null &&
            movement.fromPosition !== movement.toPosition ? (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={0.5}
                sx={{ mt: 0.25 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t("activity.position")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {movement.fromPosition + 1}
                </Typography>
                <SwapHorizOutlinedIcon
                  fontSize="small"
                  color="action"
                  aria-hidden="true"
                />
                <Typography variant="caption" color="text.secondary">
                  {movement.toPosition + 1}
                </Typography>
              </Stack>
            ) : null}
            {getActivityDetails(activity).map((detail, index) => (
              <Stack
                key={`${activity.id}-detail-${index}`}
                direction="row"
                alignItems="center"
                justifyContent="center"
                flexWrap="wrap"
                useFlexGap
                spacing={0.5}
                sx={{ mt: 0.25 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t(`activity.fields.${detail.field}`)}:
                </Typography>
                {detail.isSummary ? (
                  <Typography variant="caption" color="text.secondary">
                    {t("activity.descriptionUpdated")}
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {detail.from}
                    </Typography>
                    <SwapHorizOutlinedIcon
                      fontSize="small"
                      color="action"
                      aria-hidden="true"
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {detail.to}
                    </Typography>
                  </>
                )}
              </Stack>
            ))}
            <Typography
              component="div"
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.25, opacity: 0.8 }}
            >
              {formatDate(activity.createdAt)}
            </Typography>
          </>
        )}
      </Box>
      {isComment && !activity.isDeleted ? (
        <Stack
          direction="row"
          spacing={0.25}
          sx={{ alignSelf: isOwnComment ? "flex-end" : "flex-start" }}
        >
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
    </Box>
  );
}
