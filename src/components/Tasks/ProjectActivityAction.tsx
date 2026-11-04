import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserInfoDialog } from "@/components/Notifications/UserInfoDialog";
import { getWorkspaceMemberColor } from "@/utils/workspaceMemberColors";
import { ProjectActivityTaskDialog } from "./ProjectActivityTaskDialog";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import type {
  TypeLocalTaskStatus,
  TypeProjectActivity,
  TypeTaskMovementDetails,
  TypeProjectActivityDetail,
} from "@/types";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";

interface IProps {
  activity: TypeProjectActivity;
  details: TypeProjectActivityDetail[];
  movement: TypeTaskMovementDetails | null;
  isExpanded: boolean;
  formatDate: (value: string) => string;
}

function truncateActivityName(value: string) {
  const characters = Array.from(value);
  return characters.length > 12
    ? `${characters.slice(0, 12).join("")}...`
    : value;
}

export function ProjectActivityAction({
  activity,
  details,
  movement,
  isExpanded,
  formatDate,
}: IProps) {
  const { t } = useTranslation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  const renderTruncatedName = (
    name: string,
    color: string,
    onClick?: () => void,
  ) => (
    <Tooltip title={name} disableHoverListener={Array.from(name).length <= 12}>
      <Typography
        component={onClick ? "button" : "span"}
        type={onClick ? "button" : undefined}
        variant="caption"
        color={color}
        whiteSpace="nowrap"
        onClick={onClick}
        aria-haspopup={onClick ? "dialog" : undefined}
        sx={
          onClick
            ? {
                p: 0,
                border: 0,
                background: "none",
                fontWeight: 700,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }
            : undefined
        }
      >
        {truncateActivityName(name)}
      </Typography>
    </Tooltip>
  );

  const renderActionSummary = () => {
    const activityData = activity.details ?? {};
    let verbKey: string;
    let subjectName: string;
    let suffixKey = "";
    let taskSubject = false;

    switch (activity.type) {
      case "project_created":
      case "project_updated":
        verbKey = `activity.${activity.type}Verb`;
        subjectName =
          (typeof activityData.projectName === "string" &&
            activityData.projectName) ||
          activity.taskName ||
          "";
        break;
      case "member_added":
        verbKey = `activity.${activity.type}Verb`;
        subjectName =
          (typeof activityData.memberName === "string" &&
            activityData.memberName) ||
          "";
        suffixKey = "activity.memberAddedSuffix";
        break;
      case "member_removed":
        verbKey = `activity.${activity.type}Verb`;
        subjectName =
          (typeof activityData.memberName === "string" &&
            activityData.memberName) ||
          "";
        suffixKey = "activity.memberRemovedSuffix";
        break;
      case "task_created":
      case "task_updated":
      case "task_moved":
      case "task_deleted":
        verbKey = `activity.${activity.type}Verb`;
        subjectName = activity.taskName ?? "";
        taskSubject = true;
        break;
      case "comment_deleted":
        verbKey = "activity.comment_deletedVerb";
        subjectName = "";
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
        {renderTruncatedName(
          activity.actorName,
          getWorkspaceMemberColor(activity.actorColorIndex),
          () => setIsProfileOpen(true),
        )}
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
          {renderTruncatedName(
            subjectName,
            taskSubject ? "secondary.main" : "text.secondary",
            taskSubject ? () => setIsTaskOpen(true) : undefined,
          )}
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
    <>
      {isProfileOpen ? (
        <UserInfoDialog
          open
          displayName={activity.actorName}
          username={activity.actorUsername}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}
      {isTaskOpen ? (
        <ProjectActivityTaskDialog
          task={activity.task}
          taskName={activity.taskName ?? ""}
          open
          onClose={() => setIsTaskOpen(false)}
        />
      ) : null}
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
      {isExpanded && movement?.toStatus ? (
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
          {movement.fromStatus && movement.fromStatus !== movement.toStatus ? (
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
      isExpanded &&
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
      {isExpanded &&
        details.map((detail, index) => (
          <Box
            key={`${activity.id}-detail-${index}`}
            sx={{
              mt: 0.75,
              p: 1,
              width: "100%",
              textAlign: "left",
              border: 1,
              borderColor: "divider",
              borderRadius: 1.5,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="caption" fontWeight={700}>
              {t(`activity.fields.${detail.field}`)}
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 0.5, minWidth: 0 }}>
              <Box
                sx={{
                  minWidth: 0,
                  p: 0.75,
                  border: 1,
                  borderColor: "error.light",
                  borderRadius: 1,
                  bgcolor: "action.hover",
                }}
              >
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
              </Box>
              <SwapVertOutlinedIcon
                fontSize="small"
                color="action"
                aria-hidden="true"
                sx={{ alignSelf: "center" }}
              />
              <Box
                sx={{
                  minWidth: 0,
                  p: 0.75,
                  border: 1,
                  borderColor: "success.light",
                  borderRadius: 1,
                  bgcolor: "action.hover",
                }}
              >
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
              </Box>
            </Stack>
          </Box>
        ))}
    </>
  );
}
