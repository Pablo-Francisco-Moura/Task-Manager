import type { Prisma } from "@prisma/client";

type ActivityClient = Pick<
  Prisma.TransactionClient,
  "projectActivity" | "user"
>;

interface ICreateProjectActivityInput {
  type:
    | "task_created"
    | "task_updated"
    | "task_moved"
    | "task_deleted"
    | "comment";
  actorId: string;
  projectId: number;
  taskId?: number | null;
  content?: string;
  details?: Record<string, unknown>;
  taskName?: string | null;
}

export async function createProjectActivity(
  client: ActivityClient,
  input: ICreateProjectActivityInput,
) {
  const actor = await client.user.findUnique({
    where: { id: input.actorId },
    select: { displayName: true, username: true },
  });

  return client.projectActivity.create({
    data: {
      projectId: input.projectId,
      taskId: input.taskId,
      taskName: input.taskName,
      actorId: input.actorId,
      actorName: actor?.displayName || actor?.username || "Unknown user",
      type: input.type,
      content: input.content,
      ...(input.details
        ? { details: input.details as Prisma.InputJsonValue }
        : {}),
    },
  });
}
