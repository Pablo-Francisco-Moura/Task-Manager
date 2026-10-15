import {
  getLocalTasks,
  createLocalTask,
  getLocalProjects,
  reorderLocalTasks,
  createLocalProject,
  deleteLocalProject,
  importLocalWorkspaceData,
} from "./localDataRepository";
import { LOCAL_STORAGE_KEY } from "@/constants/localData";
import { beforeEach, describe, expect, test } from "vitest";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: createMemoryStorage() },
  });
});

describe("local data repository", () => {
  test("persists project and task data locally and hydrates dates", () => {
    const project = createLocalProject({ name: "  Personal  " });
    const dueAt = new Date("2026-11-24T14:30:00.000Z");
    const task = createLocalTask({
      name: "  Review plan  ",
      projectId: project.id,
      dueAt,
      status: "in_progress",
      priority: "high",
    });

    expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toContain(
      '"name":"Personal"',
    );
    expect(getLocalProjects()).toMatchObject([{ id: 1, name: "Personal" }]);
    expect(getLocalTasks(project.id)).toMatchObject([
      {
        id: task.id,
        name: "Review plan",
        dueAt,
        status: "in_progress",
        priority: "high",
      },
    ]);
    expect(getLocalTasks(project.id)[0].dueAt).toBeInstanceOf(Date);
  });

  test("deletes a project and its tasks while keeping IDs increasing", () => {
    const firstProject = createLocalProject({ name: "First" });
    createLocalTask({ name: "Task", projectId: firstProject.id });

    deleteLocalProject(firstProject.id);
    const nextProject = createLocalProject({ name: "Second" });

    expect(getLocalProjects()).toMatchObject([
      { id: nextProject.id, name: "Second" },
    ]);
    expect(nextProject.id).toBe(firstProject.id + 1);
    expect(getLocalTasks(firstProject.id)).toEqual([]);
  });

  test("persists task status ordering and rejects stale board lists", () => {
    const project = createLocalProject({ name: "Board" });
    const firstTask = createLocalTask({ name: "First", projectId: project.id });
    const secondTask = createLocalTask({
      name: "Second",
      projectId: project.id,
    });

    const reordered = reorderLocalTasks({
      projectId: project.id,
      orderedTaskIdsByStatus: {
        todo: [secondTask.id],
        in_progress: [firstTask.id],
        done: [],
      },
    });

    expect(reordered).toMatchObject([
      { id: firstTask.id, status: "in_progress", position: 0 },
      { id: secondTask.id, status: "todo", position: 0 },
    ]);
    expect(() =>
      reorderLocalTasks({
        projectId: project.id,
        orderedTaskIdsByStatus: {
          todo: [firstTask.id],
          in_progress: [],
          done: [],
        },
      }),
    ).toThrow("Task list changed; reload the board");
  });

  test("imports local projects and tasks into the account workspace while preserving relations", async () => {
    const project = createLocalProject({
      name: "Personal",
      description: "Initial project",
    });
    const task = createLocalTask({
      name: "Review plan",
      projectId: project.id,
      description: "Important follow-up",
      status: "in_progress",
      priority: "high",
      dueDate: new Date("2026-11-24T00:00:00.000Z"),
    });

    const createdProjects: Array<{ id: number; name: string; description: string | null }> = [];
    const createdTasks: Array<{
      name: string;
      projectId: number;
      description: string | null;
      dueDate: Date | null;
      status: string;
      priority: string;
      position: number;
    }> = [];

    const result = await importLocalWorkspaceData({
      createProject: async ({ name, description }) => {
        const created = {
          id: createdProjects.length + 101,
          name,
          description,
        };
        createdProjects.push(created);
        return created;
      },
      createTask: async ({ name, projectId, description, dueDate, status, priority, position }) => {
        const created = {
          name,
          projectId,
          description,
          dueDate,
          status,
          priority,
          position,
        };
        createdTasks.push(created);
        return created;
      },
    });

    expect(result).toEqual({ projectCount: 1, taskCount: 1 });
    expect(createdProjects).toEqual([
      {
        id: 101,
        name: "Personal",
        description: "Initial project",
      },
    ]);
    expect(createdTasks).toEqual([
      {
        name: "Review plan",
        projectId: 101,
        description: "Important follow-up",
        dueDate: new Date("2026-11-24T00:00:00.000Z"),
        status: "in_progress",
        priority: "high",
        position: 0,
      },
    ]);
  });
});
