import { AutoDeleteTasksOptions } from "@prisma/client";
import express from "express";
import { extendedPrisma } from "../lib/extendedPrisma";
const app = express();

const select = {
  id: true,
  autoDeleteTasks: true,
  email: true,
  dailyReportIgnoreWeekends: true,
};

const autoDeleteTasksValueToEnumMap: Record<any, AutoDeleteTasksOptions> = {
  "-1": AutoDeleteTasksOptions.NEVER,
  "7": AutoDeleteTasksOptions.ONE_WEEK,
  "14": AutoDeleteTasksOptions.TWO_WEEKS,
  "30": AutoDeleteTasksOptions.ONE_MONTH,
};

const autoDeleteTasksEnumToValueMap: Record<AutoDeleteTasksOptions, string> = {
  [AutoDeleteTasksOptions.NEVER]: "-1",
  [AutoDeleteTasksOptions.ONE_WEEK]: "7",
  [AutoDeleteTasksOptions.TWO_WEEKS]: "14",
  [AutoDeleteTasksOptions.ONE_MONTH]: "30",
};

const normalizeUser = (
  user: { id: number; autoDeleteTasks: AutoDeleteTasksOptions } | null
) => ({
  ...user,
  autoDeleteTasks: user
    ? autoDeleteTasksEnumToValueMap[user.autoDeleteTasks]
    : null,
});

app.get("/", async (req, res) => {
  const user = await extendedPrisma.user.findFirst({
    where: {
      id: req.userId,
    },
    select,
  });

  res.status(200).json(normalizeUser(user));
});

app.put("/", async (req, res) => {
  const { autoDeleteTasks, standupListIds, listsToShowCompletedTasksFor, dailyReportIgnoreWeekends } =
    req.body;

  const autoDeleteTasksEnumValue =
    autoDeleteTasksValueToEnumMap[autoDeleteTasks];

  if (!autoDeleteTasksEnumValue) {
    return res.status(400).json({
      error: "Invalid autoDeleteTasks value.",
    });
  }

  const user = await extendedPrisma.user.update({
    where: {
      id: req.userId,
    },
    data: {
      autoDeleteTasks: autoDeleteTasksEnumValue,
      dailyReportIgnoreWeekends,
    },
    select,
  });

  if (standupListIds) {
    await extendedPrisma.list.updateMany({
      where: {
        id: {
          in: standupListIds,
        },
        userId: req.userId,
      },
      data: {
        isStandupList: true,
      },
    });

    await extendedPrisma.list.updateMany({
      where: {
        id: {
          notIn: standupListIds,
        },
        userId: req.userId,
      },
      data: {
        isStandupList: false,
      },
    });
  }

  if (listsToShowCompletedTasksFor) {
    await extendedPrisma.list.updateMany({
      where: {
        id: {
          in: listsToShowCompletedTasksFor,
        },
        userId: req.userId,
      },
      data: {
        showCompletedTasks: true,
      },
    });

    await extendedPrisma.list.updateMany({
      where: {
        id: {
            notIn: listsToShowCompletedTasksFor,
        },
        userId: req.userId,
      },
      data: {
        showCompletedTasks: false,
      },
    });
  }

  res.status(200).json(normalizeUser(user));
});

app.delete("/full-account", async (req, res) => {
  await extendedPrisma.$transaction(async (extendedPrisma) => {
    await extendedPrisma.taskTag.deleteMany({
      where: {
        task: {
          list: {
            userId: req.userId,
          },
        },
      },
    });

    await extendedPrisma.tag.deleteMany({
      where: {
        userId: req.userId,
      },
    });

    await extendedPrisma.task.deleteMany({
      where: {
        list: {
          userId: req.userId,
        },
      },
    });

    await extendedPrisma.list.deleteMany({
      where: {
        userId: req.userId,
      },
    });

    await extendedPrisma.user.delete({
      where: {
        id: req.userId,
      },
    });
  });

  res.status(204).end();
});

module.exports = app;
