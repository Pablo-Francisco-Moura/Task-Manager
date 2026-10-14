import type { Project, Task } from "@prisma/client";

export type TypeProjectWithTasks = Project & { tasks: Task[] };
export type TypeCreateProjectInput = Pick<Project, "name"> & {
  description?: string | null;
};
export type TypeCreateProjectResponse = Project;
export type TypeDeleteProjectResponse = void;
export type TypeGetProjectResponse = TypeProjectWithTasks[];
export type TypeUpdateProjectInput = Pick<Project, "id"> & {
  name?: string;
  description?: string | null;
};
export type TypeUpdateProjectResponse = Project;
