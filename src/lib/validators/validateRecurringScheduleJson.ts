import { RecurringScheduleCadence } from "@prisma/client";

export interface RecurringScheduleRequestJson {
  cadence: RecurringScheduleCadence;
}

export const validateRecurringScheduleJson = (
  data: any
): data is RecurringScheduleRequestJson => {
  if (!data) {
    return false;
  }

  return Object.values(RecurringScheduleCadence).includes(data.cadence);
};
