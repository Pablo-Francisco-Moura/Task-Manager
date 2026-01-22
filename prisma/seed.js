import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

async function main() {
  const project1 = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Project Alpha",
      tasks: {
        create: [{ name: "Setup database" }, { name: "Create API endpoints" }],
      },
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Project Beta",
      tasks: {
        create: [{ name: "Design UI" }, { name: "Implement authentication" }],
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
