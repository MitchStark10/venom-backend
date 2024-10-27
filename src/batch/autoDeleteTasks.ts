import { extendedPrisma } from '../../lib/extendedPrisma';
import { AutoDeleteTaskOptions } from '@prisma/client';

const OFFSET_MAP = {
    AutoDeleteTaskOptions.ONE_WEEK: -7,
    AutoDeleteTaskOptions.TWO_WEEKS: -14
    AutoDeleteTaskOptions.ONE_MONTH: -30
}

export const autoDeleteTasks = async () => {
    const users = await extendedPrisma.user.find({
        where: {
            autoDeleteTasks: {
                not: AutoDeleteTaskOptions.NEVER // TODO: Verify this condition
            },
        }
    });
    
    for (const user of users) {
        const dateToCheck = getDateWithOffset(OFFSET_MAP[user.autoDeleteTasks]);
    
        const taskFilter = {
            userId: user.id,
            completedDate: { // TODO: Need to run the migration for this
                lte: dateToCheck,
            },
            isCompleted: true
        };
        
        if (isDryRun) {
            const tasks = await extendedPrisma.task.find({
                where: taskFilter
            });
            
            for (const task of tasks) {
                console.log('Task eligible for deletion', task);
            }
        } else {
            const deletedTasks = await extendedPrisma.task.delete({
                where: taskfilter
            });       
            console.log("Deletion operation completed", deletedTasks)
        }
    }
};