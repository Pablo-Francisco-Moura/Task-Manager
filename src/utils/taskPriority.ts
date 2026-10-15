export type TaskPriorityValue = "low" | "normal" | "high";

export function normalizeTaskPriority(
  value?: string | null,
): TaskPriorityValue {
  return value === "low" || value === "normal" || value === "high"
    ? value
    : "normal";
}

export function getTaskPriorityTranslationKey(value?: string | null): string {
  return `task.priority.${normalizeTaskPriority(value)}`;
}
