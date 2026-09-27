/**
 * DevFlow AI Task Breakdown
 * Calls the Supabase "groq-ai" Edge Function to decompose large tasks into subtasks.
 */

import { aiEngine } from './ai.js';
import { taskService } from '../services/taskService.js';
import { showToast } from '../utils/notifications.js';

export async function breakdownTaskWithAI(taskId, taskDescription) {
  try {
    showToast('🧠 Groq AI analyzing task architecture...', 'info', 2500);

    const result = await aiEngine.callGroq('task_breakdown', {
      task: taskDescription
    });

    if (!result || !result.subtasks || !result.subtasks.length) {
      throw new Error('AI could not generate subtasks.');
    }

    // Automatically batch save generated subtasks to database/store
    await taskService.batchAddSubtasks(taskId, result.subtasks);

    // Optionally update task priority and estimated minutes if recommended
    const updates = {};
    if (result.priority) updates.priority = result.priority;
    if (result.estimated_minutes) updates.estimated_minutes = result.estimated_minutes;
    updates.ai_generated = true;
    await taskService.updateTask(taskId, updates);

    showToast(`⚡ Generated ${result.subtasks.length} subtasks with Groq!`, 'success');
    return result;
  } catch (err) {
    console.error('Task breakdown error:', err);
    showToast(`AI Breakdown error: ${err.message}`, 'error');
    throw err;
  }
}
