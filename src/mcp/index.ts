import express, { Request, Response } from 'express';
import { extendedPrisma } from '../lib/extendedPrisma';
import { authMiddleware } from '../middleware/authMiddleware';

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

router.post('/mcp', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { tool_name, inputs } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. User ID not found on request.' });
  }

  try {
    let result;
    switch (tool_name) {
      case 'getTasks':
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

      default:
        return res.status(400).json({ error: `Tool '${tool_name}' not found.` });
    }

    res.json({ tool_result: result });

  } catch (error) {
    console.error(`Error executing tool '${tool_name}':`, error);
    res.status(500).json({ error: 'An error occurred while executing the tool.' });
  }
});

export default router;
