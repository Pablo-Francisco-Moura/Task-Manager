import {
  POST,
  GET as nextApiGet,
  DELETE as nextApiDelete,
} from "@/app/api/[[...route]]/route";
import { prisma } from "@/lib/prisma";
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

    const foreignProjectDelete = await nextApiDelete(
      apiRequest(`project/${project.id}`, secondCookie, { method: "DELETE" }),
    );
    expect(foreignProjectDelete.status).toBe(404);
    expect(
      await prisma.project.findUnique({ where: { id: project.id } }),
    ).not.toBeNull();
  });
});
