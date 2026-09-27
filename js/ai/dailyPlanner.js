/**
 * DevFlow AI Daily Planner
 * Analyzes pending tasks, deadlines, priorities, and estimates to generate an optimal daily schedule.
 */

import { aiEngine } from './ai.js';
import { taskService } from '../services/taskService.js';
import { showToast } from '../utils/notifications.js';

export async function generateDailyPlan() {
  try {
    showToast('🤖 Formulating daily developer schedule with Groq...', 'info', 2500);

    // Fetch unfinished tasks
    const allTasks = await taskService.getTasks();
    const pendingTasks = allTasks.filter(t => t.status !== 'done');

    const result = await aiEngine.callGroq('daily_plan', {
      tasks: pendingTasks.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
        estimated_minutes: t.estimated_minutes
      }))
    });

    showToast('✨ Daily schedule ready!', 'success');
    return result;
  } catch (err) {
    console.error('Daily planner error:', err);
    showToast('Failed to formulate daily plan.', 'error');
    throw err;
  }
}
