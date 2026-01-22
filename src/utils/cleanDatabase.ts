import { prisma } from "@/lib/prisma";

export async function cleanDatabase() {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  `;

  await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

  try {
    for (const { tablename } of tables) {
      if (tablename !== "_prisma_migrations") {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`
        );
      }
    }
  } finally {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
  }
}
