import {
  Box,
  Stack,
  Button,
  Tooltip,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProjectActivityAction } from "./ProjectActivityAction";
import type {
  TypeProjectActivity,
  TypeTaskMovementDetails,
  TypeProjectActivityDetail,
} from "@/types";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";

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
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const isEditing = editingActivity === activity.id;
  const isComment = activity.type === "comment";
  const isOwnComment = activity.canEdit;
  const movement = getTaskMovementDetails(activity);
  const activityDetails = isComment ? [] : getActivityDetails(activity);
  const hasMovementDetails = Boolean(
    movement &&
    ((movement.fromStatus && movement.toStatus) ||
      (movement.fromPosition !== null &&
        movement.toPosition !== null &&
        movement.fromPosition !== movement.toPosition)),
  );
  const hasMoreDetails = hasMovementDetails || activityDetails.length > 0;
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: isComment
          ? isOwnComment
            ? "flex-end"
            : "flex-start"
          : "center",
        pt: isComment ? 0.75 : 1,
        pb:
          isComment &&
          (activity.canEdit || activity.canDelete) &&
          !activity.isDeleted
            ? 2
            : isComment
              ? 0.75
              : hasMoreDetails
                ? 2.5
                : 1,
        "&:hover .activity-details-toggle, &:focus-within .activity-details-toggle":
          {
            opacity: 1,
          },
        "&:hover .activity-comment-actions, &:focus-within .activity-comment-actions":
          {
            opacity: 1,
            pointerEvents: "auto",
          },
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
          <ProjectActivityAction
            activity={activity}
            details={activityDetails}
            movement={movement}
            isExpanded={isDetailsExpanded}
            formatDate={formatDate}
          />
        )}
      </Box>
      {!isComment && hasMoreDetails ? (
        <Button
          className="activity-details-toggle"
          size="small"
          aria-expanded={isDetailsExpanded}
          onClick={() => setIsDetailsExpanded((expanded) => !expanded)}
          endIcon={
            isDetailsExpanded ? (
              <ExpandLessOutlinedIcon />
            ) : (
              <ExpandMoreOutlinedIcon />
            )
          }
          sx={{
            position: "absolute",
            right: 0,
            bottom: -4,
            zIndex: 1,
            minHeight: 28,
            opacity: isDetailsExpanded ? 1 : 0,
            bgcolor: "background.paper",
            boxShadow: 1,
            textTransform: "none",
            transition: "opacity 120ms ease",
            "@media (hover: none)": { opacity: 1 },
          }}
        >
          {t(
            isDetailsExpanded ? "activity.hideDetails" : "activity.showDetails",
          )}
        </Button>
      ) : null}
      {isComment &&
      (activity.canEdit || activity.canDelete) &&
      !activity.isDeleted &&
      !isEditing ? (
        <Stack
          className="activity-comment-actions"
          direction="row"
          spacing={0.25}
          sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            opacity: 0,
            pointerEvents: "none",
            zIndex: 2,
            transition: "opacity 120ms ease",
            "@media (hover: none)": {
              opacity: 1,
              pointerEvents: "auto",
            },
          }}
        >
          {activity.canEdit ? (
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
