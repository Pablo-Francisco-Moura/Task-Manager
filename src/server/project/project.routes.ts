import { Hono } from "hono";
import { prisma } from "@/lib/prisma";

const projectRoutes = new Hono();

// POST /api/project - Create new project.
projectRoutes.post("/", async (c) => {
  const { name } = await c.req.json();
  const project = await prisma.project.create({
    data: { name },
  });

  return c.json(project, 201);
});

// GET /api/project - Get all projects with their tasks.
projectRoutes.get("/", async (c) => {
  const projects = await prisma.project.findMany({
    include: { tasks: true },
  });

  return c.json(projects);
});

// DELETE /api/project/:id - Delete project and its linked tasks.
projectRoutes.delete("/:id", async (c) => {
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
});

export { projectRoutes };
