import {
  getWorkspaceRole,
  projectAccessWhere,
} from "@/server/session/projectAccess";
import {
  parseName,
  readJsonObject,
  taskUpdateSchema,
  normalizeDescription,
  taskUpdateOpenApiSchema,
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

routes.patch(
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

    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }
    const accessWhere = projectAccessWhere(workspaceId, userId, role);
    const currentTask = await prisma.task.findFirst({
      where: { id, project: accessWhere },
      select: {
        projectId: true,
        status: true,
        name: true,
        description: true,
        dueDate: true,
        dueAt: true,
        priority: true,
        project: { select: { name: true } },
      },
    });
    if (!currentTask) {
      return c.json({ error: "Task not found" }, 404);
    }

    const updateData: Prisma.TaskUncheckedUpdateInput = {};
    let parsedProjectId: number | undefined;
    let destinationProjectName = currentTask.project.name;
    if (name !== undefined) {
      const parsedName = parseName(name);
      if (parsedName === null) {
        return c.json({ error: "name must be a non-empty string" }, 400);
      }
      updateData.name = parsedName;
    }
    if (projectId !== undefined) {
      const destinationProject = await prisma.project.findFirst({
        where: { id: projectId, ...accessWhere },
        select: { id: true, name: true },
      });
      if (!destinationProject) {
        return c.json({ error: "Project not found" }, 404);
      }
      updateData.projectId = projectId;
      parsedProjectId = projectId;
      destinationProjectName = destinationProject.name;
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
      const updatedTask = await prisma.$transaction(async (transaction) => {
        const updatedCount = await transaction.task.updateMany({
          where: { id, project: accessWhere },
          data: updateData,
        });
        if (updatedCount.count === 0) return null;

        const task = await transaction.task.findFirstOrThrow({
          where: { id, project: accessWhere },
        });
        const moved =
          task.projectId !== currentTask.projectId ||
          task.status !== currentTask.status;
        const changes: Record<string, { from: unknown; to: unknown }> = {};
        const compare = (field: string, from: unknown, to: unknown) => {
          if (from !== to) changes[field] = { from, to };
        };
        compare("name", currentTask.name, task.name);
        compare("description", currentTask.description, task.description);
        compare(
          "dueDate",
          currentTask.dueDate?.toISOString() ?? null,
          task.dueDate?.toISOString() ?? null,
        );
        compare(
          "dueAt",
          currentTask.dueAt?.toISOString() ?? null,
          task.dueAt?.toISOString() ?? null,
        );
        compare("priority", currentTask.priority, task.priority);
        compare("status", currentTask.status, task.status);
        if (task.projectId !== currentTask.projectId) {
          changes.project = {
            from: currentTask.project.name,
            to: destinationProjectName,
          };
        }
        const activityDetails = {
          changes,
          fromProjectId: currentTask.projectId,
          toProjectId: task.projectId,
          fromProjectName: currentTask.project.name,
          toProjectName: destinationProjectName,
          fromStatus: currentTask.status,
          toStatus: task.status,
        };
        if (Object.keys(changes).length) {
          await createProjectActivity(transaction, {
            projectId: task.projectId,
            taskId: task.id,
            taskName: task.name,
            actorId: userId,
            type: moved ? "task_moved" : "task_updated",
            details: activityDetails,
          });
          if (task.projectId !== currentTask.projectId) {
            await createProjectActivity(transaction, {
              projectId: currentTask.projectId,
              taskId: task.id,
              taskName: task.name,
              actorId: userId,
              type: "task_moved",
              details: activityDetails,
            });
          }
        }
        return task;
      });
      if (!updatedTask) {
        return c.json({ error: "Task not found" }, 404);
      }
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

export { routes as taskUpdateRoutes };
