import type {
  TypeLocalTask,
  TypeLocalTaskStatus,
  TypeLocalTaskPriority,
} from "@/types/localData";

export function filterTasks(
  tasks: TypeLocalTask[],
  search: string,
  status: TypeLocalTaskStatus | "all",
  priority: TypeLocalTaskPriority | "all",
) {
  const normalizedSearch = search.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (!normalizedSearch ||
        `${task.name} ${task.description ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch)) &&
      (status === "all" || task.status === status) &&
      (priority === "all" || task.priority === priority),
  );
}
