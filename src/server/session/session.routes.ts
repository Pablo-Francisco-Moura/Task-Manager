import {
  createHash,
  scryptSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  GUEST_SESSION_COOKIE_NAME,
  GUEST_SESSION_TTL_SECONDS,
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_TTL_SECONDS,
} from "@/constants/session";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { hashSessionToken } from "./session";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash) return false;

  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const actualLegacyHash = createHash("sha256").update(password).digest();
    const expectedLegacyHash = Buffer.from(storedHash, "hex");
    return timingSafeEqual(actualLegacyHash, expectedLegacyHash);
  }

  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) return false;

  const actualHash = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  return (
    actualHash.length === expectedBuffer.length &&
    timingSafeEqual(actualHash, expectedBuffer)
  );
}

function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalizedEmail = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ? normalizedEmail
    : null;
}

function parseUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const username = value.trim().toLowerCase();
  return /^[a-z0-9._-]{3,32}$/.test(username) ? username : null;
}

function parsePassword(value: unknown): string | null {
  if (typeof value !== "string") return null;

  return value.length >= 6 ? value : null;
}

const sessionRoutes = new Hono();
const WORKSPACE_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function setGuestCookie(
  context: Parameters<typeof setCookie>[0],
  token: string,
) {
  setCookie(context, GUEST_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: GUEST_SESSION_TTL_SECONDS,
  });
}

function setAccountCookie(
  context: Parameters<typeof setCookie>[0],
  token: string,
) {
  setCookie(context, ACCOUNT_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: ACCOUNT_SESSION_TTL_SECONDS,
  });
}

async function getAccountSessionByToken(token: string) {
  const now = new Date();
  return prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      expiresAt: { gt: now },
      revokedAt: null,
    },
    include: {
      user: { select: { id: true, displayName: true, kind: true } },
      workspace: { select: { id: true, name: true, kind: true } },
    },
  });
}

function parseProjectIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  const projectIds = value.flatMap((item) => {
    if (typeof item === "number" && Number.isInteger(item) && item > 0) {
      return [item];
    }
    if (typeof item === "string" && /^\d+$/.test(item.trim())) {
      const parsed = Number(item);
      return Number.isInteger(parsed) && parsed > 0 ? [parsed] : [];
    }
    return [];
  });

  return [...new Set(projectIds)];
}

async function expirePendingInvites(where: {
  workspaceId?: string;
  targetUserId?: string;
}) {
  await prisma.workspaceInvite.updateMany({
    where: {
      ...where,
      status: "pending",
      expiresAt: { lte: new Date() },
    },
    data: { status: "expired" },
  });
}

async function expireInviteIfNeeded(inviteId: number, expiresAt: Date) {
  if (expiresAt > new Date()) return false;

  await prisma.workspaceInvite.updateMany({
    where: { id: inviteId, status: "pending" },
    data: { status: "expired" },
  });
  return true;
}

