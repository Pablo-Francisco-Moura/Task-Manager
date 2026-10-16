import {
  getWorkspaceRole,
  projectAccessWhere,
} from "@/server/session/projectAccess";
import {
  parseName,
  readJsonObject,
  projectCreateSchema,
  projectUpdateSchema,
  normalizeDescription,
  parsePositiveIntegerString,
  projectCreateOpenApiSchema,
  projectUpdateOpenApiSchema,
} from "@/server/validation";
import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";
import { createProjectActivity } from "@/server/task/taskActivity";
import type { TypeSessionEnv } from "@/server/session";

const projectRoutes = new Hono<TypeSessionEnv>();

// POST /api/project - Create new project.
projectRoutes.post(
  "/",
  describeRoute({
    tags: ["Project"],
    summary: "Create new project",
    requestBody: {
      content: {
        "application/json": { schema: projectCreateOpenApiSchema },
      },
    },
    responses: {
      201: { description: "Project created" },
    },
  }),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (role !== "owner") {
      return c.json(
        { error: "Workspace owner required to create projects" },
        403,
      );
    }

    const body = await readJsonObject(c.req);
    if (!body) {
      return c.json({ error: "Invalid project payload" }, 400);
    }
    const parsedBody = projectCreateSchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: "Invalid project payload" }, 400);
    }
    const name = parseName(parsedBody.data.name);
    if (name === null) {
      return c.json({ error: "name must be a non-empty string" }, 400);
    }
    const project = await prisma.$transaction(async (transaction) => {
      const createdProject = await transaction.project.create({
        data: {
          name,
          description: normalizeDescription(parsedBody.data.description),
          workspaceId,
          createdById: userId,
        },
      });
      await createProjectActivity(transaction, {
        projectId: createdProject.id,
        actorId: userId,
        type: "project_created",
        details: { projectName: createdProject.name },
      });
      return createdProject;
    });

    return c.json(project, 201);
  },
);

// GET /api/project - Get all projects with their tasks.
projectRoutes.get(
  "/",
  describeRoute({
    tags: ["Project"],
    summary: "Get all projects with their tasks",
    responses: {
      200: { description: "List of projects" },
    },
  }),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }

    const projects = await prisma.project.findMany({
      where: projectAccessWhere(workspaceId, userId, role),
      include: { tasks: true },
    });

    return c.json(projects);
  },
);

// DELETE /api/project/:id - Delete project and its linked tasks.
projectRoutes.delete(
  "/:id",
  describeRoute({
    tags: ["Project"],
    summary: "Delete project and its linked tasks",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    responses: {
      200: { description: "Project deleted" },
      404: { description: "Project not found or error deleting" },
    },
  }),
  async (c) => {
    const id = parsePositiveIntegerString(c.req.param("id"));
    if (id === null) {
      return c.json({ error: "id must be a positive integer" }, 400);
    }

    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }
    if (role !== "owner") {
      return c.json({ error: "Workspace owner required to delete projects" }, 403);
    }

    try {
      const deleted = await prisma.project.deleteMany({
        where: {
          id,
          ...projectAccessWhere(workspaceId, userId, role),
        },
      });
      if (deleted.count === 0) {
        return c.json({ error: "Project not found" }, 404);
      }

      return c.json({ message: "Project deleted successfully" });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return c.json({ error: "Project not found" }, 404);
      }
      throw error;
    }
  },
);

// PATCH /api/project/:id - Edit a project by id.
projectRoutes.patch(
  ":id",
  describeRoute({
    tags: ["Project"],
    summary: "Edit a project by id",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    requestBody: {
      content: {
        "application/json": { schema: projectUpdateOpenApiSchema },
      },
    },
    responses: {
      200: { description: "Project updated" },
      404: { description: "Project not found or error updating" },
    },
  }),
  async (c) => {
    const id = parsePositiveIntegerString(c.req.param("id"));
    if (id === null) {
      return c.json({ error: "id must be a positive integer" }, 400);
    }
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }
    if (role !== "owner") {
      return c.json({ error: "Workspace owner required to update projects" }, 403);
    }
    const body = await readJsonObject(c.req);
    if (!body) {
      return c.json({ error: "Invalid project payload" }, 400);
    }
    const parsedBody = projectUpdateSchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: "Invalid project payload" }, 400);
    }
    const { name, description } = parsedBody.data;
    if (name === undefined && description === undefined) {
      return c.json(
        { error: "At least one valid project field is required" },
        400,
      );
    }
    const updateData: Prisma.ProjectUpdateInput = {};
    if (name !== undefined) {
      const parsedName = parseName(name);
      if (parsedName === null) {
        return c.json({ error: "name must be a non-empty string" }, 400);
      }
      updateData.name = parsedName;
    }
    if (description !== undefined) {
      updateData.description = normalizeDescription(description);
    }
    try {
      const updatedProject = await prisma.$transaction(async (transaction) => {
        const currentProject = await transaction.project.findFirst({
          where: {
            id,
            ...projectAccessWhere(workspaceId, userId, role),
          },
        });
        if (!currentProject) return null;

        const updated = await transaction.project.update({
          where: { id },
          data: updateData,
        });
        const changes: Record<string, { from: string | null; to: string | null }> = {};
        if (name !== undefined && updated.name !== currentProject.name) {
          changes.name = { from: currentProject.name, to: updated.name };
        }
        if (
          description !== undefined &&
          updated.description !== currentProject.description
        ) {
          changes.description = {
            from: currentProject.description,
            to: updated.description,
          };
        }
        if (Object.keys(changes).length) {
          await createProjectActivity(transaction, {
            projectId: id,
            actorId: userId,
            type: "project_updated",
            details: { projectName: updated.name, changes },
          });
        }
        return updated;
      });
      if (!updatedProject) {
        return c.json({ error: "Project not found" }, 404);
      }
      return c.json(updatedProject, 200);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return c.json({ error: "Project not found" }, 404);
      }
      throw error;
    }
  },
);

