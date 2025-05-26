-- CreateEnum
CREATE TYPE "RecurringScheduleCadence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "RecurringSchedule" (
    "id" SERIAL NOT NULL,
    "cadence" "RecurringScheduleCadence" NOT NULL,
    "taskId" INTEGER NOT NULL,

    CONSTRAINT "RecurringSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecurringSchedule_taskId_key" ON "RecurringSchedule"("taskId");

-- AddForeignKey
ALTER TABLE "RecurringSchedule" ADD CONSTRAINT "RecurringSchedule_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
