import bodyParser from "body-parser";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import { authMiddleware } from "./middleware/authMiddleware";

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:3000"],
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
