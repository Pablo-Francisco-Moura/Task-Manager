import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";

const taskRoutes = new Hono();

// POST /api/task - Create a new task linked to a project.
// Body: { name: string, projectId: number }
taskRoutes.post(
  "/",
  describeRoute({
    tags: ["Task"],
    summary: "Create a new task linked to a project",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              projectId: { type: "integer" },
            },
            required: ["name", "projectId"],
          },
        },
      },
    },
    responses: {
      201: { description: "Task created" },
      404: { description: "Project not found" },
    },
  }),
  async (c) => {
    const { name, projectId } = await c.req.json();
    if (!name || !projectId) {
      return c.json({ error: "name and projectId are required" }, 400);
    }

    // Check if the project exists.
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
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
      if (err?.code === "P2003") {
        return c.json({ error: "Project not found" }, 404);
      }
      throw err;
    }
  },
);

// GET /api/tasks?projectId=ID - List all tasks for a project.
taskRoutes.get(
  "/",
  describeRoute({
    tags: ["Task"],
    summary: "List all tasks for a project",
    parameters: [
      {
        in: "query",
        name: "projectId",
        required: true,
        schema: { type: "integer" },
      },
    ],
    responses: {
      200: { description: "List of tasks" },
      404: { description: "Project not found" },
    },
  }),
  async (c) => {
    const projectId = Number(c.req.query("projectId"));
    if (!projectId) {
      return c.json({ error: "projectId is required" }, 400);
    }

    // Check if the project exists.
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    const tasks = await prisma.task.findMany({ where: { projectId } });
    return c.json(tasks, 200);
  },
);

// DELETE /api/task/:id - Delete a task by id.
taskRoutes.delete(
  ":id",
  describeRoute({
    tags: ["Task"],
    summary: "Delete a task by id",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    responses: {
      200: { description: "Task deleted" },
      404: { description: "Task not found" },
    },
  }),
  async (c) => {
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
  },
);

// PATCH /api/task/:id - Edit a task by id.
taskRoutes.patch(
  ":id",
  describeRoute({
    tags: ["Task"],
    summary: "Edit a task by id",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              projectId: { type: "integer" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Task updated" },
      404: { description: "Task not found or error updating" },
    },
  }),
  async (c) => {
    const id = Number(c.req.param("id"));
    if (!id) {
      return c.json({ error: "id is required" }, 400);
    }
    const body = await c.req.json();
    const { name, projectId } = body;
    if (!name && !projectId) {
      return c.json(
        { error: "At least one of name or projectId is required" },
        400,
      );
    }
    // If projectId is being updated, check if the new project exists
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return c.json({ error: "Project not found" }, 404);
      }
    }
    try {
      const updatedTask = await prisma.task.update({
        where: { id },
        data: { ...(name && { name }), ...(projectId && { projectId }) },
      });
      return c.json(updatedTask, 200);
    } catch (error) {
      return c.json({ error: "Task not found or error updating" }, 404);
    }
  },
);

export { taskRoutes };
