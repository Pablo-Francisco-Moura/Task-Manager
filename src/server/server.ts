import { Hono } from "hono";
import { healthRoutes } from "./health";
import { projectRoutes } from "./project";

const app = new Hono()
  .route("health", healthRoutes)
  .route("project", projectRoutes);

export { app };
