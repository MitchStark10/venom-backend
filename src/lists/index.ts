import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

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

app.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const list = await prisma.list.delete({
    where: {
      id: Number(id),
      userId: req.userId,
    },
  });
  res.json(list);
});

module.exports = app;
