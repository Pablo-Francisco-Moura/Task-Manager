import type { Task } from "@prisma/client";

export type TypeCreateTaskInput = Pick<Task, "name" | "projectId">;
export type TypeCreateTaskResponse = Task;
export type TypeDeleteTaskResponse = void;
export type TypeGetTaskResponse = Task[];
export type TypeUpdateTaskInput = Pick<Task, "id" | "name" | "projectId">;
export type TypeUpdateTaskResponse = Task;
