import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.get("/", async (req, res) => {
  const lists = await prisma.list.findMany({
    where: {
      userId: req.userId,
    },
    orderBy: [
      {
        order: "asc",
      },
      {
        id: "asc",
      },
    ],
    include: {
      tasks: {
        orderBy: {
          timeViewOrder: "asc",
        },
        where: {
          isCompleted: false,
        },
      },
    },
  });
  res.json(lists);
});

app.put("/reorder", async (req, res) => {
  const { lists } = req.body;

  try {
    const updateLists = await Promise.all(
      lists.map(async (list: any, index: number) => {
        const updateList = await prisma.list.update({
          where: {
            id: list.id,
            userId: req.userId,
          },
          data: {
            listName: undefined,
            order: index,
          },
        });
        return updateList;
      })
    );
    res.json(updateLists);
  } catch (error) {
    res.status(400).json({ message: "list not found" });
  }
});

app.post("/", async (req, res) => {
  const { listName } = req.body;

  if (!listName) {
    return res.status(400).json({ message: "listName is required" });
  }

  const list = await prisma.list.create({
    data: {
      listName,
      user: {
        connect: {
          id: req.userId,
        },
      },
    },
  });
  res.json(list);
});

app.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { listName } = req.body;

  if (!listName) {
    return res.status(400).json({ message: "listName is required" });
  }

  try {
    const list = await prisma.list.update({
      where: {
        id: Number(id),
        userId: req.userId,
      },
      data: {
        listName,
      },
    });
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: "list not found" });
  }
});

app.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "id is required" });
  }

  try {
    await prisma.task.deleteMany({
      where: {
        list: {
          id: Number(id),
          userId: req.userId,
        },
      },
    });
    const list = await prisma.list.delete({
      where: {
        id: Number(id),
        userId: req.userId,
      },
    });
    res.json(list);
  } catch (error) {
    res.status(400).json({
      message: "An error occurred deleting the list.",
      err: error,
      details: {
        id,
        userId: req.userId,
      },
    });
  }
});

module.exports = app;
