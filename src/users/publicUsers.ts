import { PrismaClient } from "@prisma/client";
import express from "express";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const app = express();

if (!process.env.JWT_SECRET) {
  console.log("Error: JWT_SECRET not set");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

app.post("/createUser", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ erorr: "Email and password are required" });
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

    const token = jwt.sign(newUser, JWT_SECRET);
    res.json({ token });
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
    return res.status(400).json({ error: "Email and password are required" });
  }

  const bcrypt = require("bcrypt");
  const user = await prisma.user.findUnique({
    where: {
      email: email as string,
    },
  });

  if (!user) {
    return res.status(400).json({ error: "User or password is incorrect." });
  }

  const match = bcrypt.compareSync(password, user.hashedPass);
  if (!match) {
    return res.status(400).json({ error: "User or password is incorrect." });
  }

  const token = jwt.sign(user, JWT_SECRET);
  res.json({ token });
});

module.exports = app;
