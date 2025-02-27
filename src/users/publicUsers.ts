import express from "express";
import jwt from "jsonwebtoken";
import { extendedPrisma } from "../lib/extendedPrisma";
import { send365Email } from "../lib/send365Email";

const app = express();

if (!process.env.JWT_SECRET) {
  console.log("Error: JWT_SECRET not set");
  process.exit(1);
} else if (!process.env.FRONTEND_DOMAIN) {
  console.log("Error: FRONTEND_DOMAIN not set");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN;

app.post("/createUser", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ erorr: "Email and password are required" });
  }

  const bcrypt = require("bcrypt");
  const salt = bcrypt.genSaltSync(10);
  const hashedPass = bcrypt.hashSync(password, salt);

  try {
    const newUser = await extendedPrisma.user.create({
      data: {
        email: email.toLowerCase(),
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
  const user = await extendedPrisma.user.findUnique({
    where: {
      email: (email as string).toLowerCase(),
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

app.post("/request_password_reset", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await extendedPrisma.user.findUnique({
    where: {
      email: (email as string).toLowerCase(),
    },
  });

  if (!user) {
    return res.status(400).json({ error: "User not found." });
  }

  try {
    await send365Email({
      to: user.email,
      subject: "Password Reset",
      html: `You are receiving this email because you have requested the reset of the password for your account.<br>Please click on the following link, or paste this into your browser to complete the process:<br><a href="${FRONTEND_DOMAIN}/${user.id}">Reset Password</a><br>If you did not request this, please ignore this email and your password will remain unchanged.`,
    });
  } catch (error) {
    return res.status(500).json({ error: "Error sending email" });
  }

  res.json({ message: "Email sent" });
});

module.exports = app;
