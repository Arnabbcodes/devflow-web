/**
 * DevFlow AI Priority Analyzer
 */

import { aiEngine } from './ai.js';

export async function analyzeTaskPriority(taskTitle, taskDescription = '') {
  try {
    return await aiEngine.callGroq('priority_analyzer', {
      task: taskTitle,
      description: taskDescription
    });
  } catch (err) {
    console.error('Priority analysis error:', err);
    return { priority: 'medium', reason: 'Default fallback' };
  }
}
