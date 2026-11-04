import {
  expireInviteIfNeeded,
  getAccountSessionByToken,
} from "./session.helpers";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { getCookie } from "hono/cookie";
import { createProjectActivity } from "@/server/task/taskActivity";
import { ACCOUNT_SESSION_COOKIE_NAME } from "@/constants/session";
import type { TypeSessionEnv } from "@/types/session";

const routes = new Hono<TypeSessionEnv>();

routes.post("/workspace/invites/:inviteId/accept", async (context) => {
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
    invite.status === "pending" &&
    (await expireInviteIfNeeded(invite.id, invite.expiresAt))
  ) {
    return context.json({ error: "Invite has expired" }, 409);
  }
  if (invite.status !== "pending") {
    return context.json({ error: "Invite is not pending" }, 409);
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invite.workspaceId,
        userId: accountSession.userId,
      },
    },
  });
  if (existingMembership) {
    return context.json({ error: "User is already a workspace member" }, 409);
  }

  const validProjects = invite.projectIds.length
    ? await prisma.project.findMany({
        where: {
          id: { in: invite.projectIds },
          workspaceId: invite.workspaceId,
        },
        select: { id: true, name: true },
      })
    : [];
  const validProjectIds = validProjects.map(({ id }) => id);
  if (validProjectIds.length !== invite.projectIds.length) {
    return context.json(
      { error: "Invite references projects outside the workspace" },
      409,
    );
  }

  const result = await prisma.$transaction(async (transaction) => {
    await transaction.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: accountSession.userId,
        },
      },
      update: { role: "member" },
      create: {
        workspaceId: invite.workspaceId,
        userId: accountSession.userId,
        role: "member",
      },
    });

    for (const projectId of invite.projectIds) {
      await transaction.projectMember.upsert({
        where: {
          projectId_userId: { projectId, userId: accountSession.userId },
        },
        update: {},
        create: { projectId, userId: accountSession.userId, role: "member" },
      });
      const project = validProjects.find(({ id }) => id === projectId);
      if (project) {
        const activity = await createProjectActivity(transaction, {
          projectId,
          actorId: invite.createdById,
          type: "member_added",
          details: {
            memberName: accountSession.user.displayName,
            memberId: accountSession.userId,
          },
        });
        await transaction.projectActivityReadState.upsert({
          where: {
            projectId_userId: {
              projectId,
              userId: accountSession.userId,
            },
          },
          create: {
            projectId,
            userId: accountSession.userId,
            lastSeenActivityId: activity.id,
          },
          update: { lastSeenActivityId: activity.id },
        });
      }
    }

    await transaction.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });

    return {
      accepted: true,
      workspaceId: invite.workspaceId,
      userId: accountSession.userId,
      projectIds: invite.projectIds,
    };
  });

  return context.json(result, 200);
});

routes.post("/workspace/invites/:inviteId/decline", async (context) => {
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
    invite.status === "pending" &&
    (await expireInviteIfNeeded(invite.id, invite.expiresAt))
  ) {
    return context.json({ error: "Invite has expired" }, 409);
  }
  if (invite.status !== "pending") {
    return context.json({ error: "Invite is not pending" }, 409);
  }

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { status: "declined" },
  });

  return context.json({
    declined: true,
    inviteId,
    workspaceId: invite.workspaceId,
  });
});

routes.delete("/workspace/invites/:inviteId", async (context) => {
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

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invite.workspaceId,
        userId: accountSession.userId,
      },
    },
  });
  if (!membership || membership.role !== "owner") {
    return context.json({ error: "Workspace owner required" }, 403);
  }
  if (
    invite.status === "pending" &&
    (await expireInviteIfNeeded(invite.id, invite.expiresAt))
  ) {
    return context.json({ error: "Invite has expired" }, 409);
  }
  if (invite.status !== "pending") {
    return context.json({ error: "Invite is not pending" }, 409);
  }

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { status: "revoked" },
  });

  return context.json({
    revoked: true,
    inviteId,
    workspaceId: invite.workspaceId,
  });
});

export { routes as sessionRoutes };
