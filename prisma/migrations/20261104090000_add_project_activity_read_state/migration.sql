ALTER TABLE "project_members"
ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "project_activity_read_states" (
    "projectId" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_activity_read_states_pkey" PRIMARY KEY ("projectId", "userId")
);

CREATE INDEX "project_activity_read_states_userId_idx"
ON "project_activity_read_states"("userId");

ALTER TABLE "project_activity_read_states"
ADD CONSTRAINT "project_activity_read_states_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_activity_read_states"
ADD CONSTRAINT "project_activity_read_states_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
