import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import { authMiddleware } from "./middleware/authMiddleware";

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 5000;

const allowedDomain = process.env.CORS_ALLOWED_DOMAINS;

if (!allowedDomain) {
  throw new Error("Unable to initialize app. CORS_ALLOWED_DOMAINS is required");
}

app.use(
  cors({
    origin: ["http://localhost:3000", ...allowedDomain.split(',')],
  })
);

app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use("/users", require("./users/publicUsers"));

app.use(authMiddleware);

app.use("/lists", require("./lists"));
app.use("/tasks", require("./tasks"));

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
