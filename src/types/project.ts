import type { Project, Task } from "@prisma/client";

export type TypeProjectWithTasks = Project & { tasks: Task[] };
export type TypeCreateProjectInput = Pick<Project, "name">;
export type TypeCreateProjectResponse = Project;
export type TypeDeleteProjectResponse = void;
export type TypeGetProjectResponse = TypeProjectWithTasks[];
export type TypeUpdateProjectResponse = Project;