projectRoutes.get("/:projectId/activity", async (c) => {
  const projectId = parsePositiveIntegerString(c.req.param("projectId"));
  if (!projectId) {
    return c.json({ error: "projectId must be a positive integer" }, 400);
  }
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const role = await getWorkspaceRole(prisma, workspaceId, userId);
  if (!role) {
    return c.json({ error: "Workspace membership required" }, 403);
  }
  const accessWhere = projectAccessWhere(workspaceId, userId, role);
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...accessWhere },
    select: { id: true },
  });
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const activities = await prisma.projectActivity.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return c.json(
    activities.reverse().map((activity) => ({
      ...activity,
      canEdit:
        activity.type === "comment" &&
        !activity.isDeleted &&
        activity.actorId === userId,
      canDelete:
        activity.type === "comment" &&
        !activity.isDeleted &&
        (activity.actorId === userId || role === "owner"),
    })),
  );
});

projectRoutes.post("/:projectId/comments", async (c) => {
  const projectId = parsePositiveIntegerString(c.req.param("projectId"));
  if (!projectId) {
    return c.json({ error: "projectId must be a positive integer" }, 400);
  }
  const body = await readJsonObject(c.req);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 2000) {
    return c.json({ error: "Comment must contain 1 to 2000 characters" }, 400);
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
    select: { id: true },
  });
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const activity = await createProjectActivity(prisma, {
    projectId,
    actorId: userId,
    type: "comment",
    content,
  });
  return c.json({ ...activity, canEdit: true, canDelete: true }, 201);
});

projectRoutes.patch("/:projectId/activity/:activityId", async (c) => {
  const projectId = parsePositiveIntegerString(c.req.param("projectId"));
  const activityId = parsePositiveIntegerString(c.req.param("activityId"));
  if (!projectId || !activityId) {
    return c.json(
      { error: "Valid project and activity ids are required" },
      400,
    );
  }
  const body = await readJsonObject(c.req);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 2000) {
    return c.json({ error: "Comment must contain 1 to 2000 characters" }, 400);
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
    select: { id: true },
  });
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  const comment = await prisma.projectActivity.findFirst({
    where: { id: activityId, projectId, type: "comment", isDeleted: false },
  });
  if (!comment) {
    return c.json({ error: "Comment not found" }, 404);
  }
  if (comment.actorId !== userId) {
    return c.json({ error: "Only the comment author can edit it" }, 403);
  }

  const updated = await prisma.projectActivity.update({
    where: { id: activityId },
    data: { content },
  });
  return c.json({ ...updated, canEdit: true, canDelete: true });
});

projectRoutes.delete("/:projectId/activity/:activityId", async (c) => {
  const projectId = parsePositiveIntegerString(c.req.param("projectId"));
  const activityId = parsePositiveIntegerString(c.req.param("activityId"));
  if (!projectId || !activityId) {
    return c.json(
      { error: "Valid project and activity ids are required" },
      400,
    );
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
    select: { id: true },
  });
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  const comment = await prisma.projectActivity.findFirst({
    where: { id: activityId, projectId, type: "comment", isDeleted: false },
  });
  if (!comment) {
    return c.json({ error: "Comment not found" }, 404);
  }
  if (comment.actorId !== userId && role !== "owner") {
    return c.json(
      { error: "Only the author or workspace owner can delete it" },
      403,
    );
  }

  await prisma.projectActivity.update({
    where: { id: activityId },
    data: { content: null, isDeleted: true },
  });
  return c.json({ deleted: true, activityId });
});

export { projectRoutes };
