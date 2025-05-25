import { extendedPrisma } from "../lib/extendedPrisma";
import { RecurringScheduleRequestJson } from "../lib/validators/validateRecurringScheduleJson";

export const updateRecurringSchedule = async (
  taskId: number,
  recurringSchedule: RecurringScheduleRequestJson
) => {
  const existingRecurringSchedule =
    await extendedPrisma.recurringSchedule.findFirst({
      where: {
        taskId: taskId,
      },
    });

  if (existingRecurringSchedule) {
    await extendedPrisma.recurringSchedule.update({
      where: {
        id: existingRecurringSchedule.id,
      },
      data: {
        pivots: recurringSchedule.pivots,
        cadence: recurringSchedule.cadence,
      },
    });
  } else {
    await extendedPrisma.recurringSchedule.create({
      data: {
        taskId: taskId,
        pivots: recurringSchedule.pivots,
        cadence: recurringSchedule.cadence,
      },
    });
  }
};
