import {
  getWorkspaceRole,
  projectAccessWhere,
} from "@/server/session/projectAccess";
import {
  readJsonObject,
  parsePositiveIntegerString,
} from "@/server/validation";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { createProjectActivity } from "@/server/task/taskActivity";
import type { TypeSessionEnv } from "@/server/session";

const routes = new Hono<TypeSessionEnv>();

routes.get("/:projectId/activity", async (c) => {
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

routes.get("/:projectId/activity/unread-count", async (c) => {
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
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...projectAccessWhere(workspaceId, userId, role) },
    select: { id: true, createdAt: true },
  });
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  let accessSince = project.createdAt;
  if (role !== "owner") {
    const projectMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { lastSeenAt: true },
    });
    if (!projectMembership) {
      return c.json({ error: "Project membership required" }, 403);
    }
    accessSince = projectMembership.lastSeenAt;
  }

  let readState = await prisma.projectActivityReadState.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { lastSeenActivityId: true },
  });
  if (!readState) {
    const baseline = await prisma.projectActivity.aggregate({
      where: { projectId, createdAt: { lte: accessSince } },
      _max: { id: true },
    });
    await prisma.projectActivityReadState.createMany({
      data: [
        {
          projectId,
          userId,
          lastSeenActivityId: baseline._max.id ?? 0,
        },
      ],
      skipDuplicates: true,
    });
    readState = await prisma.projectActivityReadState.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { lastSeenActivityId: true },
    });
  }
  if (!readState) {
    throw new Error("Project activity read state could not be initialized");
  }

  const unreadCount = await prisma.projectActivity.count({
    where: {
      projectId,
      actorId: { not: userId },
      id: { gt: readState.lastSeenActivityId },
    },
  });
  return c.json({ unreadCount });
});

routes.post("/:projectId/activity/read", async (c) => {
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
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...projectAccessWhere(workspaceId, userId, role) },
    select: { id: true },
  });
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const body = await readJsonObject(c.req);
  const activityId =
    typeof body?.activityId === "number" && Number.isInteger(body.activityId)
      ? body.activityId
      : null;
  if (!activityId || activityId <= 0) {
    return c.json({ error: "activityId must be a positive integer" }, 400);
  }
  const activity = await prisma.projectActivity.findFirst({
    where: { id: activityId, projectId },
    select: { id: true },
  });
  if (!activity) {
    return c.json({ error: "Activity not found" }, 404);
  }

  await prisma.$executeRaw`
    INSERT INTO "project_activity_read_states" (
      "projectId",
      "userId",
      "lastSeenActivityId"
    )
    VALUES (${projectId}, ${userId}::uuid, ${activityId})
    ON CONFLICT ("projectId", "userId")
    DO UPDATE SET "lastSeenActivityId" = GREATEST(
      "project_activity_read_states"."lastSeenActivityId",
      EXCLUDED."lastSeenActivityId"
    ),
    "lastSeenAt" = CURRENT_TIMESTAMP
  `;
  return c.json({ read: true });
});

routes.post("/:projectId/comments", async (c) => {
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

routes.patch("/:projectId/activity/:activityId", async (c) => {
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

routes.delete("/:projectId/activity/:activityId", async (c) => {
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

export { routes as projectActivityRoutes };
