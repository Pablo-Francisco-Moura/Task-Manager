export type TypeLocalTaskStatus = "todo" | "in_progress" | "done";

export type TypeLocalTaskPriority = "low" | "normal" | "high";

export type TypeLocalProject = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TypeLocalProjectWithTasks = TypeLocalProject & {
  tasks: TypeLocalTask[];
};

export type TypeLocalTask = {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  dueDate: Date | null;
  dueAt: Date | null;
  status: TypeLocalTaskStatus;
  priority: TypeLocalTaskPriority;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TypeLocalWorkspaceData = {
  nextProjectId: number;
  nextTaskId: number;
  projects: TypeLocalProject[];
  tasks: TypeLocalTask[];
};

export type TypeLocalTaskOrder = {
  projectId: number;
  orderedTaskIdsByStatus: Record<TypeLocalTaskStatus, number[]>;
};
