import {
  test,
  expect,
  describe,
  afterAll,
  beforeAll,
  beforeEach,
} from "vitest";
import {
  GET as nextApiGet,
  POST as nextApiPost,
} from "@/app/api/[[...route]]/route";
import {
  createTestRequest,
  testPrisma as prisma,
  createAuthenticatedTestApp,
} from "@/server/tests/testDatabase";
import { projectRoutes } from "../project.routes";
import { cleanDatabase } from "@/utils";
import { TEST_GUEST_IDENTITY } from "@/constants/testGuest";

const app = createAuthenticatedTestApp("/projects", projectRoutes);

beforeAll(async () => {
  await cleanDatabase();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
});

describe("Project API", () => {
  test.each([
    {},
    { name: "" },
    { name: "   " },
    { name: 123 },
    { name: "Valid name", extra: true },
    { name: "x".repeat(201) },
    { name: "Project", description: 42 },
    { name: "Project", description: "x".repeat(2001) },
  ])("should reject invalid project payloads: %o", async (body) => {
    const response = await app.request("/projects", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(400);
  });

  test.each(["0", "-1", "1.5", "1e2", "not-an-id"])(
    "should reject invalid project IDs on delete: %s",
    async (id) => {
      const response = await app.request(`/projects/${id}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(400);
    },
  );

  test.each(["0", "-1", "1.5", "1e2", "not-an-id"])(
    "should reject invalid project IDs on update: %s",
    async (id) => {
      const response = await app.request(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated name" }),
        headers: { "Content-Type": "application/json" },
      });
      expect(response.status).toBe(400);
    },
  );

  test.each([
    {},
    { name: "   " },
    { name: 123 },
    { name: "Valid name", extra: true },
    { name: "x".repeat(201) },
    { description: 42 },
    { description: "x".repeat(2001) },
  ])("should reject invalid project updates: %o", async (body) => {
    const response = await app.request("/projects/1", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(400);
  });

  test("should create a project through the Next.js API route", async () => {
    const response = await nextApiPost(
      createTestRequest("/api/project", {
        method: "POST",
        body: JSON.stringify({
          name: "Project through Next",
          description: "Created through the Next route",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: expect.any(Number),
      name: "Project through Next",
      description: "Created through the Next route",
    });
  });

  test("should accept a project name at the maximum allowed length", async () => {
    const name = "x".repeat(200);
    const response = await app.request("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ name });
  });

  test("should accept a project description at the maximum allowed length", async () => {
    const description = "x".repeat(2000);
    const response = await app.request("/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Project", description }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ description });
  });

  // POST /api/project - Create new project.
  test("should create a new project", async () => {
    const mockProject = { name: "Test Project" };

    const res = await app.request("/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Test Project" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      ...mockProject,
      id: 1,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(
      await prisma.projectActivity.findFirst({
        where: { projectId: 1, type: "project_created" },
      }),
    ).toMatchObject({
      actorName: "Test Guest",
      details: { projectName: "Test Project" },
    });
  });

  // GET /api/project - Get all projects with their tasks.
  test("should return a list of projects", async () => {
    const mockProjects = [
      { id: 1, name: "Project A" },
      { id: 2, name: "Project B" },
    ];

    await prisma.project.createMany({
      data: mockProjects,
    });

    const res = await app.request("/projects");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      mockProjects.map((project) =>
        expect.objectContaining({
          ...project,
          tasks: [],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ),
    );
  });

  test("should restrict members to granted projects and prevent project changes", async () => {
    const [allowedProject, hiddenProject] = await Promise.all([
      prisma.project.create({ data: { name: "Granted project" } }),
      prisma.project.create({ data: { name: "Hidden project" } }),
    ]);
    await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId: TEST_GUEST_IDENTITY.workspaceId,
          userId: TEST_GUEST_IDENTITY.userId,
        },
      },
      data: { role: "member" },
    });
    await prisma.projectMember.create({
      data: {
        projectId: allowedProject.id,
        userId: TEST_GUEST_IDENTITY.userId,
      },
    });

    const listResponse = await app.request("/projects");
    expect(await listResponse.json()).toEqual([
      expect.objectContaining({ id: allowedProject.id }),
    ]);

    const createResponse = await app.request("/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Forbidden project" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(createResponse.status).toBe(403);

    const deniedGrantedProjectUpdate = await app.request(
      `/projects/${allowedProject.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name: "Member edit attempt" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(deniedGrantedProjectUpdate.status).toBe(403);

    const deniedGrantedProjectDelete = await app.request(
      `/projects/${allowedProject.id}`,
      { method: "DELETE" },
    );
    expect(deniedGrantedProjectDelete.status).toBe(403);
    expect(
      await prisma.project.findUnique({ where: { id: allowedProject.id } }),
    ).toMatchObject({ name: "Granted project" });

    const deniedUpdate = await app.request(`/projects/${hiddenProject.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "No access" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(deniedUpdate.status).toBe(404);
    const deniedDelete = await app.request(`/projects/${hiddenProject.id}`, {
      method: "DELETE",
    });
    expect(deniedDelete.status).toBe(404);
  });

  test("should allow authors to edit comments and owners to moderate them", async () => {
    const project = await prisma.project.create({
      data: { name: "Discussion" },
    });
    const createResponse = await app.request(
      `/projects/${project.id}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content: "Initial comment" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(createResponse.status).toBe(201);
    const comment = await createResponse.json();
    expect(comment).toMatchObject({
      type: "comment",
      content: "Initial comment",
      canEdit: true,
      canDelete: true,
    });

    const updateResponse = await app.request(
      `/projects/${project.id}/activity/${comment.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ content: "Updated comment" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(updateResponse.status).toBe(200);
    expect(await updateResponse.json()).toMatchObject({
      content: "Updated comment",
    });

    const otherUser = await prisma.user.create({
      data: { displayName: "Other author", kind: "account" },
    });
    const otherComment = await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: otherUser.id,
        actorName: otherUser.displayName,
        type: "comment",
        content: "Another person's comment",
      },
    });
    const deniedEdit = await app.request(
      `/projects/${project.id}/activity/${otherComment.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ content: "Owner cannot edit another comment" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(deniedEdit.status).toBe(403);

    const moderatedDelete = await app.request(
      `/projects/${project.id}/activity/${otherComment.id}`,
      { method: "DELETE" },
    );
    expect(moderatedDelete.status).toBe(200);
    expect(
      await prisma.projectActivity.findUnique({
        where: { id: otherComment.id },
      }),
    ).toMatchObject({
      actorId: otherUser.id,
      actorName: otherUser.displayName,
      content: null,
      isDeleted: true,
    });
    const deletionActivity = await prisma.projectActivity.findFirstOrThrow({
      where: {
        projectId: project.id,
        type: "comment_deleted",
      },
    });
    expect(deletionActivity).toMatchObject({
      actorId: TEST_GUEST_IDENTITY.userId,
      actorName: "Test Guest",
      details: {
        commentId: otherComment.id,
        commentAuthorId: otherUser.id,
        commentAuthorName: otherUser.displayName,
      },
    });

    const activityResponse = await app.request(
      `/projects/${project.id}/activity`,
    );
    expect(await activityResponse.json()).toEqual([
      expect.objectContaining({
        id: deletionActivity.id,
        type: "comment_deleted",
        actorName: "Test Guest",
      }),
    ]);
  });

  test("should load project activity for an authorized workspace member", async () => {
    const project = await prisma.project.create({
      data: { name: "Activity timeline" },
    });
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: TEST_GUEST_IDENTITY.userId,
        actorName: "Test Guest",
        type: "task_created",
        taskName: "Example task",
      },
    });

    const response = await app.request(`/projects/${project.id}/activity`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({
        type: "task_created",
        actorName: "Test Guest",
        taskName: "Example task",
      }),
    ]);

    const nextApiResponse = await nextApiGet(
      createTestRequest(`/api/project/${project.id}/activity`),
    );
    expect(nextApiResponse.status).toBe(200);
    expect(await nextApiResponse.json()).toEqual([
      expect.objectContaining({ taskName: "Example task" }),
    ]);
  });

  test("should track unread activity for workspace owners from project creation", async () => {
    const beforeProjectCreation = new Date(Date.now() - 60_000);
    const project = await prisma.project.create({
      data: {
        name: "Owner notifications",
        createdAt: new Date(),
      },
    });
    const otherUser = await prisma.user.create({
      data: { displayName: "Other member", kind: "account" },
    });
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: otherUser.id,
        actorName: otherUser.displayName,
        type: "comment",
        content: "Before project creation",
        createdAt: beforeProjectCreation,
      },
    });

    const projectUrl = `/projects/${project.id}/activity/unread-count`;
    const beforeNewActivity = await app.request(projectUrl);
    expect(await beforeNewActivity.json()).toEqual({ unreadCount: 0 });

    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: otherUser.id,
        actorName: otherUser.displayName,
        type: "comment",
        content: "After project creation",
      },
    });
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: TEST_GUEST_IDENTITY.userId,
        actorName: "Test Guest",
        type: "comment",
        content: "My own comment",
      },
    });

    const unreadResponse = await app.request(projectUrl);
    expect(await unreadResponse.json()).toEqual({ unreadCount: 1 });

    const latestActivity = await prisma.projectActivity.findFirstOrThrow({
      where: { projectId: project.id },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    const readResponse = await app.request(
      `/projects/${project.id}/activity/read`,
      {
        method: "POST",
        body: JSON.stringify({ activityId: latestActivity.id }),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(readResponse.status).toBe(200);
    expect(await readResponse.json()).toEqual({ read: true });

    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: otherUser.id,
        actorName: otherUser.displayName,
        type: "comment",
        content: "Created after the chat loaded",
      },
    });
    const clearedResponse = await app.request(projectUrl);
    expect(await clearedResponse.json()).toEqual({ unreadCount: 1 });
  });

  test("should count activity only from a member's project entry and clear it when read", async () => {
    const project = await prisma.project.create({
      data: { name: "Member notifications" },
    });
    const otherUser = await prisma.user.create({
      data: { displayName: "Other member", kind: "account" },
    });
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: otherUser.id,
        actorName: otherUser.displayName,
        type: "comment",
        content: "Before project entry",
        createdAt: new Date(Date.now() - 60_000),
      },
    });
    await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId: TEST_GUEST_IDENTITY.workspaceId,
          userId: TEST_GUEST_IDENTITY.userId,
        },
      },
      data: { role: "member" },
    });
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: TEST_GUEST_IDENTITY.userId,
      },
    });

    const projectUrl = `/projects/${project.id}/activity/unread-count`;
    const beforeNewActivity = await app.request(projectUrl);
    expect(await beforeNewActivity.json()).toEqual({ unreadCount: 0 });

    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: otherUser.id,
        actorName: otherUser.displayName,
        type: "comment",
        content: "After project entry",
      },
    });
    const unreadResponse = await app.request(projectUrl);
    expect(await unreadResponse.json()).toEqual({ unreadCount: 1 });

    const latestActivity = await prisma.projectActivity.findFirstOrThrow({
      where: { projectId: project.id },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    const readResponse = await app.request(
      `/projects/${project.id}/activity/read`,
      {
        method: "POST",
        body: JSON.stringify({ activityId: latestActivity.id }),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(readResponse.status).toBe(200);
    const clearedResponse = await app.request(projectUrl);
    expect(await clearedResponse.json()).toEqual({ unreadCount: 0 });

    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: otherUser.id,
        actorName: otherUser.displayName,
        type: "comment",
        content: "Activity after the member read the chat",
      },
    });
    const newUnreadResponse = await app.request(projectUrl);
    expect(await newUnreadResponse.json()).toEqual({ unreadCount: 1 });
  });

  // DELETE /api/project/:id - Delete project and its linked tasks.
  test("should delete a project and its tasks", async () => {
    // Create project.
    const project = await prisma.project.create({
      data: { name: "Project to Delete" },
    });

    // Create linked tasks.
    await prisma.task.createMany({
      data: [
        { name: "Task 1", projectId: project.id },
        { name: "Task 2", projectId: project.id },
      ],
    });

    // Delete project.
    const res = await app.request(`/projects/${project.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("message");

    // Verify if project was removed.
    const deletedProject = await prisma.project.findUnique({
      where: { id: project.id },
    });
    expect(deletedProject).toBeNull();

    // Verify if tasks were removed.
    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
    });
    expect(tasks.length).toBe(0);
  });

  // PATCH /api/project/:id - Edit a project by id.
  test("should edit a project's name", async () => {
    const project = await prisma.project.create({
      data: { name: "Old Project Name" },
    });
    const newName = "Updated Project Name";
    const res = await app.request(`/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: newName }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ id: project.id, name: newName });
    expect(
      await prisma.projectActivity.findFirst({
        where: { projectId: project.id, type: "project_updated" },
      }),
    ).toMatchObject({
      details: {
        projectName: newName,
        changes: { name: { from: "Old Project Name", to: newName } },
      },
    });
  });

  test("should update and clear a project description", async () => {
    const project = await prisma.project.create({
      data: {
        name: "Project with description",
        description: "Initial context",
      },
    });

    const updateResponse = await app.request(`/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({ description: "Updated context" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(updateResponse.status).toBe(200);
    expect(await updateResponse.json()).toMatchObject({
      description: "Updated context",
    });

    const clearResponse = await app.request(`/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({ description: "   " }),
      headers: { "Content-Type": "application/json" },
    });
    expect(clearResponse.status).toBe(200);
    expect(await clearResponse.json()).toMatchObject({ description: null });
  });

  test("should return 404 if project does not exist on edit", async () => {
    const res = await app.request(`/projects/99999`, {
      method: "PATCH",
      body: JSON.stringify({ name: "Doesn't matter" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("should return 400 if no name is sent on edit", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for Edit No Data" },
    });
    const res = await app.request(`/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });
});
