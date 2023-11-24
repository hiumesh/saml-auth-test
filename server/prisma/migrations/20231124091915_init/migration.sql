/*
  Warnings:

  - Added the required column `login_url` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logout_url` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "login_url" TEXT NOT NULL,
ADD COLUMN     "logout_url" TEXT NOT NULL;
