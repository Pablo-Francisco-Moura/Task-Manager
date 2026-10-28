import { Hono } from "hono";
import { projectMutationRoutes } from "./project.mutation.routes";
import { projectActivityRoutes } from "./project.activity.routes";
import { projectCollectionRoutes } from "./project.collection.routes";
import type { TypeSessionEnv } from "@/server/session";

const projectRoutes = new Hono<TypeSessionEnv>();
projectRoutes.route("/", projectCollectionRoutes);
projectRoutes.route("/", projectMutationRoutes);
projectRoutes.route("/", projectActivityRoutes);

export { projectRoutes };
