UPDATE "workspace_invites"
SET "expiresAt" = "createdAt" + INTERVAL '7 days'
WHERE "expiresAt" IS NULL;

ALTER TABLE "workspace_invites"
    ALTER COLUMN "expiresAt" SET NOT NULL;