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
import { prisma } from "@/lib/prisma";
import { setCookie } from "hono/cookie";
import { hashSessionToken } from "./session";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedHash: string | null,
): boolean {
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

export function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalizedEmail = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ? normalizedEmail
    : null;
}

export function parseUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const username = value.trim().toLowerCase();
  return /^[a-z0-9._-]{3,32}$/.test(username) ? username : null;
}

export function parsePassword(value: unknown): string | null {
  if (typeof value !== "string") return null;

  return value.length >= 6 ? value : null;
}

export const WORKSPACE_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function setGuestCookie(
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

export function setAccountCookie(
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

export async function getAccountSessionByToken(token: string) {
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

export function parseProjectIds(value: unknown): number[] {
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

export async function expirePendingInvites(where: {
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

export async function expireInviteIfNeeded(inviteId: number, expiresAt: Date) {
  if (expiresAt > new Date()) return false;

  await prisma.workspaceInvite.updateMany({
    where: { id: inviteId, status: "pending" },
    data: { status: "expired" },
  });
  return true;
}
