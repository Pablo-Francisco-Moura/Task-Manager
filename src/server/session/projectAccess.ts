import type { Prisma } from "@prisma/client";
import type { WorkspaceRole } from "@prisma/client";

type ProjectAccessClient = Pick<Prisma.TransactionClient, "workspaceMember">;

export async function getWorkspaceRole(
  client: ProjectAccessClient,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole | null> {
  const membership = await client.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}

export function projectAccessWhere(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Prisma.ProjectWhereInput {
  return {
    workspaceId,
    ...(role === "owner" ? {} : { projectMembers: { some: { userId } } }),
  };
}
