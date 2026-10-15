import {
  GUEST_SESSION_COOKIE_NAME,
  GUEST_SESSION_TTL_SECONDS,
} from "@/constants/session";
import { prisma } from "@/lib/prisma";
import { getCookie } from "hono/cookie";
import { createHash } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import type { TypeSessionEnv } from "@/types/session";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const requireWorkspaceSession: MiddlewareHandler<
  TypeSessionEnv
> = async (context, next) => {
  const token = getCookie(context, GUEST_SESSION_COOKIE_NAME);
  if (!token) {
    return context.json({ error: "Guest session required" }, 401);
  }

  const now = new Date();
  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      expiresAt: { gt: now },
      revokedAt: null,
    },
    select: { userId: true, workspaceId: true },
  });
  if (!session) {
    return context.json({ error: "Guest session expired" }, 401);
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

  const expiresAt = new Date(now.getTime() + GUEST_SESSION_TTL_SECONDS * 1000);
  await prisma.session.update({
    where: { tokenHash: hashSessionToken(token) },
    data: { lastSeenAt: now, expiresAt },
  });

  context.set("userId", session.userId);
  context.set("workspaceId", session.workspaceId);
  await next();
};
