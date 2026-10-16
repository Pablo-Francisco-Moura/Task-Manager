ALTER TABLE "users"
ADD COLUMN "username" TEXT,
ADD COLUMN "passwordHash" TEXT;

UPDATE "users"
SET "username" = 'user_' || LEFT(REPLACE("id"::TEXT, '-', ''), 12)
WHERE "kind" = 'account';

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");