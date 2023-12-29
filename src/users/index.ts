import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

// TODO: This does not require auth
app.post("/", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  const bcrypt = require("bcrypt");
  const salt = bcrypt.genSaltSync(10);
  const hashedPass = bcrypt.hashSync(password, salt);

  const list = await prisma.user.create({
    data: {
      email,
      hashedPass,
    },
  });

  res.json(list);
});

export default app;
