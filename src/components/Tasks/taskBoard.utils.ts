import { taskStatuses } from "@/constants";
import type { TypeLocalTask, TypeLocalTaskStatus } from "@/types/localData";
import type { TasksByStatus } from "@/types";

export function getColumnId(status: TypeLocalTaskStatus) {
  return `column:${status}`;
}

export function getColumnStatus(id: string): TypeLocalTaskStatus | undefined {
  return taskStatuses.find((status) => getColumnId(status) === id);
}

function sortByPosition(first: TypeLocalTask, second: TypeLocalTask) {
  return first.position - second.position || first.id - second.id;
}

export function groupTasks(tasks: TypeLocalTask[]): TasksByStatus {
  return {
    todo: tasks.filter((task) => task.status === "todo").sort(sortByPosition),
    in_progress: tasks
      .filter((task) => task.status === "in_progress")
      .sort(sortByPosition),
    done: tasks.filter((task) => task.status === "done").sort(sortByPosition),
  };
}
