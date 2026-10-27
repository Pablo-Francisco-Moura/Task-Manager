import { useTranslation } from "react-i18next";
import type { TypeProjectActivity } from "@/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function useActivityFormatters() {
  const { t, i18n } = useTranslation();

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));

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

  const getActivityDetails = (activity: TypeProjectActivity) => {
    const details = activity.details ?? {};
    const changes = asRecord(details.changes) ?? {};
    const changeLines = Object.entries(changes).flatMap(([field, value]) => {
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
        t("activity.change", {
          field: t(`activity.fields.${field}`),
          from: formatDetailValue(field, from),
          to: formatDetailValue(field, to),
        }),
      ];
    });

    if (activity.type === "task_moved") {
      if (
        typeof details.fromProjectName === "string" &&
        typeof details.toProjectName === "string" &&
        details.fromProjectName !== details.toProjectName
      ) {
        changeLines.push(
          t("activity.movedProject", {
            from: details.fromProjectName,
            to: details.toProjectName,
          }),
        );
      } else if (
        changeLines.length === 0 &&
        typeof details.fromStatus === "string" &&
        typeof details.toStatus === "string" &&
        details.fromStatus !== details.toStatus
      ) {
        changeLines.push(
          t("activity.movedStatus", {
            from: formatDetailValue("status", details.fromStatus),
            to: formatDetailValue("status", details.toStatus),
          }),
        );
      }
      if (
        typeof details.fromPosition === "number" &&
        typeof details.toPosition === "number" &&
        details.fromPosition !== details.toPosition
      ) {
        changeLines.push(
          t("activity.movedPosition", {
            from: details.fromPosition + 1,
            to: details.toPosition + 1,
          }),
        );
      }
    }
    return changeLines;
  };

  return { formatDate, getActivityDetails };
}
