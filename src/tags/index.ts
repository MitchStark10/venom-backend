import express from "express";
import { extendedPrisma } from "../lib/extendedPrisma";
const app = express();

app.delete("/:id", async (req, res) => {
  const idToDelete = Number(req.params.id);

  await extendedPrisma.taskTag.deleteMany({
    where: {
      tagId: idToDelete,
      tag: {
        userId: req.userId,
      },
    },
  });
  await extendedPrisma.tag.delete({
    where: {
      id: idToDelete,
      userId: req.userId,
    },
  });

  res.status(200).json({
    messsage: "Successfully deleted the tag",
  });
});

app.get("/", async (req, res) => {
  const tags = await extendedPrisma.tag.findMany({
    where: {
      userId: req.userId,
    },
  });

  res.status(200).json(tags);
});

app.post("/", async (req, res) => {
  const { tagName, tagColor } = req.body;

  if (!tagName || !tagColor) {
    return res.status(400).json({
      error: "tagName is required",
    });
  }

  const tag = await extendedPrisma.tag.create({
    data: {
      tagName,
      tagColor,
      user: {
        connect: {
          id: req.userId,
        },
      },
    },
  });

  res.status(200).json(tag);
});

module.exports = app;
