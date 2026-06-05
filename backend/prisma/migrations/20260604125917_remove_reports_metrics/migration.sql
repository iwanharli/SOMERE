/*
  Warnings:

  - You are about to drop the `metrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "metrics" DROP CONSTRAINT "metrics_reportId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_userId_fkey";

-- DropTable
DROP TABLE "metrics";

-- DropTable
DROP TABLE "reports";

-- DropEnum
DROP TYPE "Platform";

-- DropEnum
DROP TYPE "ReportStatus";
