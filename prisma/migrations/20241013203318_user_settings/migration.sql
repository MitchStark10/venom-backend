-- CreateEnum
CREATE TYPE "AutoDeleteTasksOptions" AS ENUM ('NEVER', 'ONE_DAY', 'ONE_WEEK', 'ONE_MONTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoDeleteTasks" "AutoDeleteTasksOptions" NOT NULL DEFAULT 'NEVER';

-- RenameForeignKey
ALTER TABLE "List" RENAME CONSTRAINT "List_userId_fkey" TO "List_userId_userLists_fkey";
