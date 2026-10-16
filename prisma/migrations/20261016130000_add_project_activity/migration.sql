CREATE TYPE "ProjectActivityType" AS ENUM (
    'task_created',
    'task_updated',
    'task_moved',
    'task_deleted',
    'comment'
);

CREATE TABLE "project_activities" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "taskId" INTEGER,
    "actorId" UUID NOT NULL,
    "actorName" TEXT NOT NULL,
    "type" "ProjectActivityType" NOT NULL,
    "taskName" TEXT,
    "content" TEXT,
    "details" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_activities_projectId_createdAt_idx"
    ON "project_activities"("projectId", "createdAt");
CREATE INDEX "project_activities_taskId_idx"
    ON "project_activities"("taskId");

ALTER TABLE "project_activities"
    ADD CONSTRAINT "project_activities_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_activities"
    ADD CONSTRAINT "project_activities_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_activities"
    ADD CONSTRAINT "project_activities_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;