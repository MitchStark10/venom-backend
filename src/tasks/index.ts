import { Prisma } from "@prisma/client";
import express from "express";
import { addOverdueTagToTasks } from "../lib/addOverdueTagToTasks";
import { extendedPrisma } from "../lib/extendedPrisma";
import { getDayWithoutTime } from "../lib/getDayWithoutTime";
import { getDateWithOffset, getTomorrowDate } from "../lib/getTomorrowDate";
import { isNullOrUndefined } from "../lib/isNullOrUndefined";
import { validateRecurringScheduleJson } from "../lib/validators/validateRecurringScheduleJson";
import { createNextTaskForRecurringSchedule } from "./createNextTaskForRecurringSchedule";
import { updateRecurringSchedule } from "./updateRecurringSchedule";

const includeOnTask = {
  list: {
    select: {
      id: true,
      listName: true,
      userId: true,
      isStandupList: true,
      order: true,
    },
  },
  taskTag: {
    include: {
      tag: true,
    },
  },
  recurringSchedule: true,
};

export const updateTask = async (
  userId: number,
  taskId: number,
  taskData: {
    listId?: number;
    taskName?: string;
    dueDate?: string;
    isCompleted?: boolean;
    tagIds?: number[];
    dateCompleted?: string;
    recurringSchedule?: any;
  }
) => {
  const {
    listId,
    taskName,
    dueDate,
    isCompleted,
    tagIds,
    dateCompleted,
    recurringSchedule,
  } = taskData;

  const filteredTagIds = tagIds?.filter((tagId: number) => tagId >= 0) || [];

  if (!taskName && !dueDate) {
    throw new Error("taskName or dueDate is required");
  }

  if (recurringSchedule) {
    if (!validateRecurringScheduleJson(recurringSchedule)) {
      throw new Error("recurringSchedule is not valid");
    }

    await updateRecurringSchedule(Number(taskId), recurringSchedule);
  }

  const initialTaskBeforeSave = await extendedPrisma.task.findFirst({
    where: {
      id: Number(taskId),
    },
    include: includeOnTask,
  });

  if (!initialTaskBeforeSave) {
    throw new Error("Task not found.");
  }

  if (initialTaskBeforeSave.recurringSchedule && !recurringSchedule) {
    console.log("Deleting recurring schedule for task:", taskId);
    await extendedPrisma.recurringSchedule.delete({
      where: {
        id: initialTaskBeforeSave.recurringSchedule.id,
      },
    });
  }

  const task = await extendedPrisma.task.update({
    where: {
      id: Number(taskId),
      list: {
        userId: userId,
      },
    },
    data: {
      listId: listId ? Number(listId) : undefined,
      taskName,
      dueDate: dueDate ? new Date(dueDate) : dueDate,
      isCompleted,
      dateCompleted: dateCompleted ? new Date(dateCompleted) : null,
    },
    include: includeOnTask,
  });

  await extendedPrisma.taskTag.deleteMany({
    where: {
      taskId: task.id,
    },
  });

  if (filteredTagIds?.length > 0) {
    await extendedPrisma.taskTag.createMany({
      data: filteredTagIds.map((tagId: number) => ({
        taskId: task.id,
        tagId,
      })),
    });
  }

  const user = await extendedPrisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  await createNextTaskForRecurringSchedule(
    task,
    Boolean(user?.dailyReportIgnoreWeekends)
  );

  return task;
};

export const createTask = async (
  userId: number,
  taskData: {
    taskName: string;
    listId: number;
    dueDate?: string;
    tagIds?: number[];
    recurringSchedule?: any;
  }
) => {
  const { taskName, listId, dueDate, tagIds, recurringSchedule } = taskData;

  if (!taskName || !listId) {
    throw new Error("taskName or listid is required");
  }

  const associatedList = await extendedPrisma.list.findFirst({
    where: {
      id: Number(listId),
      userId: userId,
    },
    include: {
      tasks: true,
    },
  });

  if (!associatedList) {
    throw new Error("list not found");
  }

  const task = await extendedPrisma.task.create({
    data: {
      taskName,
      listId,
      dueDate: dueDate ? new Date(dueDate) : null,
      listViewOrder: -1,
      combinedViewOrder: -1,
    },
  });

  if (tagIds && tagIds.length > 0) {
    await extendedPrisma.taskTag.createMany({
      data: tagIds.map((tagId: number) => ({
        taskId: task.id,
        tagId,
      })),
    });
  }

  if (validateRecurringScheduleJson(recurringSchedule)) {
    await extendedPrisma.recurringSchedule.create({
      data: {
        taskId: task.id,
        cadence: recurringSchedule.cadence,
      },
    });
  }

  return task;
};

