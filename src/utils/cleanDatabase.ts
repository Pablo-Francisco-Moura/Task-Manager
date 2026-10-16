import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";
import { TEST_GUEST_IDENTITY } from "@/constants/testGuest";

export async function cleanDatabase() {
  // Detects the current schema from DATABASE_URL.
  const schemaMatch = process.env.DATABASE_URL?.match(/schema=([^&]+)/);
  const schema = schemaMatch ? schemaMatch[1] : "public";

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
