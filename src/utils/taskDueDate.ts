function parseDueDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function toTaskDueDateInputValue(
  value: Date | string | null,
  includesTime = false,
): string {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.slice(0, 10);
  }

  const date = parseDueDate(value);
  if (Number.isNaN(date.getTime())) return "";

  if (includesTime) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return date.toISOString().slice(0, 10);
}

export function toTaskDueTimeInputValue(value: Date | string | null): string {
  if (!value) return "";

  const date = parseDueDate(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function toTaskDueAtISOString(
  dateValue: string,
  timeValue: string,
): string | null {
  if (!dateValue || !timeValue) return null;

  const date = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatTaskDueDate(
  value: Date | string,
  locale: string,
  includesTime = false,
): string {
  const date = parseDueDate(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    ...(includesTime ? { timeStyle: "short" } : { timeZone: "UTC" }),
  }).format(date);
}

export function isTaskDueDateOverdue(
  value: Date | string,
  now = new Date(),
  includesTime = false,
): boolean {
  if (includesTime) {
    const dueAt = parseDueDate(value);
    return !Number.isNaN(dueAt.getTime()) && dueAt.getTime() < now.getTime();
  }

  const dueDate = toTaskDueDateInputValue(value);
  if (!dueDate) return false;

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return dueDate < today;
}
