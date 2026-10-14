import {
  parseName,
  readJsonObject,
  taskCreateSchema,
  taskUpdateSchema,
  normalizeDescription,
  taskCreateOpenApiSchema,
  taskUpdateOpenApiSchema,
  parsePositiveIntegerString,
} from "@/server/validation";
import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";

const taskRoutes = new Hono();

taskRoutes.post(
  "/",
  describeRoute({
    tags: ["Task"],
    summary: "Create a new task linked to a project",
    requestBody: {
      content: {
        "application/json": { schema: taskCreateOpenApiSchema },
      },
    },
    responses: {
      201: { description: "Task created" },
      404: { description: "Project not found" },
    },
  }),
  async (c) => {
    const body = await readJsonObject(c.req);
    if (!body) {
      return c.json({ error: "Invalid task payload" }, 400);
    }
    const parsedBody = taskCreateSchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: "Invalid task payload" }, 400);
    }
    const name = parseName(parsedBody.data.name);
    const projectId = parsedBody.data.projectId;
    if (!name) {
      return c.json({ error: "name and projectId must be valid" }, 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    // Create the task.
    try {
      const task = await prisma.task.create({
        data: {
          name,
          projectId,
          description: normalizeDescription(parsedBody.data.description),
        },
      });
      return c.json(task, 201);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        return c.json({ error: "Project not found" }, 404);
      }
      throw error;
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
    const projectId = parsePositiveIntegerString(c.req.query("projectId"));
    if (!projectId) {
      return c.json({ error: "projectId must be a positive integer" }, 400);
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
    const id = parsePositiveIntegerString(c.req.param("id"));
    if (!id) {
      return c.json({ error: "id must be a positive integer" }, 400);
    }

    try {
      await prisma.task.delete({ where: { id } });
      return c.json({ message: "Task deleted successfully" }, 200);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return c.json({ error: "Task not found" }, 404);
      }
      throw error;
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
        "application/json": { schema: taskUpdateOpenApiSchema },
      },
    },
    responses: {
      200: { description: "Task updated" },
      404: { description: "Task not found or error updating" },
    },
  }),
  async (c) => {
    const id = parsePositiveIntegerString(c.req.param("id"));
    if (!id) {
      return c.json({ error: "id must be a positive integer" }, 400);
    }
    const body = await readJsonObject(c.req);
    if (!body) {
      return c.json({ error: "Invalid task payload" }, 400);
    }
    const parsedBody = taskUpdateSchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: "Invalid task payload" }, 400);
    }
    const { name, projectId, description } = parsedBody.data;
    if (
      name === undefined &&
      projectId === undefined &&
      description === undefined
    ) {
      return c.json(
        { error: "At least one valid task field is required" },
        400,
      );
    }
    const updateData: Prisma.TaskUncheckedUpdateInput = {};
    let parsedProjectId: number | undefined;
    if (name !== undefined) {
      const parsedName = parseName(name);
      if (parsedName === null) {
        return c.json({ error: "name must be a non-empty string" }, 400);
      }
      updateData.name = parsedName;
    }
    if (projectId !== undefined) {
      updateData.projectId = projectId;
      parsedProjectId = projectId;
    }
    if (description !== undefined) {
      updateData.description = normalizeDescription(description);
    }
    // If projectId is being updated, check if the new project exists
    if (parsedProjectId !== undefined) {
      const project = await prisma.project.findUnique({
        where: { id: parsedProjectId },
      });
      if (!project) {
        return c.json({ error: "Project not found" }, 404);
      }
    }
    try {
      const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData,
      });
      return c.json(updatedTask, 200);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return c.json({ error: "Task not found" }, 404);
      }
      throw error;
    }
  },
);

export { taskRoutes };
