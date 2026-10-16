-- CreateEnum
CREATE TYPE "WorkspaceInviteStatus" AS ENUM ('pending', 'accepted', 'declined', 'revoked', 'expired');

-- CreateTable
CREATE TABLE "project_members" (
    "projectId" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("projectId", "userId")
);

-- CreateTable
CREATE TABLE "workspace_invites" (
    "id" SERIAL NOT NULL,
    "workspaceId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "status" "WorkspaceInviteStatus" NOT NULL DEFAULT 'pending',
    "projectIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "expiresAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_members_userId_idx"
    ON "project_members"("userId");

-- CreateIndex
CREATE INDEX "workspace_invites_workspaceId_status_idx"
    ON "workspace_invites"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "workspace_invites_targetUserId_status_idx"
    ON "workspace_invites"("targetUserId", "status");

-- AddForeignKey
ALTER TABLE "project_members"
    ADD CONSTRAINT "project_members_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_members"
    ADD CONSTRAINT "project_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_invites"
    ADD CONSTRAINT "workspace_invites_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_invites"
    ADD CONSTRAINT "workspace_invites_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "workspace_invites"
    ADD CONSTRAINT "workspace_invites_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
