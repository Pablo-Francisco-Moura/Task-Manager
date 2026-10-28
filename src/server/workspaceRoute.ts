import {
  GUEST_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_COOKIE_NAME,
} from "@/constants/session";
import { prisma } from "@/lib/prisma";
import { hashSessionToken } from "@/server/session/session";
import { WORKSPACE_UUID_PATTERN } from "@/constants";
import type { TypeWorkspaceRouteResult } from "@/types";
import { decodeWorkspacePublicId } from "@/utils/workspaceUrl";

export async function resolveWorkspaceRoute(
  workspaceId: string,
  cookies: { get: (name: string) => string | undefined },
): Promise<TypeWorkspaceRouteResult> {
  const accountToken = cookies.get(ACCOUNT_SESSION_COOKIE_NAME);
  const guestToken = cookies.get(GUEST_SESSION_COOKIE_NAME);
  const token = accountToken ?? guestToken;
  if (!token) return { kind: "unauthenticated" };

  const resolvedWorkspaceId =
    decodeWorkspacePublicId(workspaceId) ?? workspaceId;
  if (!WORKSPACE_UUID_PATTERN.test(resolvedWorkspaceId)) {
    return { kind: "notFound" };
  }

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
    select: {
      userId: true,
      workspaceId: true,
      user: { select: { kind: true } },
    },
  });

  if (!session) return { kind: "unauthenticated" };
  const isAccountSession = Boolean(accountToken);
  if (
    (isAccountSession && session.user.kind !== "account") ||
    (!isAccountSession && session.user.kind !== "guest")
  ) {
    return { kind: "unauthenticated" };
  }

  if (!isAccountSession && session.workspaceId !== resolvedWorkspaceId) {
    return { kind: "notFound" };
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: resolvedWorkspaceId,
        userId: session.userId,
      },
    },
    select: {
      role: true,
      workspace: { select: { id: true, name: true } },
    },
  });

  if (!membership) return { kind: "notFound" };

  return {
    kind: "authorized",
    activeWorkspaceId: session.workspaceId,
    isAccountSession,
    role: membership.role,
    workspace: membership.workspace,
  };
}
