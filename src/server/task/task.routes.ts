import { Hono } from "hono";
import { prisma } from "@/lib/prisma";

const taskRoutes = new Hono();

// POST /api/task - Create a new task linked to a project.
// Body: { name: string, projectId: number }
taskRoutes.post("/", async (c) => {
  const { name, projectId } = await c.req.json();
  if (!name || !projectId) {
    return c.json({ error: "name and projectId are required" }, 400);
  }

  // Check if the project exists.
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Create the task.
  const task = await prisma.task.create({
    data: { name, projectId },
  });
  return c.json(task, 201);
});

export { taskRoutes };
