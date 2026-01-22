import { Hono } from "hono";
import { prisma } from "@/lib/prisma";

const healthRoutes = new Hono();

healthRoutes.get("/", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: "ok", database: "connected" });
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ status: "error", database: "disconnected" }, 500);
    }
  }
});

export { healthRoutes };
