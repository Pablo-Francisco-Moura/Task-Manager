import type { TypeLocalProject, TypeLocalProjectWithTasks } from "./localData";

export type TypeProjectWithTasks = TypeLocalProjectWithTasks;
export type TypeCreateProjectInput = Pick<TypeLocalProject, "name"> & {
  description?: string | null;
};
export type TypeCreateProjectResponse = TypeLocalProject;
export type TypeDeleteProjectResponse = void;
export type TypeGetProjectResponse = TypeLocalProjectWithTasks[];
export type TypeUpdateProjectInput = Pick<TypeLocalProject, "id"> & {
  name?: string;
  description?: string | null;
};
export type TypeUpdateProjectResponse = TypeLocalProject;
