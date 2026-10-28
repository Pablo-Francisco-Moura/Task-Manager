import {
  hashPassword,
  parsePassword,
  verifyPassword,
  setAccountCookie,
} from "./session.helpers";
import {
  GUEST_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_TTL_SECONDS,
} from "@/constants/session";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "node:crypto";
import { hashSessionToken } from "./session";
import { getCookie, deleteCookie } from "hono/cookie";
import type { TypeSessionEnv } from "@/types/session";

const routes = new Hono<TypeSessionEnv>();

routes.post("/sign-in", async (context) => {
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

routes.post("/sign-out", async (context) => {
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

export { routes as sessionRoutes };
