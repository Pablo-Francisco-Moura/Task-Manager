import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";

const projectRoutes = new Hono();

// POST /api/project - Create new project.
projectRoutes.post(
  "/",
  describeRoute({
    tags: ["Project"],
    summary: "Create new project",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { name: { type: "string" } },
            required: ["name"],
          },
        },
      },
    },
    responses: {
      201: { description: "Project created" },
    },
  }),
  async (c) => {
    const { name } = await c.req.json();
    const project = await prisma.project.create({
      data: { name },
    });

    return c.json(project, 201);
  },
);

// GET /api/project - Get all projects with their tasks.
projectRoutes.get(
  "/",
  describeRoute({
    tags: ["Project"],
    summary: "Get all projects with their tasks",
    responses: {
      200: { description: "List of projects" },
    },
  }),
  async (c) => {
    const projects = await prisma.project.findMany({
      include: { tasks: true },
    });

    return c.json(projects);
  },
);

// DELETE /api/project/:id - Delete project and its linked tasks.
projectRoutes.delete(
  "/:id",
  describeRoute({
    tags: ["Project"],
    summary: "Delete project and its linked tasks",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    responses: {
      200: { description: "Project deleted" },
      404: { description: "Project not found or error deleting" },
    },
  }),
  async (c) => {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid ID" }, 400);
    }

    try {
      await prisma.project.delete({
        where: { id },
      });

      return c.json({ message: "Project deleted successfully" });
    } catch (error) {
      return c.json({ error: "Project not found or error deleting" }, 404);
    }
  },
);

// PATCH /api/project/:id - Edit a project by id.
projectRoutes.patch(
  ":id",
  describeRoute({
    tags: ["Project"],
    summary: "Edit a project by id",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { name: { type: "string" } },
            required: ["name"],
          },
        },
      },
    },
    responses: {
      200: { description: "Project updated" },
      404: { description: "Project not found or error updating" },
    },
  }),
  async (c) => {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid ID" }, 400);
    }
    const body = await c.req.json();
    const { name } = body;
    if (!name) {
      return c.json({ error: "name is required" }, 400);
    }
    try {
      const updatedProject = await prisma.project.update({
        where: { id },
        data: { name },
      });
      return c.json(updatedProject, 200);
    } catch (error) {
      return c.json({ error: "Project not found or error updating" }, 404);
    }
  },
);

export { projectRoutes };
