import { Hono } from "hono";
import { taskRoutes } from "./task";
import { healthRoutes } from "./health";
import { projectRoutes } from "./project";

const app = new Hono()
  .route("health", healthRoutes)
  .route("project", projectRoutes)
  .route("task", taskRoutes);

export { app };
