/**
 * DevFlow Workflow Page Controller
 */

import { workflowService } from '../services/workflowService.js';
import { openWorkflowBuilderModal } from './workflowBuilder.js';
import { timeAgo } from '../utils/dateUtils.js';
import { showToast } from '../utils/notifications.js';

export async function initWorkflowPage() {
  const listContainer = document.getElementById('workflow-list-container');
  const runLogsContainer = document.getElementById('run-logs-tbody');
  const newWfBtn = document.getElementById('new-workflow-btn');

  if (newWfBtn) {
    newWfBtn.addEventListener('click', () => {
      openWorkflowBuilderModal(() => renderWorkflows());
    });
  }

  async function renderWorkflows() {
    if (!listContainer) return;
    try {
      const workflows = await workflowService.getWorkflows();
      if (!workflows.length) {
        listContainer.innerHTML = `
          <div class="glass-panel" style="padding: 2.5rem; text-align: center;">
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">No custom automations yet.</p>
            <button class="btn btn-primary btn-sm" id="empty-new-wf-btn">+ Create First Automation</button>
          </div>
        `;
        const emptyBtn = document.getElementById('empty-new-wf-btn');
        if (emptyBtn) emptyBtn.onclick = () => openWorkflowBuilderModal(() => renderWorkflows());
        return;
      }

      listContainer.innerHTML = workflows.map(wf => `
        <div class="workflow-card">
          <div class="workflow-top">
            <div class="workflow-title-wrap">
              <div class="workflow-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>
              </div>
              <div>
                <h3 class="workflow-title">${wf.name}</h3>
                <p class="workflow-desc">${wf.description || 'Active autonomous workflow rule'}</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 1rem;">
              <label class="switch" title="Toggle Automation">
                <input type="checkbox" class="wf-toggle" data-id="${wf.id}" ${wf.is_active ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <button class="btn btn-ghost btn-sm wf-delete-btn" data-id="${wf.id}" title="Delete Automation" style="color: var(--danger);">✕</button>
            </div>
          </div>

          <div class="pipeline-chain">
            <div class="pipeline-node trigger">
              <span>⚡ IF:</span>
              <strong>${formatTrigger(wf.trigger_type)}</strong>
            </div>
            <span class="pipeline-arrow">➔</span>
            <div class="pipeline-node action">
              <span>⚡ THEN:</span>
              <strong>${formatAction(wf.action_type)}</strong>
            </div>
          </div>

          <div class="workflow-footer">
            <span>Created ${timeAgo(wf.created_at)}</span>
            <span style="color: ${wf.is_active ? 'var(--success)' : 'var(--text-muted)'}; font-weight: 600;">
              ${wf.is_active ? '● Running in background' : '○ Paused'}
            </span>
          </div>
        </div>
      `).join('');

      // Wire toggles
      listContainer.querySelectorAll('.wf-toggle').forEach(input => {
        input.addEventListener('change', async (e) => {
          const id = e.target.dataset.id;
          const isActive = e.target.checked;
          await workflowService.toggleWorkflow(id, isActive);
          showToast(`Automation ${isActive ? 'activated' : 'paused'}.`, 'info');
          renderWorkflows();
        });
      });

      // Wire delete
      listContainer.querySelectorAll('.wf-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm('Delete this automation rule?')) {
            await workflowService.deleteWorkflow(id);
            showToast('Automation rule removed.', 'info');
            renderWorkflows();
          }
        });
      });
    } catch (err) {
      console.error('Error rendering workflows:', err);
    }
  }

  async function renderRunLogs() {
    if (!runLogsContainer) return;
    try {
      const runs = await workflowService.getRuns();
      if (!runs.length) {
        runLogsContainer.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No execution logs recorded yet.</td></tr>`;
        return;
      }

      runLogsContainer.innerHTML = runs.map(r => `
        <tr>
          <td><span class="badge ${r.status === 'success' ? 'badge-low' : 'badge-high'}">${r.status}</span></td>
          <td style="color: var(--text-secondary); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.details?.message || 'Trigger event processed'}</td>
          <td style="color: var(--text-muted); font-size: 0.75rem;">${timeAgo(r.executed_at)}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error rendering runs:', err);
    }
  }

  function formatTrigger(t) {
    if (t === 'task_overdue') return 'Task Overdue';
    if (t === 'deadline_approaching') return 'Deadline < 24h';
    if (t === 'task_completed') return 'Task Completed';
    if (t === 'subtasks_completed') return 'All Subtasks Done';
    return t;
  }

  function formatAction(a) {
    if (a === 'send_notification') return 'Alert Developer';
    if (a === 'mark_urgent') return 'Mark Urgent';
    if (a === 'update_project_progress') return 'Update Velocity';
    return a;
  }

  await renderWorkflows();
  await renderRunLogs();
}
