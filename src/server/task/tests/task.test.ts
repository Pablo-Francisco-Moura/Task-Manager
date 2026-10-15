import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { taskRoutes } from "../task.routes";
import { cleanDatabase } from "@/utils";
import { POST as nextApiPost } from "@/app/api/[[...route]]/route";
import { expect, test, describe, afterAll, beforeEach } from "vitest";

const app = new Hono();
app.route("/tasks", taskRoutes);

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
});

describe("Task API", () => {
  test.each([
    [{ name: "", projectId: 1 }],
    [{ name: "Task", projectId: "1" }],
    [{ name: "Task", projectId: 0 }],
    [{ name: "Task", projectId: 1, description: 42 }],
    [{ name: "Task", projectId: 1, description: "x".repeat(2001) }],
    [{ name: "Task", projectId: 1, status: "blocked" }],
    [{ name: "Task", projectId: 1, priority: "urgent" }],
    [{ name: "Task", projectId: 1, dueDate: "2026-02-30" }],
    [{ name: "Task", projectId: 1, dueAt: "2026-11-24T14:30:00" }],
    [{ name: "Task", projectId: 1, unexpected: true }],
    [{ name: "x".repeat(201), projectId: 1 }],
  ])("should reject invalid task payloads: %o", async (body) => {
    const res = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(400);
  });

  test.each([
    {},
    { name: "   " },
    { name: 123 },
    { projectId: "1" },
    { description: 42 },
    { description: "x".repeat(2001) },
    { status: "blocked" },
    { priority: "urgent" },
    { dueDate: "2026-02-30" },
    { dueAt: "not-a-timestamp" },
    { name: "Task", extra: true },
    { name: "x".repeat(201) },
  ])("should reject invalid task updates: %o", async (body) => {
    const res = await app.request("/tasks/1", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(400);
  });

  test.each(["0", "-1", "1.5", "1e2", "not-an-id"])(
    "should reject invalid projectId query values: %s",
    async (projectId) => {
      const res = await app.request(`/tasks?projectId=${projectId}`);
      expect(res.status).toBe(400);
    },
  );

  test.each(["0", "-1", "1.5", "1e2", "not-an-id"])(
    "should reject invalid task IDs on delete: %s",
    async (id) => {
      const res = await app.request(`/tasks/${id}`, { method: "DELETE" });
      expect(res.status).toBe(400);
    },
  );

  test("should create a task through the Next.js API route", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for Next route" },
    });
    const response = await nextApiPost(
      new Request("http://localhost/api/task", {
        method: "POST",
        body: JSON.stringify({
          name: "Task through Next",
          status: "in_progress",
          priority: "high",
          dueDate: "2026-11-24",
          projectId: project.id,
          description: "Created through the Next route",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      name: "Task through Next",
      status: "in_progress",
      priority: "high",
      dueDate: "2026-11-24T00:00:00.000Z",
      projectId: project.id,
      description: "Created through the Next route",
    });
  });

  test("should default a task priority to normal", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for default priority" },
    });

    const response = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify({
        name: "Default priority task",
        projectId: project.id,
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      priority: "normal",
    });
  });

  test("should update a task priority to high", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for priority update" },
    });

    const task = await prisma.task.create({
      data: {
        name: "Priority update task",
        projectId: project.id,
        position: 0,
      },
    });

    const response = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ priority: "high" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: task.id,
      priority: "high",
    });
  });

  test("should normalize missing task priorities to normal", async () => {
    const { normalizeTaskPriority } = await import("@/utils/taskPriority");

    expect(normalizeTaskPriority(undefined)).toBe("normal");
    expect(normalizeTaskPriority("low")).toBe("low");
    expect(normalizeTaskPriority("high")).toBe("high");
  });

  test("should accept a task name at the maximum allowed length", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for maximum task name" },
    });
    const name = "x".repeat(200);
    const response = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify({ name, projectId: project.id }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      name,
      projectId: project.id,
    });
  });

  test("should accept a task description at the maximum allowed length", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for maximum description" },
    });
    const description = "x".repeat(2000);
    const response = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify({
        name: "Task",
        projectId: project.id,
        description,
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ description });
  });

  // POST /api/task - Create new task.
  test("should create a new task for a project", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for Task" },
    });
    const mockTask = {
      name: "Test Task",
      projectId: project.id,
      description: "Additional task context",
    };

    const res = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify(mockTask),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({
      name: mockTask.name,
      status: "todo",
      position: 0,
      projectId: project.id,
      description: mockTask.description,
    });
  });

  test("should create a task without a due date", async () => {
    const project = await prisma.project.create({
      data: { name: "No due date" },
    });
    const response = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify({
        name: "Task without due date",
        projectId: project.id,
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ dueDate: null });
  });

  test("should create a task with a timezone-aware due timestamp", async () => {
    const project = await prisma.project.create({
      data: { name: "Timed due date" },
    });
    const response = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify({
        name: "Timed task",
        projectId: project.id,
        dueAt: "2026-11-24T14:30:00+02:00",
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      dueDate: null,
      dueAt: "2026-11-24T12:30:00.000Z",
    });
  });

  test("should update and clear a task due date", async () => {
    const project = await prisma.project.create({
      data: { name: "Due date update" },
    });
    const task = await prisma.task.create({
      data: {
        name: "Task with due date",
        dueDate: new Date("2026-11-24T00:00:00.000Z"),
        projectId: project.id,
      },
    });

    const updateResponse = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ dueDate: "2026-12-01" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(updateResponse.status).toBe(200);
    expect(await updateResponse.json()).toMatchObject({
      dueDate: "2026-12-01T00:00:00.000Z",
    });

    const clearResponse = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ dueDate: null }),
      headers: { "Content-Type": "application/json" },
    });
    expect(clearResponse.status).toBe(200);
    expect(await clearResponse.json()).toMatchObject({
      dueDate: null,
      dueAt: null,
    });
  });

  test("should update and clear a timezone-aware due timestamp", async () => {
    const project = await prisma.project.create({
      data: { name: "Timed due date update" },
    });
    const task = await prisma.task.create({
      data: {
        name: "Timed task",
        dueDate: new Date("2026-11-24T00:00:00.000Z"),
        projectId: project.id,
      },
    });

    const updateResponse = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ dueAt: "2026-12-01T09:15:00-05:00" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(updateResponse.status).toBe(200);
    expect(await updateResponse.json()).toMatchObject({
      dueDate: null,
      dueAt: "2026-12-01T14:15:00.000Z",
    });

    const clearResponse = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ dueAt: null }),
      headers: { "Content-Type": "application/json" },
    });
    expect(clearResponse.status).toBe(200);
    expect(await clearResponse.json()).toMatchObject({
      dueDate: null,
      dueAt: null,
    });
  });

  test("should append a newly created task to its status column", async () => {
    const project = await prisma.project.create({ data: { name: "Project" } });
    await prisma.task.create({
      data: { name: "Existing task", projectId: project.id, position: 0 },
    });

    const response = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify({ name: "New task", projectId: project.id }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      position: 1,
      status: "todo",
    });
  });

  test("should append a status change to the destination column", async () => {
    const project = await prisma.project.create({ data: { name: "Project" } });
    await prisma.task.createMany({
      data: [
        {
          name: "Existing done task 1",
          status: "done",
          position: 0,
          projectId: project.id,
        },
        {
          name: "Existing done task 2",
          status: "done",
          position: 1,
          projectId: project.id,
        },
      ],
    });
    const task = await prisma.task.create({
      data: { name: "Task", projectId: project.id, position: 0 },
    });

    const response = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "done" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: task.id,
      name: task.name,
      projectId: project.id,
      status: "done",
      position: 2,
    });
  });

  test("should persist task order and status for every project task", async () => {
    const project = await prisma.project.create({ data: { name: "Project" } });
    const [firstTodo, secondTodo, inProgress, done] = await Promise.all([
      prisma.task.create({
        data: { name: "First todo", projectId: project.id, position: 0 },
      }),
      prisma.task.create({
        data: { name: "Second todo", projectId: project.id, position: 1 },
      }),
      prisma.task.create({
        data: {
          name: "In progress",
          status: "in_progress",
          position: 0,
          projectId: project.id,
        },
      }),
      prisma.task.create({
        data: {
          name: "Done",
          status: "done",
          position: 0,
          projectId: project.id,
        },
      }),
    ]);

    const response = await app.request("/tasks/reorder", {
      method: "PATCH",
      body: JSON.stringify({
        projectId: project.id,
        orderedTaskIdsByStatus: {
          todo: [secondTodo.id, done.id],
          in_progress: [firstTodo.id],
          done: [inProgress.id],
        },
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(200);
    const tasks = (await response.json()) as Array<{
      id: number;
      status: string;
      position: number;
    }>;
    expect(tasks.find((task) => task.id === secondTodo.id)).toMatchObject({
      status: "todo",
      position: 0,
    });
    expect(tasks.find((task) => task.id === done.id)).toMatchObject({
      status: "todo",
      position: 1,
    });
    expect(tasks.find((task) => task.id === firstTodo.id)).toMatchObject({
      status: "in_progress",
      position: 0,
    });
    expect(tasks.find((task) => task.id === inProgress.id)).toMatchObject({
      status: "done",
      position: 0,
    });
  });

  test("should reject duplicate task IDs in a board order", async () => {
    const project = await prisma.project.create({ data: { name: "Project" } });
    const task = await prisma.task.create({
      data: { name: "Task", projectId: project.id },
    });

    const response = await app.request("/tasks/reorder", {
      method: "PATCH",
      body: JSON.stringify({
        projectId: project.id,
        orderedTaskIdsByStatus: {
          todo: [task.id],
          in_progress: [task.id],
          done: [],
        },
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(400);
  });

  test("should reject a stale board task list without changing tasks", async () => {
    const project = await prisma.project.create({ data: { name: "Project" } });
    const task = await prisma.task.create({
      data: { name: "Task", projectId: project.id },
    });

    const response = await app.request("/tasks/reorder", {
      method: "PATCH",
      body: JSON.stringify({
        projectId: project.id,
        orderedTaskIdsByStatus: { todo: [], in_progress: [], done: [] },
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(409);
    expect(
      await prisma.task.findUniqueOrThrow({ where: { id: task.id } }),
    ).toMatchObject({ status: "todo", position: 0 });
  });

  test("should create a task without a description", async () => {
    const project = await prisma.project.create({
      data: { name: "Project without description" },
    });
    const response = await app.request("/tasks", {
      method: "POST",
      body: JSON.stringify({ name: "Task", projectId: project.id }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ description: null });
  });

  test("should update and clear a task description", async () => {
    const project = await prisma.project.create({ data: { name: "Project" } });
    const task = await prisma.task.create({
      data: {
        name: "Task with description",
        projectId: project.id,
        description: "Initial context",
      },
    });

    const updateResponse = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ description: "Updated context" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(updateResponse.status).toBe(200);
    expect(await updateResponse.json()).toMatchObject({
      description: "Updated context",
    });

    const clearResponse = await app.request(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ description: "   " }),
      headers: { "Content-Type": "application/json" },
    });
    expect(clearResponse.status).toBe(200);
    expect(await clearResponse.json()).toMatchObject({ description: null });
  });

  // GET /api/tasks?projectId=ID - List tasks by project.
  test("should list all tasks for a project", async () => {
    const project = await prisma.project.create({
      data: { name: "Project for List" },
    });

    await prisma.task.createMany({
      data: [
        { name: "First task", projectId: project.id },
        { name: "Second task", projectId: project.id },
      ],
    });

    const res = await app.request(`/tasks?projectId=${project.id}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(2);
    expect(json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "First task", projectId: project.id }),
        expect.objectContaining({ name: "Second task", projectId: project.id }),
      ]),
    );
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
