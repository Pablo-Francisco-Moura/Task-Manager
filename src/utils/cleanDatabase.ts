import { prisma } from "@/lib/prisma";

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
}
