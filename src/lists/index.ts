import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

// TODO: This needs to be limited to the current logged in user
app.get("/", async (req, res) => {
  const lists = await prisma.list.findMany();
  res.json(lists);
});

export default app;
