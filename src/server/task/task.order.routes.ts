import {
  getWorkspaceRole,
  projectAccessWhere,
} from "@/server/session/projectAccess";
import {
  readJsonObject,
  taskReorderSchema,
  taskReorderOpenApiSchema,
  parsePositiveIntegerString,
} from "@/server/validation";
import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";
import { createProjectActivity } from "./taskActivity";
import type { TypeSessionEnv } from "@/server/session";

const routes = new Hono<TypeSessionEnv>();

routes.patch(
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

    const { projectId, movedTaskId, orderedTaskIdsByStatus } = parsedBody.data;
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const submittedIds = [
      ...orderedTaskIdsByStatus.todo,
      ...orderedTaskIdsByStatus.in_progress,
      ...orderedTaskIdsByStatus.done,
    ];
    if (new Set(submittedIds).size !== submittedIds.length) {
      return c.json({ error: "A task can only appear once" }, 400);
    }

    const result = await prisma.$transaction(async (transaction) => {
      const role = await getWorkspaceRole(transaction, workspaceId, userId);
      if (!role) {
        return { kind: "project-not-found" as const };
      }
      const accessWhere = projectAccessWhere(workspaceId, userId, role);
      const project = await transaction.project.findFirst({
        where: { id: projectId, ...accessWhere },
        select: { id: true },
      });
      if (!project) {
        return { kind: "project-not-found" as const };
      }

      const existingTasks = await transaction.task.findMany({
        where: { projectId, project: accessWhere },
        select: { id: true, name: true, status: true, position: true },
      });
      const existingIds = new Set(existingTasks.map((task) => task.id));
      if (
        submittedIds.length !== existingTasks.length ||
        submittedIds.some((id) => !existingIds.has(id))
      ) {
        return { kind: "task-list-changed" as const };
      }
      const movedTask = existingTasks.find((task) => task.id === movedTaskId);
      if (!movedTask) {
        return { kind: "task-list-changed" as const };
      }

      for (const status of ["todo", "in_progress", "done"] as const) {
        await Promise.all(
          orderedTaskIdsByStatus[status].map((id, position) =>
            transaction.task.update({
              where: {
                id,
                project: accessWhere,
              },
              data: { status, position },
            }),
          ),
        );
      }

      const nextPositions = new Map<
        number,
        { status: string; position: number }
      >();
      for (const status of ["todo", "in_progress", "done"] as const) {
        orderedTaskIdsByStatus[status].forEach((id, position) => {
          nextPositions.set(id, { status, position });
        });
      }
      const nextPosition = nextPositions.get(movedTaskId);
      if (
        nextPosition &&
        (movedTask.status !== nextPosition.status ||
          movedTask.position !== nextPosition.position)
      ) {
        await createProjectActivity(transaction, {
          projectId,
          taskId: movedTask.id,
          taskName: movedTask.name,
          actorId: userId,
          type: "task_moved",
          details: {
            fromStatus: movedTask.status,
            toStatus: nextPosition.status,
            fromPosition: movedTask.position,
            toPosition: nextPosition.position,
          },
        });
      }

      const tasks = await transaction.task.findMany({
        where: { projectId, project: accessWhere },
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
routes.delete(
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

    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }

    try {
      const deletedTask = await prisma.$transaction(async (transaction) => {
        const task = await transaction.task.findFirst({
          where: { id, project: projectAccessWhere(workspaceId, userId, role) },
          select: { id: true, projectId: true, name: true },
        });
        if (!task) return null;

        await createProjectActivity(transaction, {
          projectId: task.projectId,
          taskId: task.id,
          taskName: task.name,
          actorId: userId,
          type: "task_deleted",
        });
        await transaction.task.delete({ where: { id: task.id } });
        return task;
      });
      if (!deletedTask) {
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

export { routes as taskOrderRoutes };
