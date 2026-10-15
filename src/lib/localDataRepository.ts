import type {
  TypeLocalTask,
  TypeLocalProject,
  TypeLocalTaskOrder,
  TypeLocalTaskStatus,
  TypeLocalTaskPriority,
  TypeLocalWorkspaceData,
  TypeLocalProjectWithTasks,
} from "@/types/localData";
import {
  EMPTY_WORKSPACE_DATA,
  LOCAL_STORAGE_KEY,
} from "@/constants/localData";

function readWorkspaceData(): TypeLocalWorkspaceData {
  const storedData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!storedData) return structuredClone(EMPTY_WORKSPACE_DATA);

  const parsedData = JSON.parse(storedData) as TypeLocalWorkspaceData;
  return {
    ...parsedData,
    projects: parsedData.projects.map((project) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    })),
    tasks: parsedData.tasks.map((task) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      dueAt: task.dueAt ? new Date(task.dueAt) : null,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    })),
  };
}

function writeWorkspaceData(data: TypeLocalWorkspaceData): void {
  window.localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify(data),
  );
}

function getProjectOrThrow(
  data: TypeLocalWorkspaceData,
  projectId: number,
): TypeLocalProject {
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) throw new Error("Project not found");
  return project;
}

export function getLocalProjects(): TypeLocalProjectWithTasks[] {
  const data = readWorkspaceData();
  return data.projects.map((project) => ({
    ...project,
    tasks: data.tasks.filter((task) => task.projectId === project.id),
  }));
}

export function getLocalTasks(projectId: number): TypeLocalTask[] {
  return readWorkspaceData()
    .tasks.filter((task) => task.projectId === projectId)
    .sort(
      (left, right) =>
        left.status.localeCompare(right.status) ||
        left.position - right.position ||
        left.id - right.id,
    );
}

export function createLocalProject(input: {
  name: string;
  description?: string | null;
}): TypeLocalProject {
  const data = readWorkspaceData();
  const now = new Date();
  const project: TypeLocalProject = {
    id: data.nextProjectId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  data.nextProjectId += 1;
  data.projects.push(project);
  writeWorkspaceData(data);
  return project;
}

export function updateLocalProject(
  id: number,
  input: { name?: string; description?: string | null },
): TypeLocalProject {
  const data = readWorkspaceData();
  const project = getProjectOrThrow(data, id);
  if (input.name !== undefined) project.name = input.name.trim();
  if (input.description !== undefined) {
    project.description = input.description?.trim() || null;
  }
  project.updatedAt = new Date();
  writeWorkspaceData(data);
  return project;
}

export function deleteLocalProject(id: number): void {
  const data = readWorkspaceData();
  data.projects = data.projects.filter((project) => project.id !== id);
  data.tasks = data.tasks.filter((task) => task.projectId !== id);
  writeWorkspaceData(data);
}

export function createLocalTask(input: {
  name: string;
  projectId: number;
  description?: string | null;
  dueDate?: Date | null;
  dueAt?: Date | null;
  status?: TypeLocalTaskStatus;
  priority?: TypeLocalTaskPriority;
}): TypeLocalTask {
  const data = readWorkspaceData();
  getProjectOrThrow(data, input.projectId);
  const status = input.status ?? "todo";
  const lastPosition = data.tasks
    .filter(
      (task) => task.projectId === input.projectId && task.status === status,
    )
    .reduce((maxPosition, task) => Math.max(maxPosition, task.position), -1);
  const now = new Date();
  const task: TypeLocalTask = {
    id: data.nextTaskId,
    projectId: input.projectId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    dueDate: input.dueDate ?? null,
    dueAt: input.dueAt ?? null,
    status,
    priority: input.priority ?? "normal",
    position: lastPosition + 1,
    createdAt: now,
    updatedAt: now,
  };

  data.nextTaskId += 1;
  data.tasks.push(task);
  writeWorkspaceData(data);
  return task;
}

export function updateLocalTask(
  id: number,
  input: {
    name?: string;
    projectId?: number;
    description?: string | null;
    dueDate?: Date | null;
    dueAt?: Date | null;
    status?: TypeLocalTaskStatus;
    priority?: TypeLocalTaskPriority;
  },
): TypeLocalTask {
  const data = readWorkspaceData();
  const task = data.tasks.find((item) => item.id === id);
  if (!task) throw new Error("Task not found");

  const destinationProjectId = input.projectId ?? task.projectId;
  getProjectOrThrow(data, destinationProjectId);
  const destinationStatus = input.status ?? task.status;
  if (
    destinationProjectId !== task.projectId ||
    destinationStatus !== task.status
  ) {
    const lastPosition = data.tasks
      .filter(
        (item) =>
          item.projectId === destinationProjectId &&
          item.status === destinationStatus &&
          item.id !== task.id,
      )
      .reduce((maxPosition, item) => Math.max(maxPosition, item.position), -1);
    task.position = lastPosition + 1;
  }

  if (input.name !== undefined) task.name = input.name.trim();
  if (input.projectId !== undefined) task.projectId = input.projectId;
  if (input.description !== undefined) {
    task.description = input.description?.trim() || null;
  }
  if (input.dueDate !== undefined) task.dueDate = input.dueDate;
  if (input.dueAt !== undefined) task.dueAt = input.dueAt;
  if (input.status !== undefined) task.status = input.status;
  if (input.priority !== undefined) task.priority = input.priority;
  task.updatedAt = new Date();
  writeWorkspaceData(data);
  return task;
}

export function deleteLocalTask(id: number): void {
  const data = readWorkspaceData();
  data.tasks = data.tasks.filter((task) => task.id !== id);
  writeWorkspaceData(data);
}

export function reorderLocalTasks(input: TypeLocalTaskOrder): TypeLocalTask[] {
  const data = readWorkspaceData();
  getProjectOrThrow(data, input.projectId);
  const taskIds = Object.values(input.orderedTaskIdsByStatus).flat();
  const projectTasks = data.tasks.filter(
    (task) => task.projectId === input.projectId,
  );
  const uniqueIds = new Set(taskIds);

  if (
    uniqueIds.size !== taskIds.length ||
    taskIds.length !== projectTasks.length ||
    projectTasks.some((task) => !uniqueIds.has(task.id))
  ) {
    throw new Error("Task list changed; reload the board");
  }

  for (const status of ["todo", "in_progress", "done"] as const) {
    input.orderedTaskIdsByStatus[status].forEach((id, position) => {
      const task = data.tasks.find(
        (item) => item.id === id && item.projectId === input.projectId,
      );
      if (!task) throw new Error("Task not found");
      task.status = status;
      task.position = position;
      task.updatedAt = new Date();
    });
  }

  writeWorkspaceData(data);
  return getLocalTasks(input.projectId);
}
