import express from "express";
import { extendedPrisma } from "./lib/extendedPrisma";

const app = express();

app.post("/", async (req, res) => {
  const { message, email, name } = req.body;

  if (!message || !email || !name) {
    return res
      .status(400)
      .json({ message: "message, email, and name are required" });
  }

  const feedback = await extendedPrisma.feedback.create({
    data: {
      message,
      email,
      name,
    },
  });

  return res.status(200).json(feedback);
});

module.exports = app;
