/**
 * DevFlow Automation Engine
 * Evaluates triggers and executes automated actions for tasks and projects
 */

import { workflowService } from '../services/workflowService.js';
import { taskService } from '../services/taskService.js';
import { projectService } from '../services/projectService.js';
import { notificationService } from '../services/notificationService.js';
import { checkTrigger, ACTION_TYPES } from './triggers.js';

export const automationEngine = {
  async runAutomationsForTask(task, prevTask = null) {
    try {
      const workflows = await workflowService.getWorkflows();
      const activeWorkflows = workflows.filter(w => w.is_active);

      for (const wf of activeWorkflows) {
        const isTriggered = checkTrigger(wf, { task, prevTask });
        if (isTriggered) {
          await this.executeAction(wf, { task });
        }
      }
    } catch (err) {
      console.error('Error running automations:', err);
    }
  },

  async executeAction(workflow, context) {
    const { action_type } = workflow;
    const { task } = context;

    try {
      if (action_type === ACTION_TYPES.SEND_NOTIFICATION) {
        await notificationService.createNotification(
          `Automation: ${workflow.name}`,
          `Task "${task.title}" triggered warning: deadline is approaching!`,
          'warning'
        );
      } else if (action_type === ACTION_TYPES.MARK_URGENT) {
        if (task.priority !== 'urgent') {
          await taskService.updateTask(task.id, { priority: 'urgent' });
          await notificationService.createNotification(
            `Priority Escalated`,
            `Task "${task.title}" was escalated to Urgent priority due to overdue status.`,
            'urgent'
          );
        }
      } else if (action_type === ACTION_TYPES.UPDATE_PROJECT_PROGRESS) {
        if (task.project_id) {
          // Calculate project completion percentage
          const allTasks = await taskService.getTasks({ projectId: task.project_id });
          if (allTasks.length > 0) {
            const completed = allTasks.filter(t => t.status === 'done').length;
            const progress = Math.round((completed / allTasks.length) * 100);
            await projectService.updateProject(task.project_id, { progress });
            await notificationService.createNotification(
              `Project Progress Updated`,
              `Project velocity synchronized to ${progress}% completion.`,
              'success'
            );
          }
        }
      }

      // Log successful run
      await workflowService.logRun(workflow.id, 'success', {
        task_id: task.id,
        task_title: task.title,
        executed_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed executing action for workflow:', workflow.id, err);
      await workflowService.logRun(workflow.id, 'failed', { error: err.message });
    }
  }
};