sessionRoutes.get("/workspace", async (context) => {
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

sessionRoutes.patch("/workspace", async (context) => {
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

sessionRoutes.patch("/workspace/:workspaceId", async (context) => {
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

sessionRoutes.delete("/workspace/:workspaceId", async (context) => {
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

sessionRoutes.post("/workspace", async (context) => {
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

sessionRoutes.get("/workspace/invites", async (context) => {
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
      workspace: { select: { id: true, name: true, kind: true } },
      createdBy: { select: { id: true, displayName: true, username: true } },
      targetUser: { select: { id: true, displayName: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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
      },
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

sessionRoutes.patch("/workspace/invites/:inviteId/read", async (context) => {
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
    where: { id: inviteId, targetUserId: accountSession.userId, status: "pending" },
    data: { readAt },
  });

  return context.json({ read: true, inviteId, status: invite.status, readAt });
});

sessionRoutes.get("/workspace/:workspaceId/invites", async (context) => {
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

  return context.json({
    invites: invites.map(({ createdBy, targetUser, ...invite }) => ({
      ...invite,
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

sessionRoutes.post("/workspace/:workspaceId/invite", async (context) => {
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

sessionRoutes.post("/workspace/invites/:inviteId/accept", async (context) => {
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
        select: { id: true },
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

sessionRoutes.post("/workspace/invites/:inviteId/decline", async (context) => {
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

sessionRoutes.delete("/workspace/invites/:inviteId", async (context) => {
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

sessionRoutes.post("/sign-in", async (context) => {
  const body = await context.req.json().catch(() => ({}));
  const identifier =
    typeof body.identifier === "string"
      ? body.identifier.trim().toLowerCase()
      : "";
  const password = parsePassword(body.password);

  if (!identifier || !password) {
    return context.json(
      { error: "Username or email and password are required" },
      400,
    );
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
    select: {
      id: true,
      displayName: true,
      username: true,
      email: true,
      passwordHash: true,
      kind: true,
    },
  });

  if (!user || user.kind !== "account") {
    return context.json({ error: "Invalid credentials" }, 401);
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return context.json({ error: "Invalid credentials" }, 401);
  }

  if (user.passwordHash && !user.passwordHash.includes(":")) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password) },
    });
  }

  const now = new Date();
  const workspaceMembership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const accountToken = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(accountToken);
  const accountWorkspace =
    workspaceMembership?.workspace ??
    (await prisma.$transaction(async (transaction) => {
      const createdWorkspace = await transaction.workspace.create({
        data: {
          name: "Pessoal",
          kind: "personal",
          members: { create: { userId: user.id, role: "owner" } },
        },
      });
      return createdWorkspace;
    }));

  await prisma.session.create({
    data: {
      tokenHash,
      userId: user.id,
      workspaceId: accountWorkspace.id,
      expiresAt: new Date(now.getTime() + ACCOUNT_SESSION_TTL_SECONDS * 1000),
      lastSeenAt: now,
    },
  });

  setAccountCookie(context, accountToken);
  return context.json(
    {
      user: {
        id: user.id,
        displayName: user.displayName,
        kind: user.kind,
        email: user.email,
      },
      workspaceId: accountWorkspace.id,
      workspaceName: accountWorkspace.name,
    },
    200,
  );
});

sessionRoutes.post("/sign-out", async (context) => {
  const accountToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  const guestToken = getCookie(context, GUEST_SESSION_COOKIE_NAME);
  const providedTokens = [...new Set([accountToken, guestToken])].filter(
    (token): token is string => Boolean(token),
  );

  if (providedTokens.length > 0) {
    await prisma.session.updateMany({
      where: {
        tokenHash: { in: providedTokens.map(hashSessionToken) },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  deleteCookie(context, ACCOUNT_SESSION_COOKIE_NAME, { path: "/" });
  deleteCookie(context, GUEST_SESSION_COOKIE_NAME, { path: "/" });
  return context.json({ signedOut: true });
});

sessionRoutes.post("/account", async (context) => {
  const now = new Date();
  const providedToken =
    getCookie(context, ACCOUNT_SESSION_COOKIE_NAME) ??
    getCookie(context, GUEST_SESSION_COOKIE_NAME);
  const body = await context.req.json().catch(() => ({}));
  const username = parseUsername(body.username);
  const email =
    body.email == null || body.email === "" ? null : parseEmail(body.email);
  const password = parsePassword(body.password);
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : (username ?? "Usuário");
  const workspaceName =
    typeof body.workspaceName === "string" && body.workspaceName.trim()
      ? body.workspaceName.trim()
      : "Pessoal";

  if (!username || !password || (body.email && !email)) {
    return context.json(
      { error: "A valid username and password are required" },
      400,
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, ...(email ? [{ email }] : [])],
    },
  });
  if (existingUser) {
    return context.json({ error: "Username or email already in use" }, 409);
  }

  if (providedToken) {
    const tokenHash = hashSessionToken(providedToken);
    const existingSession = await prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: now },
        revokedAt: null,
      },
      include: {
        user: {
          select: { id: true, displayName: true, username: true, kind: true },
        },
      },
    });

    if (existingSession) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: existingSession.workspaceId,
            userId: existingSession.userId,
          },
        },
        select: { workspaceId: true },
      });
      if (membership) {
        if (existingSession.user.kind !== "guest") {
          return context.json(
            { error: "This session already belongs to an account" },
            409,
          );
        }

        const expiresAt = new Date(
          now.getTime() + ACCOUNT_SESSION_TTL_SECONDS * 1000,
        );
        const workspace = await prisma.workspace.findUnique({
          where: { id: existingSession.workspaceId },
          select: { name: true },
        });
        const user = await prisma.$transaction(async (transaction) => {
          const upgradedUser = await transaction.user.update({
            where: { id: existingSession.user.id },
            data: {
              displayName,
              username,
              email,
              passwordHash: hashPassword(password),
              kind: "account",
            },
            select: {
              id: true,
              displayName: true,
              username: true,
              email: true,
              kind: true,
            },
          });
          await transaction.session.update({
            where: { id: existingSession.id },
            data: { lastSeenAt: now, expiresAt },
          });
          return upgradedUser;
        });
        setAccountCookie(context, providedToken);
        return context.json({
          user,
          workspaceId: existingSession.workspaceId,
          workspaceName: workspace?.name ?? "Pessoal",
        });
      }
    }
  }

  const accountToken = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(accountToken);
  const expiresAt = new Date(
    now.getTime() + ACCOUNT_SESSION_TTL_SECONDS * 1000,
  );
  const account = await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        displayName,
        username,
        email,
        passwordHash: hashPassword(password),
        kind: "account",
      },
    });
    const workspace = await transaction.workspace.create({
      data: {
        name: workspaceName,
        kind: "personal",
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });
    await transaction.session.create({
      data: {
        tokenHash,
        userId: user.id,
        workspaceId: workspace.id,
        expiresAt,
        lastSeenAt: now,
      },
    });

    return {
      user: {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        kind: user.kind,
        email: user.email,
      },
      workspaceId: workspace.id,
      workspaceName: workspace.name,
    };
  });

  setAccountCookie(context, accountToken);
  return context.json(account, 201);
});

sessionRoutes.post("/guest", async (context) => {
  const token = getCookie(context, GUEST_SESSION_COOKIE_NAME);
  const now = new Date();

  if (token) {
    const tokenHash = hashSessionToken(token);
    const existingSession = await prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: now },
        revokedAt: null,
      },
      include: {
        user: { select: { id: true, displayName: true, kind: true } },
      },
    });

    if (existingSession) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: existingSession.workspaceId,
            userId: existingSession.userId,
          },
        },
        select: { workspaceId: true },
      });
      if (membership) {
        const expiresAt = new Date(
          now.getTime() + GUEST_SESSION_TTL_SECONDS * 1000,
        );
        await prisma.session.update({
          where: { id: existingSession.id },
          data: { lastSeenAt: now, expiresAt },
        });
        setGuestCookie(context, token);
        return context.json({
          user: existingSession.user,
          workspaceId: existingSession.workspaceId,
        });
      }
    }
  }

  const guestToken = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(guestToken);
  const expiresAt = new Date(now.getTime() + GUEST_SESSION_TTL_SECONDS * 1000);
  const guest = await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: { displayName: "Visitante", kind: "guest" },
    });
    const workspace = await transaction.workspace.create({
      data: {
        name: "Meu espaço",
        kind: "personal",
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });
    await transaction.session.create({
      data: {
        tokenHash,
        userId: user.id,
        workspaceId: workspace.id,
        expiresAt,
        lastSeenAt: now,
      },
    });

    return {
      user: { id: user.id, displayName: user.displayName, kind: user.kind },
      workspaceId: workspace.id,
    };
  });

  setGuestCookie(context, guestToken);
  return context.json(guest, 201);
});

export { sessionRoutes };
