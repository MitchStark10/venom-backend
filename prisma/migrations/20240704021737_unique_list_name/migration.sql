/*
  Warnings:

  - A unique constraint covering the columns `[listName]` on the table `List` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "List_listName_key" ON "List"("listName");
