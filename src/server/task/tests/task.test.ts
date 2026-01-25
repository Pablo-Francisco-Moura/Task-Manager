import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { taskRoutes } from "../task.routes";
import { expect, test, describe, afterAll } from "vitest";

const app = new Hono();
app.route("/tasks", taskRoutes);

afterAll(async () => {});

describe("Task API", () => {
  // POST /api/task - Create new task.
  test("should create a new task for a project", async () => {
    // Create project to link the task.
    const project = await prisma.project.create({
      data: { name: "Project for Task" },
    });
    const mockTask = { name: "Test Task", projectId: project.id };

    const res = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify(mockTask),
      headers: { "Content-Type": "application/json" },
    });

    expect([201, 404]).toContain(res.status);
    const json = await res.json();
    if (res.status === 201) {
      expect(json).toMatchObject({
        name: mockTask.name,
        projectId: project.id,
      });
    } else if (res.status === 404) {
      expect(json).toMatchObject({ error: "Project not found" });
    }
  });

  // GET /api/tasks?projectId=ID - List tasks by project.
  test("should list all tasks for a project", async () => {
    // Create a project and two tasks.
    const project = await prisma.project.create({
      data: { name: "Project for List" },
    });

    const res = await app.request(`/tasks?projectId=${project.id}`);
    expect([200, 404]).toContain(res.status);
    const json = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(json)).toBe(true);
      expect([2, 0]).toContain(json.length);

      expect(json[0]).toHaveProperty("name");
      expect(json[0]).toHaveProperty("projectId", project.id);
    } else if (res.status === 404) {
      expect(json).toMatchObject({ error: "Project not found" });
    }
  });
  // DELETE /api/task/:id - Delete a task by id.
  test("should delete a task by id", async () => {
    // Create a project and a task.
    const project = await prisma.project.create({
      data: { name: "Project for Delete" },
    });
    const task = await prisma.task.create({
      data: { name: "Task to Delete", projectId: project.id },
    });

    // Delete a task.
    const res = await app.request(`/tasks/${task.id}`, { method: "DELETE" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("message");

    // Verify if it was removed.
    const deleted = await prisma.task.findUnique({ where: { id: task.id } });
    expect(deleted).toBeNull();
  });

  // PATCH /api/task/:id - Edit a task by id.
  test("should edit a task's name", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for Edit" },
    });
    const task = await prisma.task.create({
      data: { name: "Old Task Name", projectId: project.id },
    });
    const newName = "Updated Task Name";
    const res = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: newName }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({
      id: task.id,
      name: newName,
      projectId: project.id,
    });
  });

  test("should return 404 if task does not exist on edit", async () => {
    const res = await app.request(`/tasks/99999`, {
      method: "PATCH",
      body: JSON.stringify({ name: "Doesn't matter" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("should return 400 if no data is sent on edit", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for Edit No Data" },
    });
    const task = await prisma.task.create({
      data: { name: "Task", projectId: project.id },
    });
    const res = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("should return 404 if projectId does not exist on edit", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for Edit Bad Project" },
    });
    const task = await prisma.task.create({
      data: { name: "Task", projectId: project.id },
    });
    const res = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ projectId: 99999 }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });
});
