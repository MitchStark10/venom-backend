import express from "express";
import { extendedPrisma } from "./lib/extendedPrisma";
import { sendEmail } from "./lib/sendEmail";

const app = express();

const MAINTAINER_EMAIL = process.env.MAINTAINER_EMAIL;

if (!MAINTAINER_EMAIL) {
  console.warn(
    "MAINTAINER_EMAIL not set. Maintenance emails will not be sent.",
  );
}

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

  try {
    await sendEmail({
      to: MAINTAINER_EMAIL,
      subject: "Feedback Received",
      html: feedback.message,
    });
  } catch (error) {
    console.error("Caught error while sending feedback email: ", error);
  }

  return res.status(200).json(feedback);
});

module.exports = app;
