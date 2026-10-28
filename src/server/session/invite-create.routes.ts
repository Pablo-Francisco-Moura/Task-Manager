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

  await expirePendingInvites({ workspaceId, targetUserId: targetUser.id });

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

  const pendingInvite = await prisma.workspaceInvite.findFirst({
    where: {
      workspaceId,
      targetUserId: targetUser.id,
      status: "pending",
    },
  });
  if (pendingInvite) {
    return context.json(
      {
        id: pendingInvite.id,
        workspaceId: pendingInvite.workspaceId,
        createdById: pendingInvite.createdById,
        targetUserId: pendingInvite.targetUserId,
        status: pendingInvite.status,
        projectIds: pendingInvite.projectIds,
        createdAt: pendingInvite.createdAt,
      },
      200,
    );
  }

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      createdById: accountSession.userId,
      targetUserId: targetUser.id,
      status: "pending",
      projectIds: validProjectIds,
      expiresAt: new Date(Date.now() + WORKSPACE_INVITE_TTL_MS),
    },
  });

  return context.json(
    {
      id: invite.id,
      workspaceId: invite.workspaceId,
      createdById: invite.createdById,
      targetUserId: invite.targetUserId,
      status: invite.status,
      projectIds: invite.projectIds,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    },
    201,
  );
});

export { routes as sessionRoutes };
