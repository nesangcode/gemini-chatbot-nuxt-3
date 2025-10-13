/*
  Warnings:

  - Added the required column `updatedAt` to the `chat_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add column with temporary default for existing rows
ALTER TABLE "chat_sessions" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows: set updatedAt to the timestamp of their last message, or createdAt if no messages
UPDATE "chat_sessions" cs
SET "updatedAt" = COALESCE(
  (SELECT MAX(m."createdAt") FROM messages m WHERE m."sessionId" = cs.id),
  cs."createdAt"
);

-- AlterTable: Remove the default (Prisma @updatedAt will handle updates)
ALTER TABLE "chat_sessions" ALTER COLUMN "updatedAt" DROP DEFAULT;
