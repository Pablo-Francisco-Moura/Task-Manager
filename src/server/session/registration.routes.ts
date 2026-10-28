import {
  parseEmail,
  hashPassword,
  parseUsername,
  parsePassword,
  setGuestCookie,
  setAccountCookie,
} from "./session.helpers";
import {
  GUEST_SESSION_COOKIE_NAME,
  GUEST_SESSION_TTL_SECONDS,
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_TTL_SECONDS,
} from "@/constants/session";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { getCookie } from "hono/cookie";
import { randomBytes } from "node:crypto";
import type { TypeSessionEnv } from "@/types/session";

const routes = new Hono<TypeSessionEnv>();

routes.post("/account", async (context) => {
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

routes.post("/guest", async (context) => {
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

export { routes as sessionRoutes };
