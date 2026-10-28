import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { getCookie } from "hono/cookie";
import { createProjectActivity } from "@/server/task/taskActivity";
import { ACCOUNT_SESSION_COOKIE_NAME } from "@/constants/session";
import { getAccountSessionByToken, parseProjectIds } from "./session.helpers";
import type { TypeSessionEnv } from "@/types/session";

const routes = new Hono<TypeSessionEnv>();

routes.get("/workspace/:workspaceId/members", async (context) => {
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
      workspaceId_userId: { workspaceId, userId: accountSession.userId },
    },
  });
  if (!membership) {
    return context.json({ error: "Workspace is not available" }, 404);
  }

  const [memberships, projects] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, displayName: true, username: true },
        },
      },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    }),
    prisma.project.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        projectMembers: { select: { userId: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const accessibleProjects =
    membership.role === "owner"
      ? projects
      : projects.filter(({ projectMembers }) =>
          projectMembers.some(({ userId }) => userId === accountSession.userId),
        );
  const accessibleProjectIds = new Set(accessibleProjects.map(({ id }) => id));
  const visibleMemberships =
    membership.role === "owner"
      ? memberships
      : accessibleProjects.length === 0
        ? []
        : memberships.filter(
            ({ role, user }) =>
              role === "owner" ||
              projects.some(
                ({ id, projectMembers }) =>
                  accessibleProjectIds.has(id) &&
                  projectMembers.some(({ userId }) => userId === user.id),
              ),
          );

  return context.json({
    projects: accessibleProjects.map(({ id, name }) => ({ id, name })),
    members: visibleMemberships.map(({ user, role, joinedAt }) => ({
      userId: user.id,
      isCurrentUser: user.id === accountSession.userId,
      displayName: user.displayName,
      username: user.username,
      role,
      joinedAt,
      projects: accessibleProjects
        .filter(
          ({ projectMembers }) =>
            role === "owner" ||
            projectMembers.some(({ userId }) => userId === user.id),
        )
        .map(({ id, name }) => ({ id, name })),
    })),
  });
});

routes.put(
  "/workspace/:workspaceId/members/:userId/projects",
  async (context) => {
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

    const body = await context.req.json().catch(() => ({}));
    if (!Array.isArray(body.projectIds)) {
      return context.json({ error: "projectIds must be an array" }, 400);
    }
    const projectIds = parseProjectIds(body.projectIds);
    if (projectIds.length !== new Set(body.projectIds).size) {
      return context.json({ error: "Invalid project ids" }, 400);
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

    const targetMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!targetMembership) {
      return context.json({ error: "Workspace member not found" }, 404);
    }
    if (targetMembership.role !== "member") {
      return context.json({ error: "Cannot change owner project access" }, 409);
    }

    const validProjects = projectIds.length
      ? await prisma.project.findMany({
          where: { id: { in: projectIds }, workspaceId },
          select: { id: true, name: true },
        })
      : [];
    if (validProjects.length !== projectIds.length) {
      return context.json(
        { error: "One or more project ids are invalid" },
        400,
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { displayName: true },
    });
    await prisma.$transaction(async (transaction) => {
      const existingAssignments = await transaction.projectMember.findMany({
        where: { userId: targetUserId, project: { workspaceId } },
        select: { projectId: true, project: { select: { name: true } } },
      });
      const existingProjectIds = new Set(
        existingAssignments.map(({ projectId }) => projectId),
      );
      const requestedProjectIds = new Set(projectIds);
      await transaction.projectMember.deleteMany({
        where: { userId: targetUserId, project: { workspaceId } },
      });
      if (projectIds.length) {
        await transaction.projectMember.createMany({
          data: projectIds.map((projectId) => ({
            projectId,
            userId: targetUserId,
            role: "member" as const,
          })),
        });
      }
      for (const project of validProjects) {
        if (existingProjectIds.has(project.id)) continue;
        await createProjectActivity(transaction, {
          projectId: project.id,
          actorId: accountSession.userId,
          type: "member_added",
          details: {
            memberName: targetUser?.displayName ?? targetUserId,
            memberId: targetUserId,
          },
        });
      }
      for (const assignment of existingAssignments) {
        if (requestedProjectIds.has(assignment.projectId)) continue;
        await createProjectActivity(transaction, {
          projectId: assignment.projectId,
          actorId: accountSession.userId,
          type: "member_removed",
          details: {
            memberName: targetUser?.displayName ?? targetUserId,
            memberId: targetUserId,
          },
        });
      }
    });

    return context.json({ userId: targetUserId, projectIds });
  },
);

export { routes as sessionRoutes };
