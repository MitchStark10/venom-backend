import {
  Prisma,
  RecurringScheduleCadence,
  Task,
  TaskTag,
} from "@prisma/client";
import { extendedPrisma } from "../lib/extendedPrisma";

interface TaskParam
  extends Omit<
    Prisma.TaskGetPayload<{
      include: { recurringSchedule: true; list: true; taskTag: true };
    }>,
    "dueDate"
  > {
  dueDate: string | null;
}

interface NewTaskToCreate extends Omit<Task, "id"> {
  id: undefined; // This will be set to undefined to create a new task
}

export const createNextTaskForRecurringSchedule = async (task: TaskParam) => {
  if (!task.recurringSchedule || !task.dueDate || !task.isCompleted) {
    return;
  }

  console.log("Creating next task for recurring schedule:", task);

  const nextTask: NewTaskToCreate = {
    ...task,
    id: undefined,
    dueDate: null,
  };

  if (task.recurringSchedule.cadence === RecurringScheduleCadence.DAILY) {
    nextTask.dueDate = new Date(
      new Date(task.dueDate).getTime() + 24 * 60 * 60 * 1000
    );
  } else if (
    task.recurringSchedule.cadence === RecurringScheduleCadence.WEEKLY
  ) {
    nextTask.dueDate = new Date(
      new Date(task.dueDate).getTime() + 7 * 24 * 60 * 60 * 1000
    );
  } else if (
    task.recurringSchedule.cadence === RecurringScheduleCadence.MONTHLY
  ) {
    const nextDate = new Date(task.dueDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextTask.dueDate = nextDate;
  } else if (
    task.recurringSchedule.cadence === RecurringScheduleCadence.YEARLY
  ) {
    const nextDate = new Date(task.dueDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    nextTask.dueDate = nextDate;
  }

  const taskToCreate = {
    ...nextTask,
    dateCompleted: null,
    taskTag: undefined,
    list: undefined,
    isCompleted: false,
    recurringSchedule: undefined,
    tagIds: undefined,
  };

  console.log("Task to create:", taskToCreate);

  // Assuming you have a function to save the task to the database
  await extendedPrisma.task.create({
    data: taskToCreate,
  });

  // Re-create the task tag for the new task
  if (task.taskTag?.length > 0) {
    await extendedPrisma.taskTag.createMany({
      data: task.taskTag.map((taskTag: TaskTag) => ({
        taskId: task.id,
        tagId: taskTag.tagId,
      })),
    });
  }

  console.log("Preparing to update recurring schedule with new task ID", {
    recurringScheduleId: task.recurringSchedule.id,
    nextTaskId: nextTask.id,
  });

  // Update the recurring schedule to point to the new task
  const updatedRecurringSchedule =
    await extendedPrisma.recurringSchedule.update({
      where: { id: task.recurringSchedule.id },
      data: {
        taskId: nextTask.id,
      },
    });

  console.log("Recurring schedule updated:", updatedRecurringSchedule);

  return nextTask;
};
