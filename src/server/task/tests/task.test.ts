import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { taskRoutes } from "../task.routes";
import { cleanDatabase } from "@/utils";
import { expect, test, describe, beforeEach, afterAll } from "vitest";

const app = new Hono();
app.route("/tasks", taskRoutes);

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
});

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

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({ name: mockTask.name, projectId: project.id });
  });
});
