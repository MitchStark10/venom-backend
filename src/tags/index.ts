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

app.put("/reorder", async (req, res) => {
  const { tags } = req.body;

  try {
    const updatedTags = await Promise.all(
      tags.map(async (tag: any, index: number) => {
        const updatedTag = await extendedPrisma.tag.update({
          where: {
            id: tag.id,
            userId: req.userId,
          },
          data: {
            tagName: undefined,
            tagColor: undefined,
            order: index,
          },
        });
        return updatedTag;
      })
    );
    res.json(updatedTags);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "list not found" });
  }
});

app.put("/:id", async (req, res) => {
  const idToUpdate = Number(req.params.id);
  const { tagColor, tagName } = req.body;

  if (!tagColor || !tagName) {
    return res.status(400).json({
      error: "tagName and tagColor are required.",
    });
  }

  const updatedTag = await extendedPrisma.tag.update({
    where: {
      id: idToUpdate,
      userId: req.userId,
    },
    data: {
      tagName,
      tagColor,
    },
  });

  res.status(200).json(updatedTag);
});

app.get("/", async (req, res) => {
  const tags = await extendedPrisma.tag.findMany({
    where: {
      userId: req.userId,
    },
    orderBy: {
      order: "asc",
    },
  });

  res.status(200).json(tags);
});

app.post("/", async (req, res) => {
  const { tagName, tagColor } = req.body;

  if (!tagName || !tagColor) {
    return res.status(400).json({
      error: "tagName and tagColor are required.",
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
