import type { Task, TaskPriority, TaskStatus } from "@prisma/client";

export type TypeCreateTaskInput = Pick<Task, "name" | "projectId"> & {
  dueAt?: string | null;
  status?: TaskStatus;
  dueDate?: string | null;
  priority?: TaskPriority;
  description?: string | null;
};

export type TypeCreateTaskResponse = Task;

export type TypeDeleteTaskResponse = void;

export type TypeGetTaskResponse = Task[];

export type TypeUpdateTaskInput = Pick<Task, "id"> & {
  name?: string;
  dueAt?: string | null;
  status?: TaskStatus;
  dueDate?: string | null;
  priority?: TaskPriority;
  projectId?: number;
  description?: string | null;
};

export type TypeUpdateTaskResponse = Task;

export type TypeReorderTasksInput = {
  projectId: number;
  orderedTaskIdsByStatus: Record<TaskStatus, number[]>;
};

export type TypeReorderTasksResponse = Task[];
