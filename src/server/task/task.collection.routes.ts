import {
  getWorkspaceRole,
  projectAccessWhere,
} from "@/server/session/projectAccess";
import {
  parseName,
  readJsonObject,
  taskCreateSchema,
  normalizeDescription,
  taskCreateOpenApiSchema,
  parsePositiveIntegerString,
} from "@/server/validation";
import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";
import { normalizeTaskPriority } from "@/utils/taskPriority";
import { createProjectActivity } from "./taskActivity";
import type { TypeSessionEnv } from "@/server/session";

const routes = new Hono<TypeSessionEnv>();

routes.post(
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

    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...projectAccessWhere(workspaceId, userId, role),
      },
    });
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    const status = parsedBody.data.status ?? "todo";
    const priority = normalizeTaskPriority(parsedBody.data.priority);
    const dueAt = parsedBody.data.dueAt
      ? new Date(parsedBody.data.dueAt)
      : null;
    const dueDate = dueAt
      ? null
      : parsedBody.data.dueDate
        ? new Date(`${parsedBody.data.dueDate}T00:00:00.000Z`)
        : null;
    const lastTask = await prisma.task.findFirst({
      where: { projectId, status },
      orderBy: [{ position: "desc" }, { id: "desc" }],
      select: { position: true },
    });

    // Create the task.
    try {
      const task = await prisma.$transaction(async (transaction) => {
        const createdTask = await transaction.task.create({
          data: {
            name,
            dueAt,
            status,
            dueDate,
            priority,
            position: (lastTask?.position ?? -1) + 1,
            projectId,
            createdById: userId,
            description: normalizeDescription(parsedBody.data.description),
          },
        });
        await createProjectActivity(transaction, {
          projectId,
          taskId: createdTask.id,
          taskName: createdTask.name,
          actorId: userId,
          type: "task_created",
        });
        return createdTask;
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
routes.get(
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
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...projectAccessWhere(workspaceId, userId, role),
      },
    });
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        project: projectAccessWhere(workspaceId, userId, role),
      },
    });
    return c.json(
      tasks.map((task) => ({
        ...task,
        priority: normalizeTaskPriority(task.priority),
      })),
      200,
    );
  },
);

export { routes as taskCollectionRoutes };
