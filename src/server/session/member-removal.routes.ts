import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { getCookie } from "hono/cookie";
import { createProjectActivity } from "@/server/task/taskActivity";
import { getAccountSessionByToken } from "./session.helpers";
import { ACCOUNT_SESSION_COOKIE_NAME } from "@/constants/session";
import type { TypeSessionEnv } from "@/types/session";

const routes = new Hono<TypeSessionEnv>();

routes.delete("/workspace/:workspaceId/members/:userId", async (context) => {
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!providedToken) {
    return context.json({ error: "Account session required" }, 401);
  }

  const workspaceId = context.req.param("workspaceId");
  const targetUserId = context.req.param("userId");
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(workspaceId) || !uuidPattern.test(targetUserId)) {
    return context.json({ error: "Invalid workspace or user id" }, 400);
  }

  const accountSession = await getAccountSessionByToken(providedToken);
  if (!accountSession || accountSession.user.kind !== "account") {
    return context.json({ error: "Account session expired" }, 401);
  }

  const ownerMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: accountSession.userId,
      },
    },
  });
  if (!ownerMembership || ownerMembership.role !== "owner") {
    return context.json({ error: "Workspace owner required" }, 403);
  }
  if (targetUserId === accountSession.userId) {
    return context.json(
      { error: "Workspace owner cannot remove themselves" },
      409,
    );
  }

  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    include: { user: { select: { displayName: true } } },
  });
  if (!targetMembership) {
    return context.json({ error: "Workspace member not found" }, 404);
  }
  if (targetMembership.role !== "member") {
    return context.json({ error: "Workspace owner cannot be removed" }, 409);
  }

  await prisma.$transaction(async (transaction) => {
    const projectAssignments = await transaction.projectMember.findMany({
      where: { userId: targetUserId, project: { workspaceId } },
      select: { projectId: true },
    });
    for (const assignment of projectAssignments) {
      await createProjectActivity(transaction, {
        projectId: assignment.projectId,
        actorId: accountSession.userId,
        type: "member_removed",
        details: {
          memberName: targetMembership.user.displayName,
          memberId: targetUserId,
        },
      });
    }
    await transaction.projectMember.deleteMany({
      where: { userId: targetUserId, project: { workspaceId } },
    });
    await transaction.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId },
      },
    });
    const fallbackMembership = await transaction.workspaceMember.findFirst({
      where: { userId: targetUserId, workspaceId: { not: workspaceId } },
      orderBy: { joinedAt: "asc" },
      select: { workspaceId: true },
    });
    if (fallbackMembership) {
      await transaction.session.updateMany({
        where: { userId: targetUserId, workspaceId },
        data: { workspaceId: fallbackMembership.workspaceId },
      });
    }
  });

  return context.json({ removed: true, workspaceId, userId: targetUserId });
});

export { routes as sessionRoutes };
