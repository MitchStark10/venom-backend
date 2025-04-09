import { PrismaClient, Task, TaskTag } from "@prisma/client";

export interface ExtendedTaskWithTags extends Task {
  taskTag?: TaskTag[];
}

export const extendedPrisma = new PrismaClient().$extends({
  result: {
    task: {
      dueDate: {
        compute(data) {
          return data.dueDate ? data.dueDate.toISOString().split("T")[0] : null;
        },
      },
      tagIds: {
        compute(data: ExtendedTaskWithTags) {
          return data.taskTag?.map((taskTag) => taskTag.tagId);
        },
      },
    },
  },
});
