import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.use(cors());

app.get("/", async (req, res) => {
  const lists = await prisma.list.findMany({
    where: {
      userId: req.userId,
    },
  });
  res.json(lists);
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

  try {
    const list = await prisma.list.delete({
      where: {
        id: Number(id),
        userId: req.userId,
      },
    });
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: "list not found" });
  }
});

module.exports = app;
