import {
  GUEST_SESSION_COOKIE_NAME,
  GUEST_SESSION_TTL_SECONDS,
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_TTL_SECONDS,
} from "@/constants/session";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";
import { getCookie, setCookie } from "hono/cookie";
import type { TypeSessionEnv } from "@/types/session";
import type { MiddlewareHandler } from "hono";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function resolveSessionCookie(context: Parameters<typeof getCookie>[0]) {
  const accountToken = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (accountToken) {
    return {
      cookieName: ACCOUNT_SESSION_COOKIE_NAME,
      token: accountToken,
      ttlSeconds: ACCOUNT_SESSION_TTL_SECONDS,
      requiredKind: "account" as const,
    };
  }

  const guestToken = getCookie(context, GUEST_SESSION_COOKIE_NAME);
  if (guestToken) {
    return {
      cookieName: GUEST_SESSION_COOKIE_NAME,
      token: guestToken,
      ttlSeconds: GUEST_SESSION_TTL_SECONDS,
      requiredKind: "guest" as const,
    };
  }

  return null;
}

export const requireAccountSession: MiddlewareHandler<TypeSessionEnv> = async (
  context,
  next,
) => {
  const sessionCookie = getCookie(context, ACCOUNT_SESSION_COOKIE_NAME);
  if (!sessionCookie) {
    return context.json({ error: "Account session required" }, 401);
  }

  const now = new Date();
  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(sessionCookie),
      expiresAt: { gt: now },
      revokedAt: null,
    },
    select: {
      userId: true,
      workspaceId: true,
      user: { select: { kind: true } },
    },
  });
  if (!session || session.user.kind !== "account") {
    return context.json({ error: "Account session expired" }, 401);
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: session.workspaceId,
        userId: session.userId,
      },
    },
    select: { workspaceId: true },
  });
  if (!membership) {
    return context.json({ error: "Workspace membership required" }, 403);
  }

  const expiresAt = new Date(
    now.getTime() + ACCOUNT_SESSION_TTL_SECONDS * 1000,
  );
  await prisma.session.update({
    where: { tokenHash: hashSessionToken(sessionCookie) },
    data: { lastSeenAt: now, expiresAt },
  });
  setCookie(context, ACCOUNT_SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: ACCOUNT_SESSION_TTL_SECONDS,
  });

  context.set("userId", session.userId);
  context.set("workspaceId", session.workspaceId);
  await next();
};

export const requireWorkspaceSession: MiddlewareHandler<
  TypeSessionEnv
> = async (context, next) => {
  const sessionCookie = resolveSessionCookie(context);
  if (!sessionCookie) {
    return context.json({ error: "Session required" }, 401);
  }

  const now = new Date();
  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(sessionCookie.token),
      expiresAt: { gt: now },
      revokedAt: null,
    },
    select: {
      userId: true,
      workspaceId: true,
      user: { select: { kind: true } },
    },
  });
  if (!session || session.user.kind !== sessionCookie.requiredKind) {
    return context.json(
      { error: `${sessionCookie.requiredKind} session expired` },
      401,
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: session.workspaceId,
        userId: session.userId,
      },
    },
    select: { workspaceId: true },
  });
  if (!membership) {
    return context.json({ error: "Workspace membership required" }, 403);
  }

  const expiresAt = new Date(now.getTime() + sessionCookie.ttlSeconds * 1000);
  await prisma.session.update({
    where: { tokenHash: hashSessionToken(sessionCookie.token) },
    data: { lastSeenAt: now, expiresAt },
  });
  setCookie(context, sessionCookie.cookieName, sessionCookie.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: sessionCookie.ttlSeconds,
  });

  context.set("userId", session.userId);
  context.set("workspaceId", session.workspaceId);
  await next();
};
