ALTER TABLE "project_activity_read_states"
ADD COLUMN "lastSeenActivityId" INTEGER NOT NULL DEFAULT 0;

UPDATE "project_activity_read_states" AS read_state
SET "lastSeenActivityId" = COALESCE(
    (
        SELECT MAX(activity."id")
        FROM "project_activities" AS activity
        WHERE activity."projectId" = read_state."projectId"
          AND activity."createdAt" <= read_state."lastSeenAt"
    ),
    0
);

INSERT INTO "project_activity_read_states" (
    "projectId",
    "userId",
    "lastSeenActivityId"
)
SELECT
    member."projectId",
    member."userId",
    COALESCE(
        (
            SELECT MAX(activity."id")
            FROM "project_activities" AS activity
            WHERE activity."projectId" = member."projectId"
              AND activity."createdAt" <= member."lastSeenAt"
        ),
        0
    )
FROM "project_members" AS member
ON CONFLICT ("projectId", "userId") DO NOTHING;

INSERT INTO "project_activity_read_states" (
    "projectId",
    "userId",
    "lastSeenActivityId"
)
SELECT
    project."id",
    member."userId",
    COALESCE(
        (
            SELECT MAX(activity."id")
            FROM "project_activities" AS activity
            WHERE activity."projectId" = project."id"
        ),
        0
    )
FROM "projects" AS project
JOIN "workspace_members" AS member
    ON member."workspaceId" = project."workspaceId"
WHERE member."role" = 'owner'
ON CONFLICT ("projectId", "userId") DO NOTHING;
