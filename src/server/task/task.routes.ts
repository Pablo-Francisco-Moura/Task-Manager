import {
  parseName,
  readJsonObject,
  taskCreateSchema,
  taskUpdateSchema,
  taskReorderSchema,
  normalizeDescription,
  taskCreateOpenApiSchema,
  taskUpdateOpenApiSchema,
  taskReorderOpenApiSchema,
  parsePositiveIntegerString,
} from "@/server/validation";
import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";
import { normalizeTaskPriority } from "@/utils/taskPriority";
import type { TypeSessionEnv } from "@/server/session";

const taskRoutes = new Hono<TypeSessionEnv>();

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
      where: { id: projectId, workspaceId: c.get("workspaceId") },
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
      const task = await prisma.task.create({
        data: {
          name,
          dueAt,
          status,
          dueDate,
          priority,
          position: (lastTask?.position ?? -1) + 1,
          projectId,
          createdById: c.get("userId"),
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
      where: { id: projectId, workspaceId: c.get("workspaceId") },
    });
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    const tasks = await prisma.task.findMany({
      where: { projectId, project: { workspaceId: c.get("workspaceId") } },
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

taskRoutes.patch(
  "/reorder",
  describeRoute({
    tags: ["Task"],
    summary: "Persist task order for a project board",
    requestBody: {
      content: {
        "application/json": { schema: taskReorderOpenApiSchema },
      },
    },
    responses: {
      200: { description: "Task order updated" },
      400: { description: "Invalid task order payload" },
      404: { description: "Project not found" },
      409: { description: "Task list changed; reload the board" },
    },
  }),
  async (c) => {
    const body = await readJsonObject(c.req);
    if (!body) {
      return c.json({ error: "Invalid task order payload" }, 400);
    }
    const parsedBody = taskReorderSchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: "Invalid task order payload" }, 400);
    }

    const { projectId, orderedTaskIdsByStatus } = parsedBody.data;
    const submittedIds = [
      ...orderedTaskIdsByStatus.todo,
      ...orderedTaskIdsByStatus.in_progress,
      ...orderedTaskIdsByStatus.done,
    ];
    if (new Set(submittedIds).size !== submittedIds.length) {
      return c.json({ error: "A task can only appear once" }, 400);
    }

    const result = await prisma.$transaction(async (transaction) => {
      const project = await transaction.project.findUnique({
        where: { id: projectId, workspaceId: c.get("workspaceId") },
        select: { id: true },
      });
      if (!project) {
        return { kind: "project-not-found" as const };
      }

      const existingTasks = await transaction.task.findMany({
        where: { projectId, project: { workspaceId: c.get("workspaceId") } },
        select: { id: true },
      });
      const existingIds = new Set(existingTasks.map((task) => task.id));
      if (
        submittedIds.length !== existingTasks.length ||
        submittedIds.some((id) => !existingIds.has(id))
      ) {
        return { kind: "task-list-changed" as const };
      }

      for (const status of ["todo", "in_progress", "done"] as const) {
        await Promise.all(
          orderedTaskIdsByStatus[status].map((id, position) =>
            transaction.task.update({
              where: {
                id,
                project: { workspaceId: c.get("workspaceId") },
              },
              data: { status, position },
            }),
          ),
        );
      }

      const tasks = await transaction.task.findMany({
        where: { projectId, project: { workspaceId: c.get("workspaceId") } },
        orderBy: [{ status: "asc" }, { position: "asc" }, { id: "asc" }],
      });
      return { kind: "success" as const, tasks };
    });

    if (result.kind === "project-not-found") {
      return c.json({ error: "Project not found" }, 404);
    }
    if (result.kind === "task-list-changed") {
      return c.json({ error: "Task list changed; reload the board" }, 409);
    }
    return c.json(result.tasks, 200);
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
      const deleted = await prisma.task.deleteMany({
        where: { id, project: { workspaceId: c.get("workspaceId") } },
      });
      if (deleted.count === 0) {
        return c.json({ error: "Task not found" }, 404);
      }
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
    const { name, projectId, description, status, priority, dueDate, dueAt } =
      parsedBody.data;
    if (
      name === undefined &&
      projectId === undefined &&
      description === undefined &&
      status === undefined &&
      priority === undefined &&
      dueDate === undefined &&
      dueAt === undefined
    ) {
      return c.json(
        { error: "At least one valid task field is required" },
        400,
      );
    }

    const currentTask = await prisma.task.findFirst({
      where: { id, project: { workspaceId: c.get("workspaceId") } },
      select: { projectId: true, status: true },
    });
    if (!currentTask) {
      return c.json({ error: "Task not found" }, 404);
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
      const destinationProject = await prisma.project.findFirst({
        where: { id: projectId, workspaceId: c.get("workspaceId") },
        select: { id: true },
      });
      if (!destinationProject) {
        return c.json({ error: "Project not found" }, 404);
      }
      updateData.projectId = projectId;
      parsedProjectId = projectId;
    }
    if (description !== undefined) {
      updateData.description = normalizeDescription(description);
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    if (dueDate !== undefined || dueAt !== undefined) {
      if (dueAt) {
        updateData.dueAt = new Date(dueAt);
        updateData.dueDate = null;
      } else if (dueDate) {
        updateData.dueAt = null;
        updateData.dueDate = new Date(`${dueDate}T00:00:00.000Z`);
      } else {
        updateData.dueAt = null;
        updateData.dueDate = null;
      }
    }
    if (currentTask) {
      const destinationProjectId = parsedProjectId ?? currentTask.projectId;
      const destinationStatus = status ?? currentTask.status;
      if (
        destinationProjectId !== currentTask.projectId ||
        destinationStatus !== currentTask.status
      ) {
        const lastTask = await prisma.task.findFirst({
          where: { projectId: destinationProjectId, status: destinationStatus },
          orderBy: [{ position: "desc" }, { id: "desc" }],
          select: { position: true },
        });
        updateData.position = (lastTask?.position ?? -1) + 1;
      }
    }
    try {
      const updatedCount = await prisma.task.updateMany({
        where: { id, project: { workspaceId: c.get("workspaceId") } },
        data: updateData,
      });
      if (updatedCount.count === 0) {
        return c.json({ error: "Task not found" }, 404);
      }
      const updatedTask = await prisma.task.findFirstOrThrow({
        where: { id, project: { workspaceId: c.get("workspaceId") } },
      });
      return c.json(
        {
          ...updatedTask,
          priority: normalizeTaskPriority(updatedTask.priority),
        },
        200,
      );
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
