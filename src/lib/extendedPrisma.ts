import { PrismaClient } from "@prisma/client";

export const extendedPrisma = new PrismaClient().$extends({
  result: {
    task: {
      dueDate: {
        compute(data) {
          return data.dueDate ? data.dueDate.toISOString().split("T")[0] : null;
        },
      },
    },
  },
});
