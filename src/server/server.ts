import { Hono } from "hono";
import { taskRoutes } from "./task";
import { healthRoutes } from "./health";
import { projectRoutes } from "./project";
import { requireWorkspaceSession, sessionRoutes } from "./session";
import type { TypeSessionEnv } from "./session";

const protectedProjectRoutes = new Hono<TypeSessionEnv>()
  .use("*", requireWorkspaceSession)
  .route("/", projectRoutes);

const protectedTaskRoutes = new Hono<TypeSessionEnv>()
  .use("*", requireWorkspaceSession)
  .route("/", taskRoutes);

const app = new Hono()
  .route("session", sessionRoutes)
  .route("task", protectedTaskRoutes)
  .route("health", healthRoutes)
  .route("project", protectedProjectRoutes);

export { app };
