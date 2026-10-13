import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";
import {
  hasOnlyKeys,
  parseName,
  parsePositiveInteger,
  parsePositiveIntegerString,
  readJsonObject,
} from "@/server/validation";

const taskRoutes = new Hono();

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
    const body = await readJsonObject(c.req);
    if (!body || !hasOnlyKeys(body, ["name", "projectId"])) {
      return c.json({ error: "Invalid task payload" }, 400);
    }
    const name = parseName(body.name);
    const projectId = parsePositiveInteger(body.projectId);
    if (!name || !projectId) {
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
        data: { name, projectId },
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
    const id = parsePositiveIntegerString(c.req.param("id"));
    if (!id) {
      return c.json({ error: "id must be a positive integer" }, 400);
    }
    const body = await readJsonObject(c.req);
    if (!body || !hasOnlyKeys(body, ["name", "projectId"])) {
      return c.json({ error: "Invalid task payload" }, 400);
    }
    const hasName = Object.hasOwn(body, "name");
    const hasProjectId = Object.hasOwn(body, "projectId");
    if (!hasName && !hasProjectId) {
      return c.json(
        { error: "At least one valid task field is required" },
        400,
      );
    }
    const updateData: Prisma.TaskUncheckedUpdateInput = {};
    let parsedProjectId: number | undefined;
    if (hasName) {
      const name = parseName(body.name);
      if (name === null) {
        return c.json({ error: "name must be a non-empty string" }, 400);
      }
      updateData.name = name;
    }
    if (hasProjectId) {
      const projectId = parsePositiveInteger(body.projectId);
      if (projectId === null) {
        return c.json({ error: "projectId must be a positive integer" }, 400);
      }
      updateData.projectId = projectId;
      parsedProjectId = projectId;
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
