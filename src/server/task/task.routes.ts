import { Hono } from "hono";
import { taskOrderRoutes } from "./task.order.routes";
import { taskUpdateRoutes } from "./task.update.routes";
import { taskCollectionRoutes } from "./task.collection.routes";
import type { TypeSessionEnv } from "@/server/session";

const taskRoutes = new Hono<TypeSessionEnv>();
taskRoutes.route("/", taskOrderRoutes);
taskRoutes.route("/", taskUpdateRoutes);
taskRoutes.route("/", taskCollectionRoutes);

export { taskRoutes };
