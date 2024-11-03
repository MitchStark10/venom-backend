import { AutoDeleteTasksOptions } from "@prisma/client";
import { extendedPrisma } from "../lib/extendedPrisma";
import { getDateWithOffset } from "../lib/getTomorrowDate";

const OFFSET_MAP = {
  [AutoDeleteTasksOptions.ONE_WEEK]: -7,
  [AutoDeleteTasksOptions.TWO_WEEKS]: -14,
  [AutoDeleteTasksOptions.ONE_MONTH]: -30,
};

interface Params {
  isDryRun?: boolean;
}

export const autoDeleteTasks = async ({ isDryRun }: Params) => {
  const users = await extendedPrisma.user.findMany({
    where: {
      autoDeleteTasks: {
        not: AutoDeleteTasksOptions.NEVER,
      },
    },
  });

  for (const user of users) {
    if (user.autoDeleteTasks === AutoDeleteTasksOptions.NEVER) {
      console.error("Invalid autoDeleteTasks value", user.autoDeleteTasks);
      continue;
    }

    const dateToCheck = getDateWithOffset(OFFSET_MAP[user.autoDeleteTasks]);

    const taskFilter = {
      userId: user.id,
      completedDate: {
        // TODO: Need to run the migration for this
        lte: dateToCheck,
      },
      isCompleted: true,
    };

    if (isDryRun) {
      const tasks = await extendedPrisma.task.findMany({
        where: taskFilter,
      });

      for (const task of tasks) {
        console.log("Task eligible for deletion", task);
      }
    } else {
      const deletedTasks = await extendedPrisma.task.deleteMany({
        where: taskFilter,
      });
      console.log("Deletion operation completed", deletedTasks);
    }
  }
};
