import type {
  TypeLocalTask,
  TypeLocalTaskStatus,
  TypeLocalTaskPriority,
} from "./localData";

export type TypeCreateTaskInput = Pick<TypeLocalTask, "name" | "projectId"> & {
  dueAt?: string | null;
  status?: TypeLocalTaskStatus;
  dueDate?: string | null;
  priority?: TypeLocalTaskPriority;
  description?: string | null;
};

export type TypeCreateTaskResponse = TypeLocalTask;

export type TypeDeleteTaskResponse = void;

export type TypeGetTaskResponse = TypeLocalTask[];

export type TypeUpdateTaskInput = Pick<TypeLocalTask, "id"> & {
  name?: string;
  dueAt?: string | null;
  status?: TypeLocalTaskStatus;
  dueDate?: string | null;
  priority?: TypeLocalTaskPriority;
  projectId?: number;
  description?: string | null;
};

export type TypeUpdateTaskResponse = TypeLocalTask;

export type TypeReorderTasksInput = {
  projectId: number;
  movedTaskId: number;
  orderedTaskIdsByStatus: Record<TypeLocalTaskStatus, number[]>;
};

export type TypeReorderTasksResponse = TypeLocalTask[];
