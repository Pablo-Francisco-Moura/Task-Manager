import {
  expirePendingInvites,
  expireInviteIfNeeded,
  getAccountSessionByToken,
} from "./session.helpers";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { getCookie } from "hono/cookie";
import { ACCOUNT_SESSION_COOKIE_NAME } from "@/constants/session";
import type { TypeSessionEnv } from "@/types/session";

const routes = new Hono<TypeSessionEnv>();

routes.get("/workspace/invites", async (context) => {
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!providedToken) {
    return context.json({ error: "Account session required" }, 401);
  }

  const accountSession = await getAccountSessionByToken(providedToken);
  if (!accountSession || accountSession.user.kind !== "account") {
    return context.json({ error: "Account session expired" }, 401);
  }

  await expirePendingInvites({ targetUserId: accountSession.userId });
  const invites = await prisma.workspaceInvite.findMany({
    where: { targetUserId: accountSession.userId },
    include: {
      workspace: {
        select: { id: true, name: true, kind: true, createdAt: true },
      },
      createdBy: { select: { id: true, displayName: true, username: true } },
      targetUser: { select: { id: true, displayName: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const projectScopes = invites.flatMap((invite) =>
    invite.projectIds.length
      ? [{ workspaceId: invite.workspaceId, id: { in: invite.projectIds } }]
      : [],
  );
  const projects = projectScopes.length
    ? await prisma.project.findMany({
        where: { OR: projectScopes },
        select: { id: true, name: true, workspaceId: true },
      })
    : [];

  return context.json({
    invites: invites.map(({ workspace, createdBy, targetUser, ...invite }) => ({
      ...invite,
      workspaceId: invite.workspaceId,
      createdById: invite.createdById,
      targetUserId: invite.targetUserId,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        kind: workspace.kind,
        createdAt: workspace.createdAt,
      },
      projects: projects
        .filter(
          (project) =>
            project.workspaceId === invite.workspaceId &&
            invite.projectIds.includes(project.id),
        )
        .map(({ id, name }) => ({ id, name })),
      createdBy: {
        id: createdBy.id,
        displayName: createdBy.displayName,
        username: createdBy.username,
      },
      targetUser: {
        id: targetUser.id,
        displayName: targetUser.displayName,
        username: targetUser.username,
      },
    })),
  });
});

routes.patch("/workspace/invites/:inviteId/read", async (context) => {
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!providedToken) {
    return context.json({ error: "Account session required" }, 401);
  }

  const inviteId = Number(context.req.param("inviteId"));
  if (!Number.isInteger(inviteId) || inviteId <= 0) {
    return context.json({ error: "Invalid invite id" }, 400);
  }

  const accountSession = await getAccountSessionByToken(providedToken);
  if (!accountSession || accountSession.user.kind !== "account") {
    return context.json({ error: "Account session expired" }, 401);
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId },
  });
  if (!invite) {
    return context.json({ error: "Invite not found" }, 404);
  }
  if (invite.targetUserId !== accountSession.userId) {
    return context.json({ error: "Invite is not for this user" }, 403);
  }
  if (
    invite.status !== "pending" ||
    (await expireInviteIfNeeded(invite.id, invite.expiresAt))
  ) {
    return context.json({ error: "Invite is not pending" }, 409);
  }

  const readAt = invite.readAt ?? new Date();
  await prisma.workspaceInvite.updateMany({
    where: {
      id: inviteId,
      targetUserId: accountSession.userId,
      status: "pending",
    },
    data: { readAt },
  });

  return context.json({ read: true, inviteId, status: invite.status, readAt });
});

routes.get("/workspace/:workspaceId/invites", async (context) => {
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
  });
  if (!membership) {
    return context.json({ error: "Workspace is not available" }, 404);
  }
  if (membership.role !== "owner") {
    return context.json({ error: "Workspace owner required" }, 403);
  }

  await expirePendingInvites({ workspaceId });
  const invites = await prisma.workspaceInvite.findMany({
    where: { workspaceId },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      targetUser: { select: { id: true, displayName: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const projectScopes = invites.flatMap((invite) =>
    invite.projectIds.length
      ? [{ workspaceId, id: { in: invite.projectIds } }]
      : [],
  );
  const projects = projectScopes.length
    ? await prisma.project.findMany({
        where: { OR: projectScopes },
        select: { id: true, name: true },
      })
    : [];

  return context.json({
    invites: invites.map(({ createdBy, targetUser, ...invite }) => ({
      ...invite,
      projects: projects
        .filter((project) => invite.projectIds.includes(project.id))
        .map(({ id, name }) => ({ id, name })),
      createdBy: {
        id: createdBy.id,
        displayName: createdBy.displayName,
        username: createdBy.username,
      },
      targetUser: {
        id: targetUser.id,
        displayName: targetUser.displayName,
        username: targetUser.username,
      },
    })),
  });
});

export { routes as sessionRoutes };
