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

module.exports = app;
