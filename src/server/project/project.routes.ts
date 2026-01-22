import { prisma } from "@/lib/prisma";
import { Hono } from "hono";

const projectRoutes = new Hono();

projectRoutes.post("/", async (c) => {
  const { name } = await c.req.json();
  const project = await prisma.project.create({
    data: { name },
  });
  return c.json(project, 201);
});

projectRoutes.get("/", async (c) => {
  const projects = await prisma.project.findMany({
    include: { tasks: true },
  });
  return c.json(projects);
});

export { projectRoutes };
