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
import { useState } from "react";
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
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";

function truncateActivityName(value: string) {
  const characters = Array.from(value);
  return characters.length > 12
    ? `${characters.slice(0, 12).join("")}...`
    : value;
}

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
  const renderTruncatedName = (name: string) => (
    <Tooltip title={name} disableHoverListener={Array.from(name).length <= 12}>
      <Typography
        component="span"
        variant="caption"
        color="text.secondary"
        whiteSpace="nowrap"
      >
        {truncateActivityName(name)}
      </Typography>
    </Tooltip>
  );

  const renderActionSummary = () => {
    const details = activity.details ?? {};
    let verbKey: string;
    let subjectName: string;
    let suffixKey = "";

    switch (activity.type) {
      case "project_created":
      case "project_updated":
        verbKey = `activity.${activity.type}Verb`;
        subjectName =
          (typeof details.projectName === "string" && details.projectName) ||
          activity.taskName ||
          "";
        break;
      case "member_added":
        verbKey = `activity.${activity.type}Verb`;
        subjectName =
          (typeof details.memberName === "string" && details.memberName) || "";
        suffixKey = "activity.memberAddedSuffix";
        break;
      case "member_removed":
        verbKey = `activity.${activity.type}Verb`;
        subjectName =
          (typeof details.memberName === "string" && details.memberName) || "";
        suffixKey = "activity.memberRemovedSuffix";
        break;
      case "task_created":
      case "task_updated":
      case "task_moved":
      case "task_deleted":
        verbKey = `activity.${activity.type}Verb`;
        subjectName = activity.taskName ?? "";
        break;
      default:
        return (
          <Typography variant="caption" color="text.secondary">
            {t(`activity.${activity.type}`, {
              actor: activity.actorName,
              task: activity.taskName ?? "",
              project: activity.details?.projectName ?? activity.taskName ?? "",
              member: activity.details?.memberName ?? "",
            })}
          </Typography>
        );
    }

    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden" }}
      >
        {renderTruncatedName(activity.actorName)}
        <Typography
          variant="caption"
          color="text.secondary"
          whiteSpace="nowrap"
        >
          {t(verbKey)}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ minWidth: 0, whiteSpace: "nowrap" }}
        >
          {renderTruncatedName(subjectName)}
          {suffixKey ? (
            <Typography
              variant="caption"
              color="text.secondary"
              whiteSpace="nowrap"
            >
              {t(suffixKey)}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    );
  };

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
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ minWidth: 0, width: "100%" }}
            >
              {renderActionSummary()}
              <Typography
                variant="caption"
                color="text.secondary"
                whiteSpace="nowrap"
                sx={{ flexShrink: 0, opacity: 0.8 }}
              >
                {formatDate(activity.createdAt)}
              </Typography>
            </Stack>
            {isDetailsExpanded && movement?.toStatus ? (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={0.5}
                sx={{ mt: 0.25 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t("activity.column")}:
                </Typography>
                {movement.fromStatus &&
                movement.fromStatus !== movement.toStatus ? (
                  <>
                    {renderStatusChip(movement.fromStatus)}
                    <SwapHorizOutlinedIcon
                      fontSize="small"
                      color="action"
                      aria-hidden="true"
                    />
                  </>
                ) : null}
                {renderStatusChip(movement.toStatus)}
              </Stack>
            ) : null}
            {movement &&
            isDetailsExpanded &&
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
            {isDetailsExpanded &&
              activityDetails.map((detail, index) => (
                <Stack
                  key={`${activity.id}-detail-${index}`}
                  spacing={0.5}
                  sx={{ mt: 0.75, width: "100%", textAlign: "left" }}
                >
                  <Typography variant="caption" fontWeight={700}>
                    {t(`activity.fields.${detail.field}`)}
                  </Typography>
                  <Stack
                    alignItems="flex-start"
                    spacing={0.5}
                    sx={{ minWidth: 0, pl: 0.5 }}
                  >
                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("activity.previousValue")}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="error.main"
                        sx={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                          textDecoration: "line-through",
                        }}
                      >
                        {detail.from || t("activity.emptyValue")}
                      </Typography>
                    </Stack>
                    <SwapVertOutlinedIcon
                      fontSize="small"
                      color="action"
                      aria-hidden="true"
                      sx={{ alignSelf: "center" }}
                    />
                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("activity.afterValue")}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="success.main"
                        sx={{
                          minWidth: 0,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {detail.to || t("activity.emptyValue")}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              ))}
          </>
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
