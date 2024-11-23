import { AutoDeleteTasksOptions, Task } from "@prisma/client";
import { extendedPrisma } from "../lib/extendedPrisma";
import { getDateWithOffset } from "../lib/getTomorrowDate";
import { WhereInput } from "../types/prismaHelper";

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

  console.log(`Found ${users.length} users with autoDeleteTasks set`);

  for (const user of users) {
    try {
      console.log("processing user", user.email);
      if (user.autoDeleteTasks === AutoDeleteTasksOptions.NEVER) {
        console.error("Invalid autoDeleteTasks value", user.autoDeleteTasks);
        continue;
      }

      const dateToCheck = getDateWithOffset(OFFSET_MAP[user.autoDeleteTasks]);
      console.log("dateToCheck", dateToCheck);

      const taskFilter: WhereInput<"Task"> = {
        list: {
          userId: user.id,
        },
        dateCompleted: {
          lte: dateToCheck,
        },
        isCompleted: true,
      };

      const tasksToDelete = await extendedPrisma.task.findMany({
        where: taskFilter,
      });

      if (isDryRun) {
        if (!tasksToDelete.length) {
          console.log("No tasks eligible for deletion");
        }

        for (const task of tasksToDelete) {
          console.log("Task eligible for deletion", task);
        }
      } else {
        const deletedTaskTags = await extendedPrisma.taskTag.deleteMany({
          where: {
            taskId: {
              in: tasksToDelete.map((task) => task.id),
            },
          },
        });
        console.log("Deleted task tags", deletedTaskTags);
        const deletedTasks = await extendedPrisma.task.deleteMany({
          where: {
            id: {
              in: tasksToDelete.map((task) => task.id),
            },
          },
        });
        console.log("Deletion operation completed", deletedTasks);
      }
    } catch (error) {
      console.error("Error processing user", user.email, error);
    }
  }
};
