import { AutoDeleteTasksOptions } from "@prisma/client";
import express from "express";
import { extendedPrisma } from "../lib/extendedPrisma";
const app = express();

const select = {
  id: true,
  autoDeleteTasks: true,
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
  const { autoDeleteTasks } = req.body;

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
    },
    select,
  });

  res.status(200).json(normalizeUser(user));
});

module.exports = app;

