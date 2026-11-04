import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";
import { TEST_GUEST_IDENTITY } from "@/constants/testGuest";

export async function cleanDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Refusing to clean database: DATABASE_URL is missing.");
  }
  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error("Refusing to clean database: DATABASE_URL is invalid.");
  }
  if (decodeURIComponent(parsedDatabaseUrl.pathname.slice(1)) !== "test_db") {
    throw new Error(
      "Refusing to clean database: only the dedicated test_db database can be truncated.",
    );
  }
  if (
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(
      parsedDatabaseUrl.hostname.toLowerCase(),
    )
  ) {
    throw new Error(
      "Refusing to clean database: only a local test_db database can be truncated.",
    );
  }
  if (!["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)) {
    throw new Error(
      "Refusing to clean database: DATABASE_URL must use PostgreSQL.",
    );
  }
  const schema = parsedDatabaseUrl.searchParams.get("schema") ?? "public";
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new Error("Refusing to clean database: schema name is invalid.");
  }

  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = ${schema}
  `;

  await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

  try {
    for (const { tablename } of tables) {
      if (tablename !== "_prisma_migrations") {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${schema}"."${tablename}" RESTART IDENTITY CASCADE;`,
        );
      }
    }
  } finally {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
  }

  await prisma.user.create({
    data: {
      id: TEST_GUEST_IDENTITY.userId,
      displayName: "Test Guest",
      kind: "guest",
    },
  });
  await prisma.workspace.create({
    data: {
      id: TEST_GUEST_IDENTITY.workspaceId,
      name: "Test Workspace",
      kind: "personal",
      members: {
        create: {
          userId: TEST_GUEST_IDENTITY.userId,
          role: "owner",
        },
      },
    },
  });
  await prisma.session.create({
    data: {
      userId: TEST_GUEST_IDENTITY.userId,
      workspaceId: TEST_GUEST_IDENTITY.workspaceId,
      tokenHash: createHash("sha256")
        .update(TEST_GUEST_IDENTITY.sessionToken)
        .digest("hex"),
      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
    },
  });
}
