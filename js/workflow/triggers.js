/**
 * DevFlow Workflow Triggers Definition
 */

import { isOverdue, isDueWithinHours } from '../utils/dateUtils.js';

export const TRIGGER_TYPES = {
  TASK_OVERDUE: 'task_overdue',
  DEADLINE_APPROACHING: 'deadline_approaching',
  TASK_COMPLETED: 'task_completed',
  SUBTASKS_COMPLETED: 'subtasks_completed'
};

export const ACTION_TYPES = {
  SEND_NOTIFICATION: 'send_notification',
  MARK_URGENT: 'mark_urgent',
  UPDATE_PROJECT_PROGRESS: 'update_project_progress',
  ASSIGN_PRIORITY: 'assign_priority'
};

export function checkTrigger(workflow, context) {
  const { trigger_type } = workflow;
  const { task, prevTask } = context;

  switch (trigger_type) {
    case TRIGGER_TYPES.TASK_OVERDUE:
      return task && task.status !== 'done' && isOverdue(task.due_date);

    case TRIGGER_TYPES.DEADLINE_APPROACHING:
      return task && task.status !== 'done' && isDueWithinHours(task.due_date, 24);

    case TRIGGER_TYPES.TASK_COMPLETED:
      return task && task.status === 'done' && (!prevTask || prevTask.status !== 'done');

    case TRIGGER_TYPES.SUBTASKS_COMPLETED:
      return context.allSubtasksCompleted === true;

    default:
      return false;
  }
}
