import {Prisma, RecurringScheduleCadence, Task} from "@prisma/client";
import {extendedPrisma} from "../lib/extendedPrisma";


interface TaskParam extends Omit<Prisma.TaskGetPayload<{ include: { recurringSchedule: true } }>,  'dueDate'> {
  dueDate: string | null;
}

interface NewTaskToCreate extends Omit<Task, "id" > {
  id: undefined; // This will be set to undefined to create a new task
}

export const createNextTaskForRecurringSchedule = async (
  completedTask: TaskParam
) => {
  if (!completedTask.recurringSchedule 
    || !completedTask.dueDate) {
    throw new Error("Task does not have a recurring schedule or due date");
  }

  const nextTask: NewTaskToCreate = {
    ...completedTask,
    id: undefined,
    dueDate: null,
  };

  if (completedTask.recurringSchedule.cadence === RecurringScheduleCadence.DAILY) {
    nextTask.dueDate = new Date(
      new Date(completedTask.dueDate).getTime() + 24 * 60 * 60 * 1000
    );
  } else if (completedTask.recurringSchedule.cadence === RecurringScheduleCadence.WEEKLY) {
    nextTask.dueDate = new Date(
      new Date(completedTask.dueDate).getTime() + 7 * 24 * 60 * 60 * 1000
    );
  } else if (completedTask.recurringSchedule.cadence === RecurringScheduleCadence.MONTHLY) {
    const nextDate = new Date(completedTask.dueDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextTask.dueDate = nextDate;
  } else if (completedTask.recurringSchedule.cadence === RecurringScheduleCadence.YEARLY) {
    const nextDate = new Date(completedTask.dueDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    nextTask.dueDate = nextDate;
  }

  // Assuming you have a function to save the task to the database
  await extendedPrisma.task.create({
    data: nextTask,
  });

  return nextTask;
};
