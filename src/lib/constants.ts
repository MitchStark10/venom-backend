import { Tag } from "@prisma/client";

export const OVERDUE_TAG: Tag = {
  id: -1,
  order: -1,
  userId: -1,
  tagColor: "red",
  tagName: "Overdue",
};
