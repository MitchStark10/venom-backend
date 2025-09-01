export const discoveryDocument = {
  protocolVersion: "2025-06-18",
  serverInfo: {
    name: "venomTasks",
    version: "0.1.0",
  },
  capabilities: {
    tools: [
      {
        name: "createTask",
        description: "Create a new task on a list.",
        input_schema: {
          type: "object",
          properties: {
            taskName: {
              type: "string",
              description: "The name of the task.",
            },
            listId: {
              type: "integer",
              description: "The ID of the list to create the task on.",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              description: "The due date of the task in ISO 8601 format.",
            },
            tagIds: {
              type: "array",
              items: {
                type: "integer",
              },
              description: "An array of tag IDs to associate with the task.",
            },
            recurringSchedule: {
              type: "object",
              properties: {
                cadence: {
                  type: "string",
                  description:
                    "The cadence of the recurring schedule (e.g., daily, weekly, monthly).",
                },
              },
              description: "The recurring schedule for the task.",
            },
          },
          required: ["taskName", "listId"],
        },
      },
      {
        name: "updateTask",
        description: "Update an existing task.",
        input_schema: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "The ID of the task to update.",
            },
            taskName: {
              type: "string",
              description: "The new name of the task.",
            },
            listId: {
              type: "integer",
              description: "The new ID of the list to move the task to.",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              description: "The new due date of the task in ISO 8601 format.",
            },
            isCompleted: {
              type: "boolean",
              description: "Whether the task is completed or not.",
            },
            dateCompleted: {
              type: "string",
              format: "date-time",
              description:
                "The date the task was completed in ISO 8601 format.",
            },
            tagIds: {
              type: "array",
              items: {
                type: "integer",
              },
              description:
                "The new array of tag IDs to associate with the task.",
            },
            recurringSchedule: {
              type: "object",
              properties: {
                cadence: {
                  type: "string",
                  description:
                    "The cadence of the recurring schedule (e.g., daily, weekly, monthly).",
                },
              },
              description: "The new recurring schedule for the task.",
            },
          },
          required: ["id"],
        },
      },
    ],
    resources: [
      {
        name: "getTasks",
        description: "Get a list of the user's tasks.",
      },
      {
        name: "getTodaysTasks",
        description: "Get a list of the user's tasks for today.",
        input_schema: {
          type: "object",
          properties: {
            clientDate: {
              type: "string",
              description: "The client's current date in ISO 8601 format.",
            },
          },
          required: ["clientDate"],
        },
      },
      {
        name: "getUpcomingTasks",
        description: "Get a list of the user's upcoming tasks.",
        input_schema: {
          type: "object",
          properties: {
            clientDate: {
              type: "string",
              description: "The client's current date in ISO 8601 format.",
            },
          },
          required: ["clientDate"],
        },
      },
      {
        name: "getCompletedTasks",
        description: "Get a list of the user's completed tasks.",
      },
      {
        name: "getStandupTasks",
        description: "Get a list of the user's standup tasks.",
        input_schema: {
          type: "object",
          properties: {
            clientDate: {
              type: "string",
              description: "The client's current date in ISO 8601 format.",
            },
          },
          required: ["clientDate"],
        },
      },
      {
        name: "getTasksByList",
        description: "Get a list of non-completed tasks for a given list.",
        input_schema: {
          type: "object",
          properties: {
            list_id: {
              type: "integer",
              description: "The ID of the list to retrieve tasks from.",
            },
          },
          required: ["list_id"],
        },
      },
    ],
  },
};
