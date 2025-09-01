import express, { Request, Response } from "express";
import { extendedPrisma } from "../lib/extendedPrisma";
import {
  getTodaysTasks,
  getUpcomingTasks,
  getCompletedTasks,
  getStandupTasks,
  getTasksByList,
  createTask,
  updateTask,
} from "../tasks";
import { discoveryDocument } from "./discovery";

const router = express.Router();

interface AuthenticatedRequest extends Request {
  userId?: number;
}

const includeOnTask = {
  list: {
    select: {
      id: true,
      listName: true,
      userId: true,
      isStandupList: true,
      order: true,
    },
  },
  taskTag: {
    include: {
      tag: true,
    },
  },
  recurringSchedule: true,
};

router.post("/mcp", async (req: AuthenticatedRequest, res: Response) => {
  const { tool_name, resource_name, inputs, id } = req.body;
  const userId = req.userId;

  try {
    let result;
    if (tool_name) {
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      switch (tool_name) {
        case "createTask":
          const task = await createTask(userId, inputs);
          result = { task };
          break;
        case "updateTask":
          const updatedTask = await updateTask(userId, inputs.id, inputs);
          result = { task: updatedTask };
          break;
        default:
          return res
            .status(400)
            .json({ error: `Tool '${tool_name}' not found.` });
      }
    } else if (resource_name) {
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      switch (resource_name) {
        case "getTasks":
          const tasks = await extendedPrisma.task.findMany({
            where: {
              list: {
                userId: userId,
              },
            },
            include: includeOnTask,
          });
          result = { tasks };
          break;
        case "getTodaysTasks":
          const todaysTasks = await getTodaysTasks(userId, inputs.clientDate);
          result = { tasks: todaysTasks };
          break;
        case "getUpcomingTasks":
          const upcomingTasks = await getUpcomingTasks(
            userId,
            inputs.clientDate
          );
          result = { tasks: upcomingTasks };
          break;
        case "getCompletedTasks":
          const completedTasks = await getCompletedTasks(userId);
          result = { tasks: completedTasks };
          break;
        case "getStandupTasks":
          const standupTasks = await getStandupTasks(userId, inputs.clientDate);
          result = standupTasks;
          break;
        case "getTasksByList":
          const tasksByList = await getTasksByList(userId, inputs.list_id);
          result = { tasks: tasksByList };
          break;
        default:
          return res
            .status(400)
            .json({ error: `Resource '${resource_name}' not found.` });
      }
    } else {
      return res.json({
        jsonrpc: "2.0",
        result: discoveryDocument,
        id,
      });
    }

    res.json({ tool_result: result });
  } catch (error) {
    const name = tool_name || resource_name;
    console.error(`Error executing '${name}':`, error);
    res
      .status(500)
      .json({ error: "An error occurred while executing the tool." });
  }
});

export default router;
