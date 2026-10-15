import {
  GUEST_SESSION_COOKIE_NAME,
  GUEST_SESSION_TTL_SECONDS,
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_TTL_SECONDS,
} from "@/constants/session";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "node:crypto";
import { hashSessionToken } from "./session";
import { getCookie, setCookie } from "hono/cookie";

const sessionRoutes = new Hono();

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

sessionRoutes.post("/account", async (context) => {
  const now = new Date();
  const providedToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  const body = await context.req.json().catch(() => ({}));
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : "Usuário";
  const workspaceName =
    typeof body.workspaceName === "string" && body.workspaceName.trim()
      ? body.workspaceName.trim()
      : "Pessoal";

  if (providedToken) {
    const tokenHash = hashSessionToken(providedToken);
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
          now.getTime() + ACCOUNT_SESSION_TTL_SECONDS * 1000,
        );
        const workspace = await prisma.workspace.findUnique({
          where: { id: existingSession.workspaceId },
          select: { name: true },
        });
        await prisma.session.update({
          where: { id: existingSession.id },
          data: { lastSeenAt: now, expiresAt },
        });
        setAccountCookie(context, providedToken);
        return context.json({
          user: existingSession.user,
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
      data: { displayName, kind: "account" },
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
      user: { id: user.id, displayName: user.displayName, kind: user.kind },
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
