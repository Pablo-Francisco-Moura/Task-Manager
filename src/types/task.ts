import type { Task, TaskStatus } from "@prisma/client";

export type TypeCreateTaskInput = Pick<Task, "name" | "projectId"> & {
  description?: string | null;
};
export type TypeCreateTaskResponse = Task;
export type TypeDeleteTaskResponse = void;
export type TypeGetTaskResponse = Task[];
export type TypeUpdateTaskInput = Pick<Task, "id"> & {
  name?: string;
  status?: TaskStatus;
  projectId?: number;
  description?: string | null;
};
export type TypeUpdateTaskResponse = Task;
