import {
  parseName,
  readJsonObject,
  projectCreateSchema,
  projectUpdateSchema,
  normalizeDescription,
  parsePositiveIntegerString,
  projectCreateOpenApiSchema,
  projectUpdateOpenApiSchema,
} from "@/server/validation";
import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";
import type { TypeSessionEnv } from "@/server/session";

const projectRoutes = new Hono<TypeSessionEnv>();

// POST /api/project - Create new project.
projectRoutes.post(
  "/",
  describeRoute({
    tags: ["Project"],
    summary: "Create new project",
    requestBody: {
      content: {
        "application/json": { schema: projectCreateOpenApiSchema },
      },
    },
    responses: {
      201: { description: "Project created" },
    },
  }),
  async (c) => {
    const body = await readJsonObject(c.req);
    if (!body) {
      return c.json({ error: "Invalid project payload" }, 400);
    }
    const parsedBody = projectCreateSchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: "Invalid project payload" }, 400);
    }
    const name = parseName(parsedBody.data.name);
    if (name === null) {
      return c.json({ error: "name must be a non-empty string" }, 400);
    }
    const project = await prisma.project.create({
      data: {
        name,
        description: normalizeDescription(parsedBody.data.description),
        workspaceId: c.get("workspaceId"),
        createdById: c.get("userId"),
      },
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
      where: { workspaceId: c.get("workspaceId") },
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
    const id = parsePositiveIntegerString(c.req.param("id"));
    if (id === null) {
      return c.json({ error: "id must be a positive integer" }, 400);
    }

    try {
      const deleted = await prisma.project.deleteMany({
        where: { id, workspaceId: c.get("workspaceId") },
      });
      if (deleted.count === 0) {
        return c.json({ error: "Project not found" }, 404);
      }

      return c.json({ message: "Project deleted successfully" });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return c.json({ error: "Project not found" }, 404);
      }
      throw error;
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
        "application/json": { schema: projectUpdateOpenApiSchema },
      },
    },
    responses: {
      200: { description: "Project updated" },
      404: { description: "Project not found or error updating" },
    },
  }),
  async (c) => {
    const id = parsePositiveIntegerString(c.req.param("id"));
    if (id === null) {
      return c.json({ error: "id must be a positive integer" }, 400);
    }
    const body = await readJsonObject(c.req);
    if (!body) {
      return c.json({ error: "Invalid project payload" }, 400);
    }
    const parsedBody = projectUpdateSchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: "Invalid project payload" }, 400);
    }
    const { name, description } = parsedBody.data;
    if (name === undefined && description === undefined) {
      return c.json(
        { error: "At least one valid project field is required" },
        400,
      );
    }
    const updateData: Prisma.ProjectUpdateInput = {};
    if (name !== undefined) {
      const parsedName = parseName(name);
      if (parsedName === null) {
        return c.json({ error: "name must be a non-empty string" }, 400);
      }
      updateData.name = parsedName;
    }
    if (description !== undefined) {
      updateData.description = normalizeDescription(description);
    }
    try {
      const updated = await prisma.project.updateMany({
        where: { id, workspaceId: c.get("workspaceId") },
        data: updateData,
      });
      if (updated.count === 0) {
        return c.json({ error: "Project not found" }, 404);
      }
      const updatedProject = await prisma.project.findFirstOrThrow({
        where: { id, workspaceId: c.get("workspaceId") },
      });
      return c.json(updatedProject, 200);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return c.json({ error: "Project not found" }, 404);
      }
      throw error;
    }
  },
);

export { projectRoutes };
