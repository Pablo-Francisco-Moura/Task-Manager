import type { TypeLocalTaskStatus } from "@/types/localData";

export const taskStatuses: TypeLocalTaskStatus[] = [
  "todo",
  "in_progress",
  "done",
];

export const statusLabelKeys: Record<TypeLocalTaskStatus, string> = {
  todo: "task.status.todo",
  in_progress: "task.status.inProgress",
  done: "task.status.done",
};
