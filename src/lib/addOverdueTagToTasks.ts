import { Tag, Task, TaskTag } from "@prisma/client";
import { OVERDUE_TAG } from "./constants";

interface ExtendedTaskTag extends TaskTag {
  tag: Tag;
}

interface ExtendedTask extends Omit<Task, "dueDate"> {
  taskTag: ExtendedTaskTag[];
  dueDate: Date | string | null;
}

export const addOverdueTagToTasks = (
  tasks: ExtendedTask[],
  clientDate: string | Date,
) => {
  if (!clientDate) {
    return tasks;
  }
  
  return tasks.map((task) => {
    if (task.dueDate && new Date(task.dueDate) < new Date(clientDate)) {
      return {
        ...task,
        taskTag: [
          ...task.taskTag,
          { tag: OVERDUE_TAG, taskId: task.id, tagId: -1 },
        ],
      };
    }

    return {
      ...task,
    };
  });
};
