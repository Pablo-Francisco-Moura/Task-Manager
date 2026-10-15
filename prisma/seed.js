import { PrismaClient } from "@prisma/client";
import { SEED_USER_ID, SEED_WORKSPACE_ID } from "../src/constants/seed.js";

export const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: SEED_USER_ID },
    update: {},
    create: {
      id: SEED_USER_ID,
      displayName: "Seed Owner",
      kind: "account",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: SEED_WORKSPACE_ID },
    update: {},
    create: {
      id: SEED_WORKSPACE_ID,
      name: "Seed Workspace",
      kind: "personal",
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  const project1 = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Project Alpha",
      workspaceId: workspace.id,
      createdById: user.id,
      tasks: {
        create: [
          { name: "Setup database", createdById: user.id },
          { name: "Create API endpoints", createdById: user.id },
        ],
      },
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Project Beta",
      workspaceId: workspace.id,
      createdById: user.id,
      tasks: {
        create: [
          { name: "Design UI", createdById: user.id },
          { name: "Implement authentication", createdById: user.id },
        ],
      },
    },
  });

  console.log({ project1, project2 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