export const getTasksByList = async (userId: number, listId: number) => {
  const list = await extendedPrisma.list.findFirst({
    where: {
      id: listId,
      userId: userId,
    },
  });

  if (!list) {
    throw new Error("List not found");
  }

  return extendedPrisma.task.findMany({
    where: {
      listId: listId,
      isCompleted: false,
    },
    include: includeOnTask,
  });
};

export const getTodaysTasks = async (userId: number, clientDate: string) => {
  const lt = getDayWithoutTime(getTomorrowDate(clientDate));
  const taskList = await extendedPrisma.task.findMany({
    where: {
      isCompleted: false,
      dueDate: {
        lt,
      },
      list: {
        userId,
      },
    },
    orderBy: {
      listViewOrder: "asc",
    },
    include: includeOnTask,
  });

  const taskListWithOverdueTags = addOverdueTagToTasks(taskList, clientDate);

  return taskListWithOverdueTags;
};

export const getCompletedTasks = async (userId: number) => {
  return extendedPrisma.task.findMany({
    where: {
      isCompleted: true,
      list: {
        userId: userId,
      },
    },
    orderBy: {
      combinedViewOrder: "asc",
    },
    include: includeOnTask,
  });
};

export const getUpcomingTasks = async (userId: number, clientDate: string) => {
  const tomorrowDate = getDayWithoutTime(getTomorrowDate(clientDate));
  return extendedPrisma.task.findMany({
    where: {
      isCompleted: false,
      dueDate: {
        gte: tomorrowDate,
      },
      list: {
        userId: userId,
      },
    },
    orderBy: {
      combinedViewOrder: "asc",
    },
    include: includeOnTask,
  });
};

export const getStandupTasks = async (userId: number, clientDate: string) => {
  const user = await extendedPrisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  const isTodayMonday = new Date(clientDate).getDay() === 1;

  const tomorrowDate = getDayWithoutTime(getTomorrowDate(clientDate));

  const todayDate = getDayWithoutTime(getDateWithOffset(0, clientDate));

  // If the user has opted to ignore weekends, we need to check if today is Monday.
  // If it is, we need to get the tasks from Friday, otherwise we get the tasks from yesterday
  const yeseterdayDate =
    user?.dailyReportIgnoreWeekends && isTodayMonday
      ? getDayWithoutTime(getDateWithOffset(-3, clientDate))
      : getDayWithoutTime(getDateWithOffset(-1, clientDate));

  const todayTaskList = await extendedPrisma.task.findMany({
    where: {
      isCompleted: false,
      dueDate: {
        lt: tomorrowDate,
      },
      list: {
        userId: userId,
        isStandupList: true,
      },
    },
    orderBy: {
      combinedViewOrder: "asc",
    },
    include: includeOnTask,
  });

  const completedYeseterdayTaskList = await extendedPrisma.task.findMany({
    where: {
      isCompleted: true,
      dateCompleted: {
        gte: yeseterdayDate,
        lte: todayDate,
      },
      list: {
        userId: userId,
        isStandupList: true,
      },
    },
    orderBy: {
      combinedViewOrder: "asc",
    },
    include: includeOnTask,
  });

  const blockedTaskList = await extendedPrisma.task.findMany({
    where: {
      isCompleted: false,
      taskTag: {
        some: {
          tag: {
            tagName: {
              equals: "blocked",
              mode: "insensitive",
            },
          },
        },
      },
      list: {
        userId: userId,
        isStandupList: true,
      },
    },
    orderBy: {
      combinedViewOrder: "asc",
    },
    include: includeOnTask,
  });

  return {
    today: addOverdueTagToTasks(todayTaskList, todayDate),
    yesterday: completedYeseterdayTaskList,
    blocked: blockedTaskList,
  };
};

