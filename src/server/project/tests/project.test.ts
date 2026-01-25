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
  // POST /api/project - Create new project.
  test("should create a new project", async () => {
    const mockProject = { name: "Test Project" };

    const res = await app.request("/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Test Project" }),
      headers: { "Content-Type": "application/json" },
    });

    const expectedResponse = { ...mockProject, id: 1 };

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(expectedResponse);
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

    const expectedResponse = mockProjects.map((project) => ({
      ...project,
      tasks: [],
    }));

    const res = await app.request("/projects");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(expectedResponse);
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
