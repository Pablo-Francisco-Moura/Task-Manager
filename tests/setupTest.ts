import { prisma } from "@/lib/prisma";
import { execSync } from "child_process";
import { beforeAll, afterAll } from "vitest";

beforeAll(() => {
  execSync("npx prisma migrate reset --force", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
