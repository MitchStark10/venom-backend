import { PrismaClient } from "@prisma/client";
import express from "express";
import { isNullOrUndefined } from "../lib/isNullOrUndefined";

const prisma = new PrismaClient();
const app = express();

app.post("/", async (req, res) => {
  const { taskName, listId } = req.body;

  if (!taskName || !listId) {
    return res.status(400).json({ message: "title or listid is required" });
  }

  const associatedList = await prisma.list.findFirst({
    where: {
      id: Number(listId),
      userId: req.userId,
    },
  });

  if (!associatedList) {
    return res.status(400).json({ message: "list not found" });
  }

  const task = await prisma.task.create({
    data: {
      taskName,
      listId,
    },
  });

  res.json(task);
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
      await prisma.task.update({
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
  const { taskName } = req.body;

  if (!taskName) {
    return res.status(400).json({ message: "title is required" });
  }

  try {
    const task = await prisma.task.update({
      where: {
        id: Number(id),
        list: {
          userId: req.userId,
        },
      },
      data: {
        taskName,
      },
    });
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: "task not found" });
  }
});

app.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const task = await prisma.task.delete({
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
