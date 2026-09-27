/**
 * DevFlow Workflow Builder
 * Manages modal & form for assembling new automation rules
 */

import { workflowService } from '../services/workflowService.js';
import { showToast } from '../utils/notifications.js';

export function openWorkflowBuilderModal(onCreated) {
  const modalBackdrop = document.getElementById('app-modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body-content');
  const confirmBtn = document.getElementById('modal-confirm-btn');

  modalTitle.textContent = 'Create Autonomous Workflow';
  confirmBtn.textContent = 'Create Automation';

  modalBody.innerHTML = `
    <form id="workflow-builder-form">
      <div class="form-group">
        <label class="form-label">Automation Name</label>
        <input type="text" id="wf-name" class="form-control" placeholder="e.g. Critical Bug Escalation" required />
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="wf-desc" class="form-control" rows="2" placeholder="Briefly describe what this automation ensures..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">WHEN (Trigger Event)</label>
        <select id="wf-trigger" class="form-control">
          <option value="task_overdue">Task becomes Overdue (Deadline passed)</option>
          <option value="deadline_approaching">Deadline Approaching (&lt; 24 Hours)</option>
          <option value="task_completed">Task is Marked as Completed (Done)</option>
          <option value="subtasks_completed">All Subtasks Completed</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">THEN (Automated Action)</label>
        <select id="wf-action" class="form-control">
          <option value="send_notification">Send Alert Notification to Developer</option>
          <option value="mark_urgent">Escalate Task Priority to Urgent</option>
          <option value="update_project_progress">Recalculate &amp; Update Project Velocity</option>
        </select>
      </div>
    </form>
  `;

  modalBackdrop.classList.add('active');

  const handleConfirm = async () => {
    const name = document.getElementById('wf-name').value.trim();
    const description = document.getElementById('wf-desc').value.trim();
    const trigger_type = document.getElementById('wf-trigger').value;
    const action_type = document.getElementById('wf-action').value;

    if (!name) {
      showToast('Please provide an automation name.', 'warning');
      return;
    }

    try {
      await workflowService.createWorkflow({
        name,
        description,
        trigger_type,
        action_type,
        is_active: true
      });
      showToast('Workflow created successfully!', 'success');
      modalBackdrop.classList.remove('active');
      confirmBtn.removeEventListener('click', handleConfirm);
      if (onCreated) onCreated();
    } catch (err) {
      showToast(`Failed creating workflow: ${err.message}`, 'error');
    }
  };

  confirmBtn.onclick = handleConfirm;
}
