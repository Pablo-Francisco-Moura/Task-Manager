import {
  ACCOUNT_SESSION_COOKIE_NAME,
  GUEST_SESSION_COOKIE_NAME,
} from "@/constants/session";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";
import { hashSessionToken } from "@/server/session/session";
import { workspacePublicId } from "@/utils/workspaceUrl";
import { resolveWorkspaceRoute } from "./workspaceRoute";
import { afterEach, describe, expect, test } from "vitest";

const createdUserIds: string[] = [];
const createdWorkspaceIds: string[] = [];

async function createWorkspaceSession(kind: "account" | "guest") {
  const user = await prisma.user.create({
    data: {
      displayName: "Workspace URL test",
      kind,
    },
  });
  createdUserIds.push(user.id);

  const workspace = await prisma.workspace.create({
    data: {
      name: "Shared planning",
      kind: "personal",
      members: { create: { userId: user.id, role: "owner" } },
    },
  });
  createdWorkspaceIds.push(workspace.id);
  const token = `workspace-route-${randomUUID()}`;
  const cookieName =
    kind === "account"
      ? ACCOUNT_SESSION_COOKIE_NAME
      : GUEST_SESSION_COOKIE_NAME;

  await prisma.session.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + 60_000),
    },
  });

  return {
    workspace,
    cookies: {
      get: (name: string) => (name === cookieName ? token : undefined),
    },
  };
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.workspace.deleteMany({
    where: { id: { in: createdWorkspaceIds } },
  });
  createdUserIds.length = 0;
  createdWorkspaceIds.length = 0;
});

describe("workspace URL access", () => {
  test("requires a session before resolving a workspace", async () => {
    await expect(
      resolveWorkspaceRoute(randomUUID(), { get: () => undefined }),
    ).resolves.toEqual({ kind: "unauthenticated" });
  });

  test("authorizes an account member for a workspace in the URL", async () => {
    const { workspace, cookies } = await createWorkspaceSession("account");

    await expect(
      resolveWorkspaceRoute(workspace.id, cookies),
    ).resolves.toMatchObject({
      kind: "authorized",
      activeWorkspaceId: workspace.id,
      isAccountSession: true,
      role: "owner",
      workspace: { id: workspace.id, name: workspace.name },
    });
  });

  test("does not reveal a workspace the account cannot access", async () => {
    const { cookies } = await createWorkspaceSession("account");
    const privateWorkspace = await prisma.workspace.create({
      data: { name: "Private workspace", kind: "personal" },
    });
    createdWorkspaceIds.push(privateWorkspace.id);

    await expect(
      resolveWorkspaceRoute(privateWorkspace.id, cookies),
    ).resolves.toEqual({ kind: "notFound" });

    await prisma.workspace.delete({ where: { id: privateWorkspace.id } });
  });

  test("limits a guest URL to the guest's own workspace", async () => {
    const { workspace, cookies } = await createWorkspaceSession("guest");

    await expect(
      resolveWorkspaceRoute(workspace.id, cookies),
    ).resolves.toMatchObject({
      kind: "authorized",
      isAccountSession: false,
      workspace: { id: workspace.id },
    });
    await expect(resolveWorkspaceRoute(randomUUID(), cookies)).resolves.toEqual(
      { kind: "notFound" },
    );
  });

  test("accepts a compact workspace public identifier in the URL", async () => {
    const { workspace, cookies } = await createWorkspaceSession("account");
    const publicId = workspacePublicId(workspace.id);

    await expect(
      resolveWorkspaceRoute(publicId, cookies),
    ).resolves.toMatchObject({
      kind: "authorized",
      activeWorkspaceId: workspace.id,
      isAccountSession: true,
      role: "owner",
      workspace: { id: workspace.id, name: workspace.name },
    });
  });
});
