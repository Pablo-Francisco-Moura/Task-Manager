import { Hono } from "hono";
import { taskRoutes } from "./task";
import { healthRoutes } from "./health";
import { projectRoutes } from "./project";

const app = new Hono()
  .route("task", taskRoutes)
  .route("health", healthRoutes)
  .route("project", projectRoutes);

export { app };
