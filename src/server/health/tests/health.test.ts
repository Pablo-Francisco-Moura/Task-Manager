import { Hono } from "hono";
import { healthRoutes } from "../heath.routes";
import { expect, test, describe, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const app = new Hono();
app.route("/health", healthRoutes);

describe("Health Check API", () => {
  test("should return status ok when database is connected", async () => {
    const res = await app.request("health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", database: "connected" });
  });

  test("should return status error when database is disconnected", async () => {
    vi.spyOn(prisma, "$queryRaw").mockRejectedValue(new Error("DB down"));

    const res = await app.request("health");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      status: "error",
      database: "disconnected",
    });
  });
});
