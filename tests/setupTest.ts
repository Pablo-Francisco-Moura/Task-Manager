import { execSync } from "child_process";
import { beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

beforeAll(() => {
  execSync("npx prisma migrate reset --force", { stdio: "inherit" });
});

afterAll(async () => {
  await prisma.$disconnect();
});
