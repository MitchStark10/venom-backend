import express from "express";
import jwt from "jsonwebtoken";
import { extendedPrisma } from "../lib/extendedPrisma";
import { sendEmail } from "../lib/sendEmail";
import crypto from "crypto";
import { User } from "@prisma/client";

const PASSWORD_RESET_EXPIRES = 3_600_000; // 1 hour

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

const userForToken = (user: User) => {
  const { hashedPass, ...userForToken } = user;
  return userForToken;
};

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

    const token = jwt.sign(userForToken(newUser), JWT_SECRET);
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

  const token = jwt.sign(userForToken(user), JWT_SECRET);
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

  // Generate a random token
  const token = crypto.randomBytes(32).toString("hex");

  // Calculate the expiry timestamp
  const expiry = new Date(Date.now() + PASSWORD_RESET_EXPIRES);

  // Create a hash of the token and userId for secure storage.
  const hash = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(token + user.id.toString())
    .digest("hex");

  await extendedPrisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      resetPasswordToken: hash,
      resetPasswordTokenExpiry: expiry,
    },
  });

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      html: `You are receiving this email because you have requested the reset of the password for your account.<br><br>Please click on the following link, or paste this into your browser to complete the process:<br><br><a href="${FRONTEND_DOMAIN}/reset-password?token=${token}&userId=${user.id}">Reset Password</a><br><br>If you did not request this, please ignore this email and your password will remain unchanged.`,
    });
  } catch (error) {
    return res.status(500).json({ error: "Error sending email" });
  }

  res.json({ message: "Email sent" });
});

app.post("/reset_password", async (req, res) => {
  const { token, password, userId } = req.body;
  if (!token || !password || !userId) {
    return res.status(400).json({ error: "Token and password are required" });
  }

  const user = await extendedPrisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    console.error("User not found during reset password request");
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  try {
    const calculatedHash = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(token + userId.toString())
      .digest("hex");

    if (
      calculatedHash !== user.resetPasswordToken ||
      !user.resetPasswordTokenExpiry ||
      user.resetPasswordTokenExpiry < new Date()
    ) {
      console.error("Invalid token or expired token received", {
        incorrectHash: calculatedHash !== user.resetPasswordToken,
        expired:
          !user.resetPasswordTokenExpiry ||
          user.resetPasswordTokenExpiry < new Date(),
      });
      throw new Error("Invalid token");
    }
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const bcrypt = require("bcrypt");
  const salt = bcrypt.genSaltSync(10);
  const hashedPass = bcrypt.hashSync(password, salt);

  const updatedUser = await extendedPrisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      hashedPass,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    },
  });

  const uiToken = jwt.sign(userForToken(updatedUser), JWT_SECRET);
  res.json({ token: uiToken });
});

module.exports = app;
