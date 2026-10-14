import {
  test,
  expect,
  describe,
  afterAll,
  beforeAll,
  beforeEach,
} from "vitest";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { projectRoutes } from "../project.routes";
import { cleanDatabase } from "@/utils";
import { POST as nextApiPost } from "@/app/api/[[...route]]/route";

const app = new Hono();
app.route("/projects", projectRoutes);

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
      new Request("http://localhost/api/project", {
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
