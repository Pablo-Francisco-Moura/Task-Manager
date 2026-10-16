import {
  POST,
  GET as nextApiGet,
  PATCH as nextApiPatch,
  PUT as nextApiPut,
  DELETE as nextApiDelete,
} from "@/app/api/[[...route]]/route";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";
import { cleanDatabase } from "@/utils";
import { expect, test, describe, beforeEach, afterAll } from "vitest";

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
});

function cookieFrom(response: Response): string {
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("Guest session cookie was not set");
  return cookie.split(";")[0];
}

function apiRequest(path: string, cookie?: string, init: RequestInit = {}) {
  return new Request(`http://localhost/api/${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
}

describe("Guest workspace session", () => {
  test("should create an account workspace and issue an account cookie", async () => {
    const response = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "ana@example.com",
          username: "ana",
          password: "supersecret",
          displayName: "Ana",
          workspaceName: "Estudos",
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    const cookie = cookieFrom(response);
    const token = cookie.slice("account_session=".length);
    const session = await prisma.session.findUniqueOrThrow({
      where: {
        tokenHash: (await import("../session")).hashSessionToken(token),
      },
      include: { user: true, workspace: { include: { members: true } } },
    });

    expect(body).toMatchObject({
      user: {
        id: session.userId,
        kind: "account",
        displayName: "Ana",
        username: "ana",
        email: "ana@example.com",
      },
      workspaceId: session.workspaceId,
      workspaceName: "Estudos",
    });
    expect(session.user.kind).toBe("account");
    expect(session.workspace.name).toBe("Estudos");
    expect(session.workspace.members).toEqual([
      expect.objectContaining({ userId: session.userId, role: "owner" }),
    ]);
    expect(response.headers.get("set-cookie")).toContain("account_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
  });

  test("should reject project and task APIs without a guest session", async () => {
    const [projectsResponse, tasksResponse] = await Promise.all([
      nextApiGet(apiRequest("project")),
      nextApiGet(apiRequest("task?projectId=1")),
    ]);

    expect(projectsResponse.status).toBe(401);
    expect(tasksResponse.status).toBe(401);
  });

  test("should create a guest, personal workspace, membership and opaque cookie", async () => {
    const response = await POST(
      apiRequest("session/guest", undefined, { method: "POST" }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    const cookie = cookieFrom(response);
    const token = cookie.slice("guest_session=".length);
    const session = await prisma.session.findUniqueOrThrow({
      where: {
        tokenHash: (await import("../session")).hashSessionToken(token),
      },
      include: { user: true, workspace: { include: { members: true } } },
    });

    expect(body).toMatchObject({
      user: { id: session.userId, kind: "guest", displayName: "Visitante" },
      workspaceId: session.workspaceId,
    });
    expect(session.workspace.kind).toBe("personal");
    expect(session.workspace.members).toEqual([
      expect.objectContaining({ userId: session.userId, role: "owner" }),
    ]);
    expect(session.tokenHash).not.toBe(token);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
  });

  test("should sign in with the saved account credentials", async () => {
    const signup = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          email: "ana@example.com",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );

    expect(signup.status).toBe(201);

    const signin = await POST(
      apiRequest("session/sign-in", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "ana",
          password: "supersecret",
        }),
      }),
    );

    expect(signin.status).toBe(200);
    expect(await signin.json()).toMatchObject({
      user: {
        email: "ana@example.com",
        displayName: "Ana",
        kind: "account",
      },
      workspaceName: "Estudos",
    });
    const signinCookie = cookieFrom(signin);
    const authenticatedWorkspaces = await nextApiGet(
      apiRequest("session/workspace", signinCookie),
    );
    expect(authenticatedWorkspaces.status).toBe(200);

    const emailSignin = await POST(
      apiRequest("session/sign-in", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "ana@example.com",
          password: "supersecret",
        }),
      }),
    );
    expect(emailSignin.status).toBe(200);
  });

  test("should migrate legacy SHA-256 password hashes after successful sign-in", async () => {
    const signup = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Legacy user",
          username: "legacy-user",
          password: "supersecret",
        }),
      }),
    );
    expect(signup.status).toBe(201);
    const userId = (await signup.json()).user.id as string;

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: createHash("sha256").update("supersecret").digest("hex"),
      },
    });

    const signin = await POST(
      apiRequest("session/sign-in", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "legacy-user",
          password: "supersecret",
        }),
      }),
    );

    expect(signin.status).toBe(200);
    const migratedUser = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });
    expect(migratedUser.passwordHash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);
  });

  test("should revoke the current account session when signing out", async () => {
    const signup = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "ana",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );
    const cookie = cookieFrom(signup);

    const signout = await POST(
      apiRequest("session/sign-out", cookie, { method: "POST" }),
    );

    expect(signout.status).toBe(200);
    expect(await signout.json()).toEqual({ signedOut: true });
    expect(signout.headers.get("set-cookie")).toContain("account_session=");
    expect(signout.headers.get("set-cookie")).toContain("guest_session=");

    const workspaceResponse = await nextApiGet(
      apiRequest("session/workspace", cookie),
    );
    expect(workspaceResponse.status).toBe(401);
  });

  test("should list and create additional workspaces for the account session", async () => {
    const accountResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          email: "ana@example.com",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );

    expect(accountResponse.status).toBe(201);
    const cookie = cookieFrom(accountResponse);

    const listResponse = await nextApiGet(
      apiRequest("session/workspace", cookie),
    );
    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toMatchObject({
      user: { displayName: "Ana" },
      activeWorkspaceId: expect.any(String),
      workspaces: [
        expect.objectContaining({
          name: "Estudos",
          role: "owner",
        }),
      ],
    });

    const createResponse = await POST(
      apiRequest("session/workspace", cookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Casa" }),
      }),
    );

    expect(createResponse.status).toBe(201);
    const createdBody = await createResponse.json();
    expect(createdBody).toMatchObject({
      workspace: expect.objectContaining({
        name: "Casa",
        role: "owner",
      }),
      activeWorkspaceId: expect.any(String),
    });

    const refreshedListResponse = await nextApiGet(
      apiRequest("session/workspace", cookie),
    );
    expect(refreshedListResponse.status).toBe(200);
    expect((await refreshedListResponse.json()).workspaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Estudos" }),
        expect.objectContaining({ name: "Casa" }),
      ]),
    );
  });

  test("should let workspace owners rename workspaces but not members", async () => {
    const ownerResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );
    const ownerCookie = cookieFrom(ownerResponse);
    const workspaceId = (await ownerResponse.json()).workspaceId as string;

    const renameResponse = await nextApiPatch(
      apiRequest(`session/workspace/${workspaceId}`, ownerCookie, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Projetos pessoais" }),
      }),
    );
    expect(renameResponse.status).toBe(200);
    expect(await renameResponse.json()).toMatchObject({
      workspace: {
        id: workspaceId,
        name: "Projetos pessoais",
        role: "owner",
      },
    });

    const emptyNameResponse = await nextApiPatch(
      apiRequest(`session/workspace/${workspaceId}`, ownerCookie, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "   " }),
      }),
    );
    expect(emptyNameResponse.status).toBe(400);

    const memberResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Bia",
          username: "bia",
          password: "supersecret",
          workspaceName: "Bia",
        }),
      }),
    );
    const memberCookie = cookieFrom(memberResponse);
    const memberUserId = (await memberResponse.json()).user.id as string;
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: memberUserId, role: "member" },
    });

    const forbiddenResponse = await nextApiPatch(
      apiRequest(`session/workspace/${workspaceId}`, memberCookie, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Tentativa" }),
      }),
    );
    expect(forbiddenResponse.status).toBe(403);
  });

  test("should switch only to a workspace the account belongs to", async () => {
    const accountResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );
    const cookie = cookieFrom(accountResponse);
    const initialWorkspace = (await accountResponse.json())
      .workspaceId as string;
    const initialProject = await POST(
      apiRequest("project", cookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Estudos project" }),
      }),
    );
    expect(initialProject.status).toBe(201);

    const createdWorkspace = await POST(
      apiRequest("session/workspace", cookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Casa" }),
      }),
    );
    const otherWorkspaceId = (await createdWorkspace.json()).workspace
      .id as string;
    const otherProject = await POST(
      apiRequest("project", cookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Casa project" }),
      }),
    );
    expect(otherProject.status).toBe(201);

    const switchResponse = await nextApiPatch(
      apiRequest("session/workspace", cookie, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: initialWorkspace }),
      }),
    );

    expect(switchResponse.status).toBe(200);
    expect(await switchResponse.json()).toMatchObject({
      activeWorkspaceId: initialWorkspace,
      workspace: { id: initialWorkspace, name: "Estudos" },
    });
    const scopedProjects = await nextApiGet(apiRequest("project", cookie));
    expect(await scopedProjects.json()).toEqual([
      expect.objectContaining({ name: "Estudos project" }),
    ]);

    const outsiderResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Bia",
          username: "bia",
          password: "supersecret",
          workspaceName: "Pessoal da Bia",
        }),
      }),
    );
    const outsiderWorkspaceId = (await outsiderResponse.json()).workspaceId;

    const forbiddenSwitch = await nextApiPatch(
      apiRequest("session/workspace", cookie, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: outsiderWorkspaceId }),
      }),
    );
    expect(forbiddenSwitch.status).toBe(403);

    const invalidSwitch = await nextApiPatch(
      apiRequest("session/workspace", cookie, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "not-a-uuid" }),
      }),
    );
    expect(invalidSwitch.status).toBe(400);
    expect(otherWorkspaceId).not.toBe(initialWorkspace);
  });

  test("should delete a workspace and move its active session safely", async () => {
    const accountResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );
    const cookie = cookieFrom(accountResponse);
    const initialWorkspaceId = (await accountResponse.json())
      .workspaceId as string;

    const createResponse = await POST(
      apiRequest("session/workspace", cookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Casa" }),
      }),
    );
    const activeWorkspaceId = (await createResponse.json()).workspace
      .id as string;

    const deleteResponse = await nextApiDelete(
      apiRequest(`session/workspace/${activeWorkspaceId}`, cookie, {
        method: "DELETE",
      }),
    );
    expect(deleteResponse.status).toBe(200);
    expect(await deleteResponse.json()).toMatchObject({
      deletedWorkspaceId: activeWorkspaceId,
      activeWorkspaceId: initialWorkspaceId,
      workspaceName: "Estudos",
    });
    const workspaceList = await nextApiGet(
      apiRequest("session/workspace", cookie),
    );
    expect(await workspaceList.json()).toMatchObject({
      activeWorkspaceId: initialWorkspaceId,
      workspaces: [expect.objectContaining({ name: "Estudos" })],
    });

    const memberAccount = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Bia",
          username: "bia",
          password: "supersecret",
          workspaceName: "Bia",
        }),
      }),
    );
    const memberCookie = cookieFrom(memberAccount);
    const memberUserId = (await memberAccount.json()).user.id as string;
    await prisma.workspaceMember.create({
      data: {
        workspaceId: initialWorkspaceId,
        userId: memberUserId,
        role: "member",
      },
    });
    const memberDelete = await nextApiDelete(
      apiRequest(`session/workspace/${initialWorkspaceId}`, memberCookie, {
        method: "DELETE",
      }),
    );
    expect(memberDelete.status).toBe(403);

    const lastWorkspaceDelete = await nextApiDelete(
      apiRequest(`session/workspace/${initialWorkspaceId}`, cookie, {
        method: "DELETE",
      }),
    );
    expect(lastWorkspaceDelete.status).toBe(409);
  });

  test("should create an account without email by upgrading the guest workspace", async () => {
    const guestResponse = await POST(
      apiRequest("session/guest", undefined, { method: "POST" }),
    );
    const guestCookie = cookieFrom(guestResponse);
    const guestSession = await guestResponse.json();

    const signup = await POST(
      apiRequest("session/account", guestCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "pablo.moura",
          password: "supersecret",
        }),
      }),
    );

    expect(signup.status).toBe(200);
    expect(await signup.json()).toMatchObject({
      user: {
        username: "pablo.moura",
        email: null,
        kind: "account",
      },
      workspaceId: guestSession.workspaceId,
    });
    expect(signup.headers.get("set-cookie")).toContain("account_session=");

    const signin = await POST(
      apiRequest("session/sign-in", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "pablo.moura",
          password: "supersecret",
        }),
      }),
    );
    expect(signin.status).toBe(200);
  });

  test("should reuse and extend a valid guest session cookie", async () => {
    const first = await POST(
      apiRequest("session/guest", undefined, { method: "POST" }),
    );
    const firstCookie = cookieFrom(first);
    const firstBody = await first.json();
    const second = await POST(
      apiRequest("session/guest", firstCookie, { method: "POST" }),
    );
    const secondBody = await second.json();

    expect(second.status).toBe(200);
    expect(secondBody).toEqual(firstBody);
    expect(cookieFrom(second)).toBe(firstCookie);
  });

  test("should refresh the guest cookie expiration on authenticated requests", async () => {
    const sessionResponse = await POST(
      apiRequest("session/guest", undefined, { method: "POST" }),
    );
    const cookie = cookieFrom(sessionResponse);

    const projectsResponse = await nextApiGet(apiRequest("project", cookie));
    const refreshedCookie = projectsResponse.headers.get("set-cookie");

    expect(projectsResponse.status).toBe(200);
    expect(refreshedCookie).toContain("HttpOnly");
    expect(refreshedCookie).toContain("SameSite=Lax");
    expect(refreshedCookie).toContain("Max-Age=2592000");
    expect(refreshedCookie).toContain(cookie.split("=")[1]);
  });

  test("should isolate project reads and writes between guest workspaces", async () => {
    const firstSession = await POST(
      apiRequest("session/guest", undefined, { method: "POST" }),
    );
    const firstCookie = cookieFrom(firstSession);
    const firstBody = await firstSession.json();

    const createResponse = await POST(
      apiRequest("project", firstCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Private guest project" }),
      }),
    );
    expect(createResponse.status).toBe(201);
    const project = await createResponse.json();
    expect(project.workspaceId).toBe(firstBody.workspaceId);

    const taskCreateResponse = await POST(
      apiRequest("task", firstCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Private guest task",
          projectId: project.id,
        }),
      }),
    );
    expect(taskCreateResponse.status).toBe(201);
    const task = await taskCreateResponse.json();

    const secondSession = await POST(
      apiRequest("session/guest", undefined, { method: "POST" }),
    );
    const secondCookie = cookieFrom(secondSession);
    const secondBody = await secondSession.json();
    expect(secondBody.workspaceId).not.toBe(firstBody.workspaceId);

    const secondProjectsResponse = await nextApiGet(
      apiRequest("project", secondCookie),
    );
    expect(secondProjectsResponse.status).toBe(200);
    expect(await secondProjectsResponse.json()).toEqual([]);

    const foreignTasksResponse = await nextApiGet(
      apiRequest(`task?projectId=${project.id}`, secondCookie),
    );
    expect(foreignTasksResponse.status).toBe(404);

    const foreignTaskCreate = await POST(
      apiRequest("task", secondCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Unauthorized task",
          projectId: project.id,
        }),
      }),
    );
    expect(foreignTaskCreate.status).toBe(404);

    const foreignTaskUpdate = await nextApiPatch(
      apiRequest(`task/${task.id}`, secondCookie, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Unauthorized update" }),
      }),
    );
    expect(foreignTaskUpdate.status).toBe(404);

    const foreignTaskDelete = await nextApiDelete(
      apiRequest(`task/${task.id}`, secondCookie, { method: "DELETE" }),
    );
    expect(foreignTaskDelete.status).toBe(404);
    expect(
      await prisma.task.findUnique({ where: { id: task.id } }),
    ).toMatchObject({
      name: "Private guest task",
      projectId: project.id,
    });

    const foreignProjectDelete = await nextApiDelete(
      apiRequest(`project/${project.id}`, secondCookie, { method: "DELETE" }),
    );
    expect(foreignProjectDelete.status).toBe(404);
    expect(
      await prisma.project.findUnique({ where: { id: project.id } }),
    ).not.toBeNull();
  });

  test("should allow workspace owners to invite a user by username and accept the invite", async () => {
    const ownerResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );
    const ownerCookie = cookieFrom(ownerResponse);
    const workspaceId = (await ownerResponse.json()).workspaceId as string;

    const projectResponse = await POST(
      apiRequest("project", ownerCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Pessoal" }),
      }),
    );
    const projectId = (await projectResponse.json()).id as number;

    const memberResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Bia",
          username: "bia",
          password: "supersecret",
          workspaceName: "Bia",
        }),
      }),
    );
    const memberCookie = cookieFrom(memberResponse);
    const memberUserId = (await memberResponse.json()).user.id as string;

    const inviteResponse = await POST(
      apiRequest(`session/workspace/${workspaceId}/invite`, ownerCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "bia", projectIds: [projectId] }),
      }),
    );
    expect(inviteResponse.status).toBe(201);
    const invite = await inviteResponse.json();
    expect(invite).toMatchObject({
      workspaceId,
      targetUserId: memberUserId,
      status: "pending",
      projectIds: [projectId],
    });
    expect(new Date(invite.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const ownerProjectsResponse = await nextApiGet(
      apiRequest("project", ownerCookie),
    );
    expect(ownerProjectsResponse.status).toBe(200);
    expect(await ownerProjectsResponse.json()).toEqual([
      expect.objectContaining({ id: projectId, name: "Pessoal" }),
    ]);

    const sentInvitesResponse = await nextApiGet(
      apiRequest(`session/workspace/${workspaceId}/invites`, ownerCookie),
    );
    expect(sentInvitesResponse.status).toBe(200);
    expect((await sentInvitesResponse.json()).invites).toEqual([
      expect.objectContaining({
        id: invite.id,
        targetUserId: memberUserId,
        status: "pending",
        projectIds: [projectId],
      }),
    ]);

    const inboxResponse = await nextApiGet(
      apiRequest("session/workspace/invites", memberCookie),
    );
    expect(inboxResponse.status).toBe(200);
    expect((await inboxResponse.json()).invites).toEqual([
      expect.objectContaining({
        workspaceId,
        targetUserId: memberUserId,
        status: "pending",
        readAt: null,
      }),
    ]);

    const inviteId = invite.id as number;
    const readResponse = await nextApiPatch(
      apiRequest(`session/workspace/invites/${inviteId}/read`, memberCookie, {
        method: "PATCH",
      }),
    );
    expect(readResponse.status).toBe(200);
    expect(await readResponse.json()).toMatchObject({
      read: true,
      status: "pending",
    });
    expect(
      await prisma.workspaceInvite.findUnique({ where: { id: inviteId } }),
    ).toMatchObject({ status: "pending", readAt: expect.any(Date) });

    const acceptResponse = await POST(
      apiRequest(`session/workspace/invites/${inviteId}/accept`, memberCookie, {
        method: "POST",
      }),
    );
    expect(acceptResponse.status).toBe(200);
    expect(await acceptResponse.json()).toMatchObject({
      accepted: true,
      workspaceId,
      userId: memberUserId,
    });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberUserId } },
    });
    expect(membership).toMatchObject({ role: "member" });
    expect(
      await prisma.projectMember.findMany({
        where: { userId: memberUserId, projectId },
      }),
    ).toHaveLength(1);
  });

  test("should let owners manage member project access and remove members", async () => {
    const ownerResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );
    const ownerCookie = cookieFrom(ownerResponse);
    const owner = await ownerResponse.json();
    const workspaceId = owner.workspaceId as string;

    const firstProjectResponse = await POST(
      apiRequest("project", ownerCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Projeto um" }),
      }),
    );
    const firstProjectId = (await firstProjectResponse.json()).id as number;
    const secondProjectResponse = await POST(
      apiRequest("project", ownerCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Projeto dois" }),
      }),
    );
    const secondProjectId = (await secondProjectResponse.json()).id as number;

    const memberResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Bia",
          username: "bia",
          password: "supersecret",
          workspaceName: "Pessoal da Bia",
        }),
      }),
    );
    const memberCookie = cookieFrom(memberResponse);
    const member = await memberResponse.json();
    const memberUserId = member.user.id as string;
    const memberWorkspaceId = member.workspaceId as string;
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: memberUserId, role: "member" },
    });

    const isolatedMember = await prisma.user.create({
      data: { displayName: "Caio", username: "caio", kind: "account" },
    });
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: isolatedMember.id, role: "member" },
    });
    await prisma.projectMember.create({
      data: { projectId: secondProjectId, userId: isolatedMember.id },
    });

    const rosterResponse = await nextApiGet(
      apiRequest(`session/workspace/${workspaceId}/members`, memberCookie),
    );
    expect(rosterResponse.status).toBe(200);
    expect(await rosterResponse.json()).toMatchObject({
      projects: [],
      members: [],
    });

    const assignmentResponse = await nextApiPut(
      apiRequest(
        `session/workspace/${workspaceId}/members/${memberUserId}/projects`,
        ownerCookie,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectIds: [firstProjectId] }),
        },
      ),
    );
    expect(assignmentResponse.status).toBe(200);
    expect(await assignmentResponse.json()).toMatchObject({
      userId: memberUserId,
      projectIds: [firstProjectId],
    });
    expect(
      await prisma.projectActivity.findFirst({
        where: { projectId: firstProjectId, type: "member_added" },
      }),
    ).toMatchObject({
      actorName: "Ana",
      details: { memberName: "Bia", memberId: memberUserId },
    });

    const memberRosterResponse = await nextApiGet(
      apiRequest(`session/workspace/${workspaceId}/members`, memberCookie),
    );
    const memberRoster = await memberRosterResponse.json();
    expect(memberRoster).toMatchObject({
      projects: [{ id: firstProjectId, name: "Projeto um" }],
      members: expect.arrayContaining([
        expect.objectContaining({
          userId: memberUserId,
          projects: [{ id: firstProjectId, name: "Projeto um" }],
        }),
        expect.objectContaining({ role: "owner" }),
      ]),
    });
    expect(
      memberRoster.members.find(
        (listedMember: { userId: string }) => listedMember.userId === memberUserId,
      ),
    ).toMatchObject({ isCurrentUser: true });
    expect(memberRoster.members).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: isolatedMember.id }),
      ]),
    );
    expect(memberRoster.projects).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: secondProjectId }),
      ]),
    );

    const ownerRosterResponse = await nextApiGet(
      apiRequest(`session/workspace/${workspaceId}/members`, ownerCookie),
    );
    expect(await ownerRosterResponse.json()).toMatchObject({
      projects: expect.arrayContaining([
        { id: firstProjectId, name: "Projeto um" },
        { id: secondProjectId, name: "Projeto dois" },
      ]),
      members: expect.arrayContaining([
        expect.objectContaining({ userId: isolatedMember.id }),
      ]),
    });

    const deniedAssignment = await nextApiPut(
      apiRequest(
        `session/workspace/${workspaceId}/members/${memberUserId}/projects`,
        memberCookie,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectIds: [secondProjectId] }),
        },
      ),
    );
    expect(deniedAssignment.status).toBe(403);

    const deniedRemoval = await nextApiDelete(
      apiRequest(
        `session/workspace/${workspaceId}/members/${memberUserId}`,
        memberCookie,
        { method: "DELETE" },
      ),
    );
    expect(deniedRemoval.status).toBe(403);

    const removalResponse = await nextApiDelete(
      apiRequest(
        `session/workspace/${workspaceId}/members/${memberUserId}`,
        ownerCookie,
        { method: "DELETE" },
      ),
    );
    expect(removalResponse.status).toBe(200);
    expect(
      await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: memberUserId } },
      }),
    ).toBeNull();
    expect(
      await prisma.projectMember.findMany({ where: { userId: memberUserId } }),
    ).toHaveLength(0);
    expect(
      await prisma.session.findFirst({ where: { userId: memberUserId } }),
    ).toMatchObject({ workspaceId: memberWorkspaceId });
  });

  test("should expire an invitation before accepting it after its deadline", async () => {
    const ownerResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );
    const ownerCookie = cookieFrom(ownerResponse);
    const workspaceId = (await ownerResponse.json()).workspaceId as string;

    const memberResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Bia",
          username: "bia",
          password: "supersecret",
          workspaceName: "Bia",
        }),
      }),
    );
    const memberCookie = cookieFrom(memberResponse);
    const memberUserId = (await memberResponse.json()).user.id as string;

    const inviteResponse = await POST(
      apiRequest(`session/workspace/${workspaceId}/invite`, ownerCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "bia" }),
      }),
    );
    const inviteId = (await inviteResponse.json()).id as number;
    await prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const acceptResponse = await POST(
      apiRequest(`session/workspace/invites/${inviteId}/accept`, memberCookie, {
        method: "POST",
      }),
    );

    expect(acceptResponse.status).toBe(409);
    expect(
      await prisma.workspaceInvite.findUnique({ where: { id: inviteId } }),
    ).toMatchObject({ status: "expired" });
    expect(
      await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: memberUserId } },
      }),
    ).toBeNull();
  });

  test("should keep an invited member in the workspace with no projects after project deletion", async () => {
    const ownerResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );
    const ownerCookie = cookieFrom(ownerResponse);
    const ownerWorkspaceId = (await ownerResponse.json()).workspaceId as string;
    const projectResponse = await POST(
      apiRequest("project", ownerCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Projeto que será removido" }),
      }),
    );
    const projectId = (await projectResponse.json()).id as number;

    const memberResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Bia",
          username: "bia",
          password: "supersecret",
          workspaceName: "Bia",
        }),
      }),
    );
    const memberCookie = cookieFrom(memberResponse);
    const member = await memberResponse.json();
    const memberUserId = member.user.id as string;
    const memberWorkspaceId = member.workspaceId as string;

    const inviteResponse = await POST(
      apiRequest(`session/workspace/${ownerWorkspaceId}/invite`, ownerCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "bia", projectIds: [] }),
      }),
    );
    const inviteId = (await inviteResponse.json()).id as number;
    const acceptResponse = await POST(
      apiRequest(`session/workspace/invites/${inviteId}/accept`, memberCookie, {
        method: "POST",
      }),
    );
    expect(acceptResponse.status).toBe(200);
    expect(
      await prisma.projectMember.findMany({ where: { userId: memberUserId } }),
    ).toHaveLength(0);

    const deleteProjectResponse = await nextApiDelete(
      apiRequest(`project/${projectId}`, ownerCookie, { method: "DELETE" }),
    );
    expect(deleteProjectResponse.status).toBe(200);
    expect(
      await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: ownerWorkspaceId,
            userId: memberUserId,
          },
        },
      }),
    ).toMatchObject({ role: "member" });

    const switchToSharedWorkspace = await nextApiPatch(
      apiRequest("session/workspace", memberCookie, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: ownerWorkspaceId }),
      }),
    );
    expect(switchToSharedWorkspace.status).toBe(200);
    const sharedProjectsResponse = await nextApiGet(
      apiRequest("project", memberCookie),
    );
    expect(await sharedProjectsResponse.json()).toEqual([]);

    const deniedProjectCreate = await POST(
      apiRequest("project", memberCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Não permitido" }),
      }),
    );
    expect(deniedProjectCreate.status).toBe(403);

    const switchToPersonalWorkspace = await nextApiPatch(
      apiRequest("session/workspace", memberCookie, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: memberWorkspaceId }),
      }),
    );
    expect(switchToPersonalWorkspace.status).toBe(200);
    const personalProjectResponse = await POST(
      apiRequest("project", memberCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Projeto pessoal" }),
      }),
    );
    expect(personalProjectResponse.status).toBe(201);
    expect(await personalProjectResponse.json()).toMatchObject({
      workspaceId: memberWorkspaceId,
      name: "Projeto pessoal",
    });
  });

  test("should load task activity through the API for an account session", async () => {
    const signupResponse = await POST(
      apiRequest("session/account", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ana",
          username: "ana",
          password: "supersecret",
          workspaceName: "Estudos",
        }),
      }),
    );
    const accountCookie = cookieFrom(signupResponse);
    const projectResponse = await POST(
      apiRequest("project", accountCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Account project" }),
      }),
    );
    const projectId = (await projectResponse.json()).id as number;

    const taskResponse = await POST(
      apiRequest("task", accountCookie, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Account task", projectId }),
      }),
    );
    expect(taskResponse.status).toBe(201);

    const activityResponse = await nextApiGet(
      apiRequest(`project/${projectId}/activity`, accountCookie),
    );
    expect(activityResponse.status).toBe(200);
    expect(await activityResponse.json()).toEqual([
      expect.objectContaining({
        type: "task_created",
        taskName: "Account task",
        actorName: "Ana",
      }),
    ]);
  });
});
