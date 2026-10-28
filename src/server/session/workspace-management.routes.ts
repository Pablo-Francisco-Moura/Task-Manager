import {
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_TTL_SECONDS,
} from "@/constants/session";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { getCookie } from "hono/cookie";
import { setAccountCookie, getAccountSessionByToken } from "./session.helpers";
import type { TypeSessionEnv } from "@/types/session";

const routes = new Hono<TypeSessionEnv>();

routes.patch("/workspace/:workspaceId", async (context) => {
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
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 200) {
    return context.json({ error: "A valid workspace name is required" }, 400);
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
    include: { workspace: true },
  });
  if (!membership) {
    return context.json({ error: "Workspace is not available" }, 404);
  }
  if (membership.role !== "owner") {
    return context.json({ error: "Workspace owner required" }, 403);
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name },
  });

  return context.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      kind: workspace.kind,
      role: membership.role,
    },
  });
});

routes.delete("/workspace/:workspaceId", async (context) => {
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
    include: { workspace: { select: { id: true, name: true } } },
  });
  if (!membership) {
    return context.json({ error: "Workspace is not available" }, 404);
  }
  if (membership.role !== "owner") {
    return context.json({ error: "Workspace owner required" }, 403);
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: accountSession.userId },
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });
  if (memberships.length <= 1) {
    return context.json({ error: "Cannot delete the last workspace" }, 409);
  }

  const nextWorkspace =
    accountSession.workspaceId === workspaceId
      ? memberships.find((item) => item.workspaceId !== workspaceId)?.workspace
      : undefined;
  if (accountSession.workspaceId === workspaceId && !nextWorkspace) {
    return context.json({ error: "No workspace available to switch to" }, 409);
  }

  await prisma.$transaction(async (transaction) => {
    if (nextWorkspace) {
      await transaction.session.update({
        where: { id: accountSession.id },
        data: {
          workspaceId: nextWorkspace.id,
          expiresAt: new Date(Date.now() + ACCOUNT_SESSION_TTL_SECONDS * 1000),
          lastSeenAt: new Date(),
        },
      });
    }
    await transaction.workspace.delete({ where: { id: workspaceId } });
  });

  setAccountCookie(context, providedToken);
  return context.json({
    deletedWorkspaceId: workspaceId,
    activeWorkspaceId: nextWorkspace?.id ?? accountSession.workspaceId,
    workspaceName: nextWorkspace?.name ?? accountSession.workspace.name,
  });
});

routes.post("/workspace", async (context) => {
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!providedToken) {
    return context.json({ error: "Account session required" }, 401);
  }

  const body = await context.req.json().catch(() => ({}));
  const workspaceName =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : "Pessoal";
  const accountSession = await getAccountSessionByToken(providedToken);
  if (!accountSession || accountSession.user.kind !== "account") {
    return context.json({ error: "Account session expired" }, 401);
  }

  const workspace = await prisma.$transaction(async (transaction) => {
    const createdWorkspace = await transaction.workspace.create({
      data: {
        name: workspaceName,
        kind: "personal",
        members: {
          create: { userId: accountSession.userId, role: "owner" },
        },
      },
    });

    await transaction.session.update({
      where: { id: accountSession.id },
      data: {
        workspaceId: createdWorkspace.id,
        expiresAt: new Date(Date.now() + ACCOUNT_SESSION_TTL_SECONDS * 1000),
        lastSeenAt: new Date(),
      },
    });

    return {
      id: createdWorkspace.id,
      name: createdWorkspace.name,
      kind: createdWorkspace.kind,
      role: "owner" as const,
    };
  });

  setAccountCookie(context, providedToken);

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: accountSession.userId },
    include: { workspace: { select: { id: true, name: true, kind: true } } },
    orderBy: { workspace: { name: "asc" } },
  });

  return context.json(
    {
      workspace,
      activeWorkspaceId: workspace.id,
      workspaces: memberships.map(({ workspace: currentWorkspace, role }) => ({
        id: currentWorkspace.id,
        name: currentWorkspace.name,
        kind: currentWorkspace.kind,
        role,
      })),
    },
    201,
  );
});

export { routes as sessionRoutes };
