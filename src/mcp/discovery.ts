const taskOutputSchema = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          taskName: { type: "string" },
          dueDate: { type: "string" },
          isCompleted: { type: "boolean" },
          list: {
            type: "object",
            properties: {
              id: { type: "integer" },
              listName: { type: "string" },
              isStandupList: { type: "boolean" },
              order: { type: "integer" },
            },
          },
          taskTag: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tag: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    tagName: { type: "string" },
                    order: { type: "integer" },
                    userId: { type: "integer" },
                    tagColor: { type: "string" },
                  },
                },
                taskId: { type: "integer" },
                tagId: { type: "integer" },
              },
            },
          },
          recurringSchedule: {
            type: ["object", "null"],
            properties: {
              id: { type: "integer" },
              cadence: { type: "string" },
              taskId: { type: "integer" },
            },
          },
        },
      },
    },
  },
};

const createTaskSchema = {
  name: "createTask",
  description: "Create a new task on a list.",
  inputSchema: {
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
        pattern: "^\\d{4}-\\d{2}-\\d{2}",
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
};

const updateTaskSchema = {
  name: "updateTask",
  description: "Update an existing task.",
  inputSchema: {
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
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        description: "The new due date of the task in ISO 8601 format.",
      },
      isCompleted: {
        type: "boolean",
        description: "Whether the task is completed or not.",
      },
      dateCompleted: {
        type: "string",
        pattern: "^\\d{4}-\\d{2}-\\d{2}",
        description: "The date the task was completed in ISO 8601 format.",
      },
      tagIds: {
        type: "array",
        items: {
          type: "integer",
        },
        description: "The new array of tag IDs to associate with the task.",
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
    required: ["id", "taskName", "dueDate"],
  },
};

const getTasksSchema = {
  name: "getTasks",
  description: "Get a list of the user's tasks.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  outputSchema: taskOutputSchema,
};

const getTodaysTasksSchema = {
  name: "getTodaysTasks",
  description: "Get a list of the user's tasks for today.",
  inputSchema: {
    type: "object",
    properties: {
      clientDate: {
        type: "string",
        description: "The client's current date in ISO 8601 format.",
      },
    },
    required: ["clientDate"],
  },
  outputSchema: taskOutputSchema,
};

const getUpcomingTasksSchema = {
  name: "getUpcomingTasks",
  description: "Get a list of the user's upcoming tasks.",
  inputSchema: {
    type: "object",
    properties: {
      clientDate: {
        type: "string",
        description: "The client's current date in ISO 8601 format.",
      },
    },
    required: ["clientDate"],
  },
  outputSchema: taskOutputSchema,
};

const getCompletedTasksSchema = {
  name: "getCompletedTasks",
  description: "Get a list of the user's completed tasks.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  outputSchema: taskOutputSchema,
};

const getStandupTasksSchema = {
  name: "getStandupTasks",
  description: "Get a list of the user's standup tasks.",
  inputSchema: {
    type: "object",
    properties: {
      clientDate: {
        type: "string",
        description: "The client's current date in ISO 8601 format.",
      },
    },
    required: ["clientDate"],
  },
};

const getTasksByListSchema = {
  name: "getTasksByList",
  description: "Get a list of non-completed tasks for a given list.",
  inputSchema: {
    type: "object",
    properties: {
      list_id: {
        type: "integer",
        description: "The ID of the list to retrieve tasks from.",
      },
    },
    required: ["list_id"],
  },
  outputSchema: taskOutputSchema,
};

export const discoveryDocument = {
  protocolVersion: "2025-06-18",
  serverInfo: {
    name: "venomTasks",
    version: "0.1.0",
  },

  tools: [
    createTaskSchema,
    updateTaskSchema,
    getTasksSchema,
    getTodaysTasksSchema,
    getUpcomingTasksSchema,
    getCompletedTasksSchema,
    getStandupTasksSchema,
    getTasksByListSchema,
  ],

  capabilities: {
    tools: {
      createTask: {
        name: createTaskSchema.name,
        description: createTaskSchema.description,
        input_schema: createTaskSchema.inputSchema,
      },
      updateTask: {
        name: updateTaskSchema.name,
        description: updateTaskSchema.description,
        input_schema: updateTaskSchema.inputSchema,
      },
    },
    resources: {
      getTasks: {
        name: getTasksSchema.name,
        description: getTasksSchema.description,
        output_schema: getTasksSchema.outputSchema,
      },
      getTodaysTasks: {
        name: getTodaysTasksSchema.name,
        description: getTodaysTasksSchema.description,
        input_schema: getTodaysTasksSchema.inputSchema,
        output_schema: getTodaysTasksSchema.outputSchema,
      },
      getUpcomingTasks: {
        name: getUpcomingTasksSchema.name,
        description: getUpcomingTasksSchema.description,
        input_schema: getUpcomingTasksSchema.inputSchema,
        output_schema: getUpcomingTasksSchema.outputSchema,
      },
      getCompletedTasks: {
        name: getCompletedTasksSchema.name,
        description: getCompletedTasksSchema.description,
        output_schema: getCompletedTasksSchema.outputSchema,
      },
      getStandupTasks: {
        name: getStandupTasksSchema.name,
        description: getStandupTasksSchema.description,
        input_schema: getStandupTasksSchema.inputSchema,
      },
      getTasksByList: {
        name: getTasksByListSchema.name,
        description: getTasksByListSchema.description,
        input_schema: getTasksByListSchema.inputSchema,
        output_schema: getTasksByListSchema.outputSchema,
      },
    },
  },
};

