import express from "express";
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

const app = express();

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

interface McpRequestBody {
  method:
    | "initialize"
    | "tools/list"
    | "notifications/initialized"
    | "tools/call";
  params?: {
    name?: string;
    arguments?: any;
  };
  jsonrpc: string;
  id: string | number | null;
}

interface McpToolCallResponseBody {
  jsonrpc: "2.0";
  id: string | number | null;
  result: {
    content: {
      type: "text";
      text: string;
    }[];
    structuredContent: any;
  };
}

app.post("/mcp", async (req, res) => {
  console.log("Received MCP request", req.body);
  const { method, params, id } = req.body as McpRequestBody;
  const { name, arguments: args } = params || {};

  // TODO: Probably need to review the protocol for other methods
  if (method !== "tools/call") {
    return res.json({
      jsonrpc: "2.0",
      result: discoveryDocument,
      id,
    });
  }

  if (!name) {
    return res
      .status(400)
      .json({ error: "Tool name is required for 'tools/call' method." });
  }

  const userId = req.userId!!;

  try {
    let result;
    switch (name) {
      case "createTask":
        console.log("MCP: Creating task with args:", args);
        const task = await createTask(userId, args);
        result = { task };
        break;
      case "updateTask":
        console.log("MCP: Updating task with args:", args);
        const updatedTask = await updateTask(userId, args.id, args);
        result = { task: updatedTask };
        break;
      case "getTasks":
        console.log("MCP: Fetching all tasks for user:", userId);
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
        console.log(
          "MCP: Fetching today's tasks for user:",
          userId,
          args.clientDate
        );
        const todaysTasks = await getTodaysTasks(userId, args.clientDate);
        result = { tasks: todaysTasks };
        break;
      case "getUpcomingTasks":
        console.log("MCP: Fetching upcoming tasks for user:", userId);
        const upcomingTasks = await getUpcomingTasks(userId, args.clientDate);
        result = { tasks: upcomingTasks };
        break;
      case "getCompletedTasks":
        console.log("MCP: Fetching completed tasks for user:", userId);
        const completedTasks = await getCompletedTasks(userId);
        result = { tasks: completedTasks };
        break;
      case "getStandupTasks":
        console.log("MCP: Fetching standup tasks for user:", userId);
        const standupTasks = await getStandupTasks(userId, args.clientDate);
        result = standupTasks;
        break;
      case "getTasksByList":
        console.log("MCP: Fetching tasks by list for user:", userId);
        const tasksByList = await getTasksByList(userId, args.list_id);
        result = { tasks: tasksByList };
        break;
      default:
        return res.status(400).json({ error: `Tool '${name}' not found.` });
    }

    const formattedResponse: McpToolCallResponseBody = {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
        structuredContent: result,
      },
    };

    console.log("MCP: Responding with:", JSON.stringify(formattedResponse));

    res.json(formattedResponse);
  } catch (error) {
    console.error(`Error executing '${name}':`, error);
    res
      .status(500)
      .json({ error: "An error occurred while executing the tool." });
  }
});

export default app;
