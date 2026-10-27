import type { TypeLocalTask, TypeLocalTaskStatus } from "./localData";

export type TasksByStatus = Record<TypeLocalTaskStatus, TypeLocalTask[]>;
