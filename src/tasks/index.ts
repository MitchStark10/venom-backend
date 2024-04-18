import express from "express";
import { extendedPrisma } from "../lib/extendedPrisma";
import { getDayWithoutTime } from "../lib/getDayWithoutTime";
import { getTomorrowDate } from "../lib/getTomorrowDate";
import { isNullOrUndefined } from "../lib/isNullOrUndefined";

const app = express();

app.post("/", async (req, res) => {
  const { taskName, listId, dueDate } = req.body;

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
      include: {
        list: true,
      },
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
  const lt = getDayWithoutTime(getTomorrowDate(req.query.today as string));

  try {
    const taskList = await extendedPrisma.task.findMany({
      where: {
        isCompleted: false,
        dueDate: {
          lt: lt,
        },
        list: {
          userId: req.userId,
        },
      },
      orderBy: {
        timeViewOrder: "asc",
      },
      include: {
        list: true,
      },
    });
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
      include: {
        list: true,
      },
    });
    res.status(200).json(taskList);
  } catch (error) {
    console.error("Error occurred while retrieving upcoming tasks", error);
    res
      .status(400)
      .json({ message: "Error occurred while retrieving upcoming tasks" });
  }
});

app.delete("/completed", async (req, res) => {
  try {
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
    const { id, fieldToUpdate, newOrder } = task;

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
  const { taskName, dueDate, isCompleted } = req.body;

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
        taskName,
        dueDate: dueDate ? new Date(dueDate) : dueDate,
        isCompleted,
      },
    });
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
