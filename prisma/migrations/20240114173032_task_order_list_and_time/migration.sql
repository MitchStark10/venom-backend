/*
  Warnings:

  - You are about to drop the column `order` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "order",
ADD COLUMN     "listViewOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timeViewOrder" INTEGER NOT NULL DEFAULT 0;
