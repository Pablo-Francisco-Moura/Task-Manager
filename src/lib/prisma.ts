import { PrismaClient } from "@prisma/client";

function getDatabaseUrlWithConnectionLimit() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  const url = new URL(databaseUrl);
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "5");
  }
  return url.toString();
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};
const databaseUrl = getDatabaseUrlWithConnectionLimit();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