const app = express();

app.post("/", async (req, res) => {
  try {
    const task = await createTask(req.userId!!, req.body);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/completed", async (req, res) => {
  try {
    const taskList = await getCompletedTasks(req.userId!!);
    res.status(200).json(taskList);
  } catch (error) {
    console.error("Error occurred while retrieving completed tasks", error);
    res
      .status(400)
      .json({ message: "Error occurred while retrieving completed tasks" });
  }
});

app.get("/today", async (req, res) => {
  try {
    if (!req.userId) {
      throw new Error("userId is required");
    }

    const taskList = await getTodaysTasks(
      req.userId,
      req.query.today as string
    );
    res.status(200).json(taskList);
  } catch (error) {
    console.error("Error occurred while retrieving today tasks", error);
    res
      .status(400)
      .json({ message: "Error occurred while retrieving completed tasks" });
  }
});

app.get("/upcoming", async (req, res) => {
  try {
    const taskList = await getUpcomingTasks(
      req.userId!!,
      req.query.today as string
    );
    res.status(200).json(taskList);
  } catch (error) {
    console.error("Error occurred while retrieving upcoming tasks", error);
    res
      .status(400)
      .json({ message: "Error occurred while retrieving upcoming tasks" });
  }
});

app.get("/standup", async (req, res) => {
  if (!req.userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const result = await getStandupTasks(req.userId, req.query.today as string);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error occurred while retrieving standup tasks", error);
    res
      .status(400)
      .json({ message: "Error occurred while retrieving standup tasks" });
  }
});

app.delete("/completed", async (req, res) => {
  const taskToDeleteQuery: Prisma.TaskWhereInput = {
    isCompleted: true,
    list: {
      userId: req.userId,
    },
  };

  try {
    const deletedTasks = await extendedPrisma.taskTag.deleteMany({
      where: {
        task: taskToDeleteQuery,
      },
    });

    console.log("Deleted task tags for completed tasks", deletedTasks);

    const deletedRecurringSchedules =
      await extendedPrisma.recurringSchedule.deleteMany({
        where: {
          task: taskToDeleteQuery,
        },
      });
    console.log(
      "Deleted recurring schedules for completed tasks",
      deletedRecurringSchedules
    );

    const tasks = await extendedPrisma.task.deleteMany({
      where: taskToDeleteQuery,
    });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error occurred while deleting completed tasks", error);
    res
      .status(400)
      .json({ message: "Error occurred while deleting completed tasks" });
  }
});

app.put("/reorder", async (req, res) => {
  const { tasksToUpdate } = req.body;

  for (const task of tasksToUpdate) {
    const {
      id,
      newOrder,
      newDueDate,
      fieldToUpdate = "listViewOrder",
      listId,
    } = task;

    if (isNullOrUndefined(id) || isNullOrUndefined(newOrder)) {
      return res
        .status(400)
        .json({ message: "id, fieldToUpdate, and newOrder are required" });
    }

    try {
      await extendedPrisma.task.update({
        where: {
          id: Number(id),
        },
        data: {
          [fieldToUpdate]: newOrder,
          dueDate: newDueDate ? new Date(newDueDate) : null,
          listId: listId ? Number(listId) : undefined,
        },
      });
    } catch (error) {
      console.error("Error occurred updating task order", error);
      return res.status(500).json({
        message: "Unexpected error occurred updating the order",
        error,
      });
    }
  }

  res.status(200).json({ success: true });
});

app.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const task = await updateTask(req.userId!!, Number(id), req.body);
    res.json(task);
  } catch (error) {
    console.error("Error occurred while updating task", error);
    res.status(400).json({ message: "error updating task", error });
  }
});

app.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const task = await extendedPrisma.task.findFirst({
    where: {
      id: Number(id),
    },
    include: includeOnTask,
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  } else if (task.recurringSchedule) {
    return res.status(400).json({
      message:
        "Cannot delete a task with a recurring schedule. Try deleting the schedule itself.",
    });
  }

  try {
    const task = await extendedPrisma.task.delete({
      where: {
        id: Number(id),
        list: {
          userId: req.userId,
        },
      },
    });
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: "task not found" });
  }
});

module.exports = app;
