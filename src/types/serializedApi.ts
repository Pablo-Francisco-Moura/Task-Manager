import type { TypeLocalProject, TypeLocalTask } from "./localData";

export type TypeSerializedProject = Omit<
  TypeLocalProject,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type TypeSerializedTask = Omit<
  TypeLocalTask,
  "createdAt" | "updatedAt" | "dueDate" | "dueAt"
> & {
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  dueAt: string | null;
};

export type TypeSerializedProjectWithTasks = TypeSerializedProject & {
  tasks: TypeSerializedTask[];
};
