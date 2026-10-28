import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { getCookie } from "hono/cookie";
import { setAccountCookie, getAccountSessionByToken } from "./session.helpers";
import { ACCOUNT_SESSION_COOKIE_NAME, ACCOUNT_SESSION_TTL_SECONDS } from "@/constants/session";
import type { TypeSessionEnv } from "@/types/session";

const routes = new Hono<TypeSessionEnv>();

routes.get("/workspace", async (context) => {
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!providedToken) {
    return context.json({ error: "Account session required" }, 401);
  }

  const accountSession = await getAccountSessionByToken(providedToken);
  if (!accountSession || accountSession.user.kind !== "account") {
    return context.json({ error: "Account session expired" }, 401);
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: accountSession.userId },
    include: { workspace: { select: { id: true, name: true, kind: true } } },
    orderBy: { workspace: { name: "asc" } },
  });

  return context.json({
    user: {
      displayName: accountSession.user.displayName,
    },
    activeWorkspaceId: accountSession.workspaceId,
    workspaces: memberships.map(({ workspace, role }) => ({
      id: workspace.id,
      name: workspace.name,
      kind: workspace.kind,
      role,
    })),
  });
});

routes.patch("/account", async (context) => {
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!providedToken) {
    return context.json({ error: "Account session required" }, 401);
  }

  const accountSession = await getAccountSessionByToken(providedToken);
  if (!accountSession || accountSession.user.kind !== "account") {
    return context.json({ error: "Account session expired" }, 401);
  }

  const body = await context.req.json().catch(() => ({}));
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : null;

  if (!displayName) {
    return context.json({ error: "Display name is required" }, 400);
  }

  const nextUser = await prisma.user.update({
    where: { id: accountSession.userId },
    data: { displayName },
    select: { displayName: true },
  });

  return context.json({ displayName: nextUser.displayName });
});

routes.patch("/workspace", async (context) => {
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!providedToken) {
    return context.json({ error: "Account session required" }, 401);
  }

  const body = await context.req.json().catch(() => ({}));
  const workspaceId =
    typeof body.workspaceId === "string" ? body.workspaceId : "";
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
    include: {
      workspace: { select: { id: true, name: true, kind: true } },
    },
  });
  if (!membership) {
    return context.json({ error: "Workspace is not available" }, 403);
  }

  await prisma.session.update({
    where: { id: accountSession.id },
    data: {
      workspaceId,
      expiresAt: new Date(Date.now() + ACCOUNT_SESSION_TTL_SECONDS * 1000),
      lastSeenAt: new Date(),
    },
  });

  setAccountCookie(context, providedToken);
  return context.json({
    activeWorkspaceId: workspaceId,
    workspace: {
      ...membership.workspace,
      role: membership.role,
    },
  });
});


export { routes as sessionRoutes };
