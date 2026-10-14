CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'done');

ALTER TABLE "tasks"
ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'todo';