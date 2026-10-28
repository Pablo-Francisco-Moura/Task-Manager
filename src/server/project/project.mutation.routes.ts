import {
  getWorkspaceRole,
  projectAccessWhere,
} from "@/server/session/projectAccess";
import {
  parseName,
  readJsonObject,
  projectUpdateSchema,
  normalizeDescription,
  parsePositiveIntegerString,
  projectUpdateOpenApiSchema,
} from "@/server/validation";
import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";
import { createProjectActivity } from "@/server/task/taskActivity";
import type { TypeSessionEnv } from "@/server/session";

const routes = new Hono<TypeSessionEnv>();

routes.delete(
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

    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }
    if (role !== "owner") {
      const visibleProject = await prisma.project.findFirst({
        where: {
          id,
          ...projectAccessWhere(workspaceId, userId, role),
        },
        select: { id: true },
      });
      if (!visibleProject) {
        return c.json({ error: "Project not found" }, 404);
      }
      return c.json(
        { error: "Workspace owner required to delete projects" },
        403,
      );
    }

    try {
      const deleted = await prisma.project.deleteMany({
        where: {
          id,
          ...projectAccessWhere(workspaceId, userId, role),
        },
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
routes.patch(
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
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }
    if (role !== "owner") {
      const visibleProject = await prisma.project.findFirst({
        where: {
          id,
          ...projectAccessWhere(workspaceId, userId, role),
        },
        select: { id: true },
      });
      if (!visibleProject) {
        return c.json({ error: "Project not found" }, 404);
      }
      return c.json(
        { error: "Workspace owner required to update projects" },
        403,
      );
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
      const updatedProject = await prisma.$transaction(async (transaction) => {
        const currentProject = await transaction.project.findFirst({
          where: {
            id,
            ...projectAccessWhere(workspaceId, userId, role),
          },
        });
        if (!currentProject) return null;

        const updated = await transaction.project.update({
          where: { id },
          data: updateData,
        });
        const changes: Record<
          string,
          { from: string | null; to: string | null }
        > = {};
        if (name !== undefined && updated.name !== currentProject.name) {
          changes.name = { from: currentProject.name, to: updated.name };
        }
        if (
          description !== undefined &&
          updated.description !== currentProject.description
        ) {
          changes.description = {
            from: currentProject.description,
            to: updated.description,
          };
        }
        if (Object.keys(changes).length) {
          await createProjectActivity(transaction, {
            projectId: id,
            actorId: userId,
            type: "project_updated",
            details: { projectName: updated.name, changes },
          });
        }
        return updated;
      });
      if (!updatedProject) {
        return c.json({ error: "Project not found" }, 404);
      }
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

export { routes as projectMutationRoutes };
