import express from "express";
import { extendedPrisma } from "../lib/extendedPrisma";
import { getDayWithoutTime } from "../lib/getDayWithoutTime";
import { getDateWithOffset, getTomorrowDate } from "../lib/getTomorrowDate";
import { isNullOrUndefined } from "../lib/isNullOrUndefined";

const includeOnTask = {
  list: true,
  taskTag: {
    include: {
      tag: true,
    },
  },
};

const getTodaysTasks = async (userId: number, clientDate: string) => {
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
      timeViewOrder: "asc",
    },
    include: includeOnTask,
  });
  return taskList;
};

const app = express();

app.post("/", async (req, res) => {
  const { taskName, listId, dueDate, tagIds } = req.body;

  if (!taskName || !listId) {
    return res.status(400).json({ message: "taskName or listid is required" });
  }

  const associatedList = await extendedPrisma.list.findFirst({
    where: {
      id: Number(listId),
      userId: req.userId,
    },
    include: {
      tasks: true,
    },
  });

  if (!associatedList) {
    return res.status(400).json({ message: "list not found" });
  }

  const task = await extendedPrisma.task.create({
    data: {
      taskName,
      listId,
      dueDate: dueDate ? new Date(dueDate) : null,
      listViewOrder: associatedList.tasks.length,
    },
  });

  if (tagIds?.length > 0) {
    await extendedPrisma.taskTag.createMany({
      data: tagIds.map((tagId: number) => ({
        taskId: task.id,
        tagId,
      })),
    });
  }

  res.json(task);
});

app.get("/completed", async (req, res) => {
  try {
    const taskList = await extendedPrisma.task.findMany({
      where: {
        isCompleted: true,
        list: {
          userId: req.userId,
        },
      },
      orderBy: {
        timeViewOrder: "asc",
      },
      include: includeOnTask,
    });
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
  const tomorrowDate = getDayWithoutTime(
    getTomorrowDate(req.query.today as string)
  );
  try {
    const taskList = await extendedPrisma.task.findMany({
      where: {
        isCompleted: false,
        dueDate: {
          gte: tomorrowDate,
        },
        list: {
          userId: req.userId,
        },
      },
      orderBy: {
        timeViewOrder: "asc",
      },
      include: includeOnTask,
    });
    res.status(200).json(taskList);
  } catch (error) {
    console.error("Error occurred while retrieving upcoming tasks", error);
    res
      .status(400)
      .json({ message: "Error occurred while retrieving upcoming tasks" });
  }
});

app.get("/standup", async (req, res) => {
  // Get any tasks with a "blocked" tag
  const tomorrowDate = getDayWithoutTime(
    getTomorrowDate(req.query.today as string)
  );

  const todayDate = getDayWithoutTime(
    getDateWithOffset(0, req.query.today as string)
  );
  const yeseterdayDate = getDayWithoutTime(
    getDateWithOffset(-1, req.query.today as string)
  );

  if (!req.userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const todayTaskList = await extendedPrisma.task.findMany({
    where: {
      isCompleted: false,
      dueDate: {
        lt: tomorrowDate,
      },
      list: {
        userId: req.userId,
        isStandupList: true,
      },
    },
    orderBy: {
      timeViewOrder: "asc",
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
        userId: req.userId,
        isStandupList: true,
      },
    },
    orderBy: {
      timeViewOrder: "asc",
    },
    include: includeOnTask,
  });

  const blockedTaskList = await extendedPrisma.task.findMany({
    where: {
      isCompleted: false,
      taskTag: {
        some: {
          tag: {
            tagName: "blocked",
          },
        },
      },
      list: {
        userId: req.userId,
        isStandupList: true,
      },
    },
    orderBy: {
      timeViewOrder: "asc",
    },
    include: includeOnTask,
  });

  res.status(200).json({
    today: todayTaskList,
    yesterday: completedYeseterdayTaskList,
    blocked: blockedTaskList,
  });
});

app.delete("/completed", async (req, res) => {
  try {
    await extendedPrisma.taskTag.deleteMany({
      where: {
        task: {
          isCompleted: true,
          list: {
            userId: req.userId,
          },
        },
      },
    });

    const tasks = await extendedPrisma.task.deleteMany({
      where: {
        isCompleted: true,
        list: {
          userId: req.userId,
        },
      },
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
    const { id, fieldToUpdate, newOrder, newDueDate } = task;

    if (
      isNullOrUndefined(id) ||
      !fieldToUpdate ||
      isNullOrUndefined(newOrder) ||
      !["timeViewOrder", "listViewOrder"].includes(fieldToUpdate)
    ) {
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
  const { listId, taskName, dueDate, isCompleted, tagIds, dateCompleted } =
    req.body;

  console.log("received tag ids", tagIds);

  if (!taskName && !dueDate) {
    return res.status(400).json({ message: "taskName or dueDate is required" });
  }

  try {
    const task = await extendedPrisma.task.update({
      where: {
        id: Number(id),
        list: {
          userId: req.userId,
        },
      },
      data: {
        listId: listId ? Number(listId) : undefined,
        taskName,
        dueDate: dueDate ? new Date(dueDate) : dueDate,
        isCompleted,
        dateCompleted: dateCompleted ? new Date(dateCompleted) : null,
      },
    });

    await extendedPrisma.taskTag.deleteMany({
      where: {
        taskId: task.id,
      },
    });

    if (tagIds?.length > 0) {
      await extendedPrisma.taskTag.createMany({
        data: tagIds.map((tagId: number) => ({
          taskId: task.id,
          tagId,
        })),
      });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: "error updating task", error });
  }
});

app.delete("/:id", async (req, res) => {
  const { id } = req.params;

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
