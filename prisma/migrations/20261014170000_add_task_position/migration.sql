ALTER TABLE "tasks"
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

WITH ranked_tasks AS (
  SELECT
    "id",
    (ROW_NUMBER() OVER (
      PARTITION BY "projectId", "status"
      ORDER BY "createdAt", "id"
    ) - 1)::INTEGER AS "position"
  FROM "tasks"
)
UPDATE "tasks" AS task
SET "position" = ranked_tasks."position"
FROM ranked_tasks
WHERE task."id" = ranked_tasks."id";