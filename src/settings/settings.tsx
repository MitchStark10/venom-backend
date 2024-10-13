import express from "express";
import { extendedPrisma } from "../lib/extendedPrisma";
const app = express();

app.get("/", (req, res) => {
  const user = extendedPrisma.user.findFirst({
    where: {
      id: req.userId,
    },
    select: {
      id: true,
      autoDeleteTasks: true,
      listsForStandups: true,
    },
  });

  res.status(200).json(user);
});

app.put("/", async (req, res) => {
  const { autoDeleteTasks, listsForStandups } = req.body;

  const user = await extendedPrisma.user.update({
    where: {
      id: req.userId,
    },
    data: {
      autoDeleteTasks,
      listsForStandups,
    },
  });

  res.status(200).json(user);
});
