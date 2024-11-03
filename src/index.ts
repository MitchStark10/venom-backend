import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import cron from "node-cron";
import { autoDeleteTasks } from "./batch/autoDeleteTasks";
import { authMiddleware } from "./middleware/authMiddleware";

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 3000;

const allowedDomain = process.env.CORS_ALLOWED_DOMAINS;

const origins = ["http://localhost:3000"];

if (allowedDomain) {
  origins.push(...allowedDomain.split(","));
}

app.use(
  cors({
    origin: origins,
  })
);

app.use(bodyParser.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use("/users", require("./users/publicUsers"));

app.use(authMiddleware);

app.use("/lists", require("./lists"));
app.use("/tasks", require("./tasks"));
app.use("/tags", require("./tags"));
app.use("/settings", require("./settings/settings"));

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Cron job once a day at 6am CST
cron.schedule("0 6 * * *", async () => {
  const isDryRun = process.env.ENABLE_DELETE_TASKS !== "true";
  await autoDeleteTasks({ isDryRun });
});
