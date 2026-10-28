import { useTranslation } from "react-i18next";
import { Chip, Stack, Tooltip, Typography } from "@mui/material";
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
    const activityData = activity.details ?? {};
    let verbKey: string;
    let subjectName: string;
    let suffixKey = "";

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
  );
}
