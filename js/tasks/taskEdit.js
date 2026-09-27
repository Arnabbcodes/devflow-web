/**
 * DevFlow Task Edit Handler
 */

import { taskService } from '../services/taskService.js';
import { projectService } from '../services/projectService.js';
import { automationEngine } from '../workflow/automationEngine.js';
import { showToast } from '../utils/notifications.js';

export async function openEditTaskModal(taskId, onUpdated) {
  const modalBackdrop = document.getElementById('app-modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body-content');
  const confirmBtn = document.getElementById('modal-confirm-btn');

  const task = await taskService.getTaskById(taskId);
  if (!task) return;

  const projects = await projectService.getProjects();

  modalTitle.textContent = 'Edit Task';
  confirmBtn.textContent = 'Save Changes';

  modalBody.innerHTML = `
    <form id="edit-task-form">
      <div class="form-group">
        <label class="form-label">Task Title</label>
        <input type="text" id="edit-task-title" class="form-control" value="${task.title}" required />
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="edit-task-desc" class="form-control" rows="3">${task.description || ''}</textarea>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="edit-task-status" class="form-control">
            <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
            <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="review" ${task.status === 'review' ? 'selected' : ''}>Under Review</option>
            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Priority</label>
          <select id="edit-task-priority" class="form-control">
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
            <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Project</label>
          <select id="edit-task-project" class="form-control">
            <option value="">No Project Assigned</option>
            ${projects.map(p => `<option value="${p.id}" ${task.project_id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" id="edit-task-duedate" class="form-control" value="${task.due_date ? task.due_date.split('T')[0] : ''}" />
        </div>
      </div>
    </form>
  `;

  modalBackdrop.classList.add('active');

  const handleSave = async () => {
    const title = document.getElementById('edit-task-title').value.trim();
    const description = document.getElementById('edit-task-desc').value.trim();
    const status = document.getElementById('edit-task-status').value;
    const priority = document.getElementById('edit-task-priority').value;
    const project_id = document.getElementById('edit-task-project').value || null;
    const dueDateVal = document.getElementById('edit-task-duedate').value;

    if (!title) {
      showToast('Title is required.', 'warning');
      return;
    }

    try {
      const updated = await taskService.updateTask(task.id, {
        title,
        description,
        status,
        priority,
        project_id,
        due_date: dueDateVal ? new Date(dueDateVal).toISOString() : null
      });

      // Run automations (e.g. task completed -> update project progress)
      await automationEngine.runAutomationsForTask(updated, task);

      showToast('Task updated!', 'success');
      modalBackdrop.classList.remove('active');
      if (onUpdated) onUpdated();
    } catch (err) {
      showToast(`Update error: ${err.message}`, 'error');
    }
  };

  confirmBtn.onclick = handleSave;
}
