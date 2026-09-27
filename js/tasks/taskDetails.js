/**
 * DevFlow Task Details & Subtasks Drawer
 */

import { taskService } from '../services/taskService.js';
import { breakdownTaskWithAI } from '../ai/taskBreakdown.js';
import { formatDate } from '../utils/dateUtils.js';
import { showToast } from '../utils/notifications.js';

export async function openTaskDetails(taskId, onRefresh) {
  const modalBackdrop = document.getElementById('app-modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body-content');
  const confirmBtn = document.getElementById('modal-confirm-btn');

  const task = await taskService.getTaskById(taskId);
  if (!task) return;

  const subtasks = await taskService.getSubtasks(taskId);

  modalTitle.textContent = task.title;
  confirmBtn.textContent = 'Done';

  async function renderModalContent() {
    const freshSubtasks = await taskService.getSubtasks(taskId);

    modalBody.innerHTML = `
      <div style="margin-bottom: 1.25rem;">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom: 0.75rem;">
          <span class="badge badge-status badge-${task.status}">${task.status}</span>
          <span class="badge badge-${task.priority}">${task.priority}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Due: ${formatDate(task.due_date)}</span>
        </div>

        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.25rem;">
          ${task.description || 'No description provided.'}
        </p>

        <!-- Subtasks Section -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700;">Subtasks (${freshSubtasks.filter(s => s.is_completed).length}/${freshSubtasks.length})</h4>
          <button class="btn btn-ai btn-sm" id="btn-modal-ai-breakdown">
            ⚡ Groq AI Breakdown
          </button>
        </div>

        <div id="subtasks-container" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; max-height: 220px; overflow-y: auto;">
          ${freshSubtasks.length === 0 ? '<p style="color:var(--text-muted); font-size:0.82rem;">No subtasks created yet. Click Groq AI Breakdown to generate automatically.</p>' : freshSubtasks.map(s => `
            <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.25); border-radius: var(--radius-sm);">
              <input type="checkbox" class="subtask-checkbox" data-id="${s.id}" ${s.is_completed ? 'checked' : ''} style="cursor:pointer;" />
              <span style="font-size: 0.85rem; ${s.is_completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${s.title}</span>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <input type="text" id="new-subtask-title" class="form-control" placeholder="Add a new subtask..." style="font-size: 0.85rem; padding: 0.5rem 0.75rem;" />
          <button class="btn btn-secondary btn-sm" id="btn-add-subtask">Add</button>
        </div>
      </div>
    `;

    // Wire AI breakdown
    const aiBtn = document.getElementById('btn-modal-ai-breakdown');
    if (aiBtn) {
      aiBtn.onclick = async () => {
        aiBtn.disabled = true;
        aiBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
        await breakdownTaskWithAI(taskId, task.title + ': ' + (task.description || ''));
        aiBtn.disabled = false;
        aiBtn.innerHTML = '⚡ Groq AI Breakdown';
        await renderModalContent();
        if (onRefresh) onRefresh();
      };
    }

    // Wire subtask checkboxes
    modalBody.querySelectorAll('.subtask-checkbox').forEach(box => {
      box.addEventListener('change', async (e) => {
        const subId = e.target.dataset.id;
        const isCompleted = e.target.checked;
        await taskService.toggleSubtask(subId, isCompleted);
        await renderModalContent();
        if (onRefresh) onRefresh();
      });
    });

    // Wire add subtask
    const addBtn = document.getElementById('btn-add-subtask');
    const input = document.getElementById('new-subtask-title');
    if (addBtn && input) {
      addBtn.onclick = async () => {
        const val = input.value.trim();
        if (val) {
          await taskService.addSubtask(taskId, val);
          await renderModalContent();
          if (onRefresh) onRefresh();
        }
      };
    }
  }

  await renderModalContent();
  modalBackdrop.classList.add('active');

  confirmBtn.onclick = () => {
    modalBackdrop.classList.remove('active');
  };
}
