import { useTranslation } from "react-i18next";
import type {
  TypeLocalTaskStatus,
  TypeProjectActivity,
  TypeTaskMovementDetails,
  TypeProjectActivityDetail,
} from "@/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function useActivityFormatters() {
  const { t, i18n } = useTranslation();

  const formatDate = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const time = new Intl.DateTimeFormat(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    if (date.toDateString() === now.toDateString()) {
      return `${t("activity.today")}, ${time}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `${t("activity.yesterday")}, ${time}`;
    }
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  const formatDetailValue = (field: string, value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return t("activity.emptyValue");
    }
    if (field === "status") {
      const status = value === "in_progress" ? "inProgress" : String(value);
      return t(`task.status.${status}`);
    }
    if (field === "priority") {
      return t(`task.priority.${String(value)}`);
    }
    if (field === "dueDate" || field === "dueAt") {
      const date = new Date(String(value));
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(i18n.language, {
          dateStyle: "short",
          ...(field === "dueAt" ? { timeStyle: "short" as const } : {}),
          timeZone: field === "dueDate" ? "UTC" : undefined,
        }).format(date);
      }
    }
    return String(value);
  };

  const getActivityDetails = (
    activity: TypeProjectActivity,
  ): TypeProjectActivityDetail[] => {
    const details = activity.details ?? {};
    const changes = asRecord(details.changes) ?? {};
    const changeLines = Object.entries(changes).flatMap(([field, value]) => {
      if (
        activity.type === "task_moved" &&
        ["status", "position", "project"].includes(field)
      ) {
        return [];
      }
      const change = asRecord(value);
      if (!change || !("from" in change) || !("to" in change)) return [];
      const from =
        field === "position" && typeof change.from === "number"
          ? change.from + 1
          : change.from;
      const to =
        field === "position" && typeof change.to === "number"
          ? change.to + 1
          : change.to;
      return [
        {
          field,
          from: formatDetailValue(field, from),
          to: formatDetailValue(field, to),
        },
      ];
    });

    if (activity.type === "task_moved") {
      if (
        typeof details.fromProjectName === "string" &&
        typeof details.toProjectName === "string" &&
        details.fromProjectName !== details.toProjectName
      ) {
        changeLines.push({
          field: "project",
          from: details.fromProjectName,
          to: details.toProjectName,
        });
      }
    }
    return changeLines;
  };

  const getTaskMovementDetails = (
    activity: TypeProjectActivity,
  ): TypeTaskMovementDetails | null => {
    if (activity.type !== "task_moved") return null;
    const details = activity.details ?? {};
    const statuses: TypeLocalTaskStatus[] = ["todo", "in_progress", "done"];
    const fromStatus = statuses.includes(
      details.fromStatus as TypeLocalTaskStatus,
    )
      ? (details.fromStatus as TypeLocalTaskStatus)
      : null;
    const toStatus = statuses.includes(details.toStatus as TypeLocalTaskStatus)
      ? (details.toStatus as TypeLocalTaskStatus)
      : null;

    return {
      fromStatus,
      toStatus,
      fromPosition:
        typeof details.fromPosition === "number" ? details.fromPosition : null,
      toPosition:
        typeof details.toPosition === "number" ? details.toPosition : null,
    };
  };

  return { formatDate, getActivityDetails, getTaskMovementDetails };
}
