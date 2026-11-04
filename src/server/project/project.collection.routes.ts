import {
  getWorkspaceRole,
  projectAccessWhere,
} from "@/server/session/projectAccess";
import {
  parseName,
  readJsonObject,
  projectCreateSchema,
  normalizeDescription,
  projectCreateOpenApiSchema,
} from "@/server/validation";
import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { describeRoute } from "hono-openapi";
import { createProjectActivity } from "@/server/task/taskActivity";
import type { TypeSessionEnv } from "@/server/session";

const routes = new Hono<TypeSessionEnv>();

routes.post(
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
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (role !== "owner") {
      return c.json(
        { error: "Workspace owner required to create projects" },
        403,
      );
    }

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
    const project = await prisma.$transaction(async (transaction) => {
      const createdProject = await transaction.project.create({
        data: {
          name,
          description: normalizeDescription(parsedBody.data.description),
          workspaceId,
          createdById: userId,
        },
      });
      const activity = await createProjectActivity(transaction, {
        projectId: createdProject.id,
        actorId: userId,
        type: "project_created",
        details: { projectName: createdProject.name },
      });
      const workspaceOwners = await transaction.workspaceMember.findMany({
        where: { workspaceId, role: "owner" },
        select: { userId: true },
      });
      if (workspaceOwners.length) {
        await transaction.projectActivityReadState.createMany({
          data: workspaceOwners.map(({ userId: ownerId }) => ({
            projectId: createdProject.id,
            userId: ownerId,
            lastSeenActivityId: activity.id,
          })),
          skipDuplicates: true,
        });
      }
      return createdProject;
    });

    return c.json(project, 201);
  },
);

// GET /api/project - Get all projects with their tasks.
routes.get(
  "/",
  describeRoute({
    tags: ["Project"],
    summary: "Get all projects with their tasks",
    responses: {
      200: { description: "List of projects" },
    },
  }),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const role = await getWorkspaceRole(prisma, workspaceId, userId);
    if (!role) {
      return c.json({ error: "Workspace membership required" }, 403);
    }

    const projects = await prisma.project.findMany({
      where: projectAccessWhere(workspaceId, userId, role),
      include: { tasks: true },
    });

    return c.json(projects);
  },
);

export { routes as projectCollectionRoutes };
