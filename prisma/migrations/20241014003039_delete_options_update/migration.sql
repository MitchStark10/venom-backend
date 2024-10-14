/*
  Warnings:

  - The values [ONE_DAY] on the enum `AutoDeleteTasksOptions` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AutoDeleteTasksOptions_new" AS ENUM ('NEVER', 'ONE_WEEK', 'TWO_WEEKS', 'ONE_MONTH');
ALTER TABLE "User" ALTER COLUMN "autoDeleteTasks" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "autoDeleteTasks" TYPE "AutoDeleteTasksOptions_new" USING ("autoDeleteTasks"::text::"AutoDeleteTasksOptions_new");
ALTER TYPE "AutoDeleteTasksOptions" RENAME TO "AutoDeleteTasksOptions_old";
ALTER TYPE "AutoDeleteTasksOptions_new" RENAME TO "AutoDeleteTasksOptions";
DROP TYPE "AutoDeleteTasksOptions_old";
ALTER TABLE "User" ALTER COLUMN "autoDeleteTasks" SET DEFAULT 'NEVER';
COMMIT;
