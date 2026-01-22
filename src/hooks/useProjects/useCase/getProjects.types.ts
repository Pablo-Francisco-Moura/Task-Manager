import { Project, Task } from "@prisma/client";

export type GetProjectResponse = (Project & { tasks: Task[] })[];
