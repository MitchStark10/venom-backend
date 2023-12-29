import express, { Express, Request, Response } from "express";

const app: Express = express();
const port = process.env.PORT || 5000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

// TODO: Add auth middleware
app.use("/lists", require("./lists"));

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
