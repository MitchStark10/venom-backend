import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.post("/createUser", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  const bcrypt = require("bcrypt");
  const salt = bcrypt.genSaltSync(10);
  const hashedPass = bcrypt.hashSync(password, salt);

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        hashedPass,
      },
    });

    res.json(newUser);
  } catch (error: any) {
    console.log("Caught error during new user creation", error);
    if (error.code === "P2002" && error.meta.target.includes("email")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    return res.status(400).json({ error: "Error creating user" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  const bcrypt = require("bcrypt");
  const user = await prisma.user.findUnique({
    where: {
      email: email as string,
    },
  });
  if (!user) {
    return res.status(400).send("User not found");
  }

  const match = bcrypt.compareSync(password, user.hashedPass);
  if (!match) {
    return res.status(400).send("Incorrect password");
  }

  res.json(user);
});

module.exports = app;
