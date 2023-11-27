/*
  Warnings:

  - A unique constraint covering the columns `[refresh_token]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Made the column `refresh_token` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "refresh_token" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Session_refresh_token_key" ON "Session"("refresh_token");
