import { PrismaClient } from "@prisma/client";
import express from "express";

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