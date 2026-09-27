/**
 * DevFlow Task Creation Handler
 */

import { taskService } from '../services/taskService.js';
import { projectService } from '../services/projectService.js';
import { automationEngine } from '../workflow/automationEngine.js';
import { breakdownTaskWithAI } from '../ai/taskBreakdown.js';
import { showToast } from '../utils/notifications.js';

export async function openCreateTaskModal(onCreated, initialStatus = 'todo') {
  const modalBackdrop = document.getElementById('app-modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body-content');
  const confirmBtn = document.getElementById('modal-confirm-btn');

  const projects = await projectService.getProjects();

  modalTitle.textContent = 'Create New Task';
  confirmBtn.textContent = 'Create Task';

  modalBody.innerHTML = `
    <form id="create-task-form">
      <div class="form-group">
        <label class="form-label">Task Title</label>
        <input type="text" id="task-title-input" class="form-control" placeholder="e.g. Implement Supabase Edge Function for Groq" required />
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="task-desc-input" class="form-control" rows="3" placeholder="Technical specifications, acceptance criteria, or architectural context..."></textarea>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Project</label>
          <select id="task-project-input" class="form-control">
            <option value="">No Project Assigned</option>
            ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Priority</label>
          <select id="task-priority-input" class="form-control">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" id="task-duedate-input" class="form-control" value="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}" />
        </div>

        <div class="form-group">
          <label class="form-label">Estimated Time (Mins)</label>
          <input type="number" id="task-est-input" class="form-control" value="60" min="5" step="5" />
        </div>
      </div>

      <div style="margin-top: 0.5rem; padding: 0.85rem; background: rgba(6,182,212,0.06); border: 1px dashed rgba(6,182,212,0.3); border-radius: var(--radius-md);">
        <label style="display:flex; align-items:center; gap: 0.5rem; font-size: 0.82rem; cursor: pointer;">
          <input type="checkbox" id="task-ai-breakdown-check" checked />
          <span>⚡ Automatically decompose into subtasks using Groq AI</span>
        </label>
      </div>
    </form>
  `;

  modalBackdrop.classList.add('active');

  const handleCreate = async () => {
    const title = document.getElementById('task-title-input').value.trim();
    const description = document.getElementById('task-desc-input').value.trim();
    const project_id = document.getElementById('task-project-input').value || null;
    const priority = document.getElementById('task-priority-input').value;
    const due_date_val = document.getElementById('task-duedate-input').value;
    const estimated_minutes = parseInt(document.getElementById('task-est-input').value, 10) || 60;
    const shouldBreakdown = document.getElementById('task-ai-breakdown-check').checked;

    if (!title) {
      showToast('Task title is required.', 'warning');
      return;
    }

    const due_date = due_date_val ? new Date(due_date_val).toISOString() : null;

    try {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner"></span> Creating...';

      const newTask = await taskService.createTask({
        title,
        description,
        project_id,
        status: initialStatus,
        priority,
        due_date,
        estimated_minutes,
        actual_minutes: 0,
        ai_generated: false
      });

      // Run AI breakdown if requested
      if (shouldBreakdown) {
        try {
          await breakdownTaskWithAI(newTask.id, `${title}: ${description}`);
        } catch (e) {
          console.warn("AI breakdown skipped:", e);
        }
      }

      // Check automations
      await automationEngine.runAutomationsForTask(newTask);

      showToast('Task created successfully!', 'success');
      modalBackdrop.classList.remove('active');
      confirmBtn.removeEventListener('click', handleCreate);
      if (onCreated) onCreated();
    } catch (err) {
      showToast(`Error creating task: ${err.message}`, 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Create Task';
    }
  };

  confirmBtn.onclick = handleCreate;
}
