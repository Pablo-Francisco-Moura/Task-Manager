import {
  GUEST_SESSION_COOKIE_NAME,
  GUEST_SESSION_TTL_SECONDS,
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
