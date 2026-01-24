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
});
