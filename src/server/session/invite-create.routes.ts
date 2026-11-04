import {
  parseUsername,
  parseProjectIds,
  expirePendingInvites,
  WORKSPACE_INVITE_TTL_MS,
  getAccountSessionByToken,
} from "./session.helpers";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { getCookie } from "hono/cookie";
import { ACCOUNT_SESSION_COOKIE_NAME } from "@/constants/session";
import type { TypeSessionEnv } from "@/types/session";

const routes = new Hono<TypeSessionEnv>();

routes.get("/workspace/:workspaceId/invite-target", async (context) => {
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!providedToken) {
    return context.json({ error: "Account session required" }, 401);
  }

  const workspaceId = context.req.param("workspaceId");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      workspaceId,
    )
  ) {
    return context.json({ error: "Invalid workspace id" }, 400);
  }

  const accountSession = await getAccountSessionByToken(providedToken);
  if (!accountSession || accountSession.user.kind !== "account") {
    return context.json({ error: "Account session expired" }, 401);
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: accountSession.userId,
      },
    },
    select: { role: true },
  });
  if (!membership) {
    return context.json({ error: "Workspace is not available" }, 404);
  }
  if (membership.role !== "owner") {
    return context.json({ error: "Workspace owner required" }, 403);
  }

  const username = parseUsername(context.req.query("username"));
  if (!username) {
    return context.json({ error: "A valid username is required" }, 400);
  }

  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, kind: true },
  });
  if (!targetUser || targetUser.kind !== "account") {
    return context.json({ error: "User not found" }, 404);
  }
  if (targetUser.id === accountSession.userId) {
    return context.json({ error: "You cannot invite yourself" }, 409);
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: targetUser.id,
      },
    },
  });
  if (existingMembership) {
    return context.json({ error: "User is already a workspace member" }, 409);
  }

  await expirePendingInvites({ workspaceId, targetUserId: targetUser.id });
  const activeInvites = await prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      targetUserId: targetUser.id,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    select: { projectIds: true },
  });

  return context.json({
    id: targetUser.id,
    displayName: targetUser.displayName,
    username: targetUser.username,
    hasActiveInvite: activeInvites.length > 0,
    activeInviteProjectIds: [
      ...new Set(activeInvites.flatMap(({ projectIds }) => projectIds)),
    ],
  });
});

routes.post("/workspace/:workspaceId/invite", async (context) => {
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!providedToken) {
    return context.json({ error: "Account session required" }, 401);
  }

  const workspaceId = context.req.param("workspaceId");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      workspaceId,
    )
  ) {
    return context.json({ error: "Invalid workspace id" }, 400);
  }

  const body = await context.req.json().catch(() => ({}));
  const username = parseUsername(body.username);
  const projectIds = parseProjectIds(body.projectIds);

  if (!username) {
    return context.json({ error: "A valid username is required" }, 400);
  }

  const accountSession = await getAccountSessionByToken(providedToken);
  if (!accountSession || accountSession.user.kind !== "account") {
    return context.json({ error: "Account session expired" }, 401);
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: accountSession.userId,
      },
    },
  });
  if (!membership) {
    return context.json({ error: "Workspace is not available" }, 404);
  }
  if (membership.role !== "owner") {
    return context.json({ error: "Workspace owner required" }, 403);
  }

  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true },
  });
  if (!targetUser) {
    return context.json({ error: "User not found" }, 404);
  }
  if (targetUser.id === accountSession.userId) {
    return context.json({ error: "You cannot invite yourself" }, 409);
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: targetUser.id,
      },
    },
  });
  if (existingMembership) {
    return context.json({ error: "User is already a workspace member" }, 409);
  }

  const validProjects = projectIds.length
    ? await prisma.project.findMany({
        where: { id: { in: projectIds }, workspaceId },
        select: { id: true },
      })
    : [];
  const validProjectIds = validProjects.map(({ id }) => id);
  if (validProjectIds.length !== projectIds.length) {
    return context.json({ error: "One or more project ids are invalid" }, 400);
  }

  const result = await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`
      WITH invite_lock AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(
          hashtextextended(${`${workspaceId}:${targetUser.id}`}, 0)
        )
      )
      SELECT 1 AS locked FROM invite_lock
    `;
    const now = new Date();
    await transaction.workspaceInvite.updateMany({
      where: {
        workspaceId,
        targetUserId: targetUser.id,
        status: "pending",
        expiresAt: { lte: now },
      },
      data: { status: "expired" },
    });

    const pendingInvite = await transaction.workspaceInvite.findFirst({
      where: {
        workspaceId,
        targetUserId: targetUser.id,
        status: "pending",
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "asc" },
    });

    if (pendingInvite) {
      const newProjectIds = validProjectIds.filter(
        (id) => !pendingInvite.projectIds.includes(id),
      );
      if (newProjectIds.length === 0) {
        return { kind: "duplicate" as const };
      }

      const invite = await transaction.workspaceInvite.update({
        where: { id: pendingInvite.id },
        data: {
          projectIds: [...pendingInvite.projectIds, ...newProjectIds],
          readAt: null,
        },
      });
      return { kind: "updated" as const, invite };
    }

    const invite = await transaction.workspaceInvite.create({
      data: {
        workspaceId,
        createdById: accountSession.userId,
        targetUserId: targetUser.id,
        status: "pending",
        projectIds: validProjectIds,
        expiresAt: new Date(now.getTime() + WORKSPACE_INVITE_TTL_MS),
      },
    });
    return { kind: "created" as const, invite };
  });

  if (result.kind === "duplicate") {
    return context.json(
      {
        error: "An active invitation already includes these projects",
        code: "ACTIVE_INVITE_EXISTS",
      },
      409,
    );
  }

  return context.json(
    {
      id: result.invite.id,
      workspaceId: result.invite.workspaceId,
      createdById: result.invite.createdById,
      targetUserId: result.invite.targetUserId,
      status: result.invite.status,
      projectIds: result.invite.projectIds,
      expiresAt: result.invite.expiresAt,
      createdAt: result.invite.createdAt,
      updatedExisting: result.kind === "updated",
    },
    result.kind === "created" ? 201 : 200,
  );
});

export { routes as sessionRoutes };
