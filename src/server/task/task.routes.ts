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
  try {
    const task = await prisma.task.create({
      data: { name, projectId },
    });
    return c.json(task, 201);
  } catch (err: any) {
    // Handles foreign key errors. (project not found).
    if (err.code === "P2003") {
      return c.json({ error: "Project not found" }, 404);
    }
    throw err;
  }
});

// GET /api/tasks?projectId=ID - List all tasks for a project.
taskRoutes.get("/", async (c) => {
  const projectId = Number(c.req.query("projectId"));
  if (!projectId) {
    return c.json({ error: "projectId is required" }, 400);
  }

  // Check if the project exists.
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const tasks = await prisma.task.findMany({ where: { projectId } });
  return c.json(tasks, 200);
});

// DELETE /api/task/:id - Delete a task by id.
taskRoutes.delete(":id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!id) {
    return c.json({ error: "id is required" }, 400);
  }

  try {
    await prisma.task.delete({ where: { id } });
    return c.json({ message: "Task deleted successfully" }, 200);
  } catch (error) {
    return c.json({ error: "Task not found" }, 404);
  }
});

export { taskRoutes };
