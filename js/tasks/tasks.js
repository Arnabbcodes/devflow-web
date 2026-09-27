/**
 * DevFlow Tasks Page Controller
 * Manages Kanban board, drag & drop, list view, and AI breakdown interactions
 */

import { taskService } from '../services/taskService.js';
import { projectService } from '../services/projectService.js';
import { setupTaskFilters, filterTasks, taskFilterState } from './taskFilters.js';
import { openCreateTaskModal } from './taskCreate.js';
import { openEditTaskModal } from './taskEdit.js';
import { openTaskDetails } from './taskDetails.js';
import { breakdownTaskWithAI } from '../ai/taskBreakdown.js';
import { formatDate, isOverdue } from '../utils/dateUtils.js';
import { showToast } from '../utils/notifications.js';

export async function initTasksPage() {
  const kanbanBoard = document.getElementById('kanban-board');
  const listView = document.getElementById('tasks-list-container');
  const newTaskBtn = document.getElementById('new-task-btn');
  const filterProjectSelect = document.getElementById('tasks-filter-project');

  // Populate projects in filter dropdown
  const projects = await projectService.getProjects();
  if (filterProjectSelect) {
    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      filterProjectSelect.appendChild(opt);
    });
  }

  // Setup filters
  setupTaskFilters(() => renderView());

  if (newTaskBtn) {
    newTaskBtn.addEventListener('click', () => {
      openCreateTaskModal(() => renderView());
    });
  }

  async function renderView() {
    const rawTasks = await taskService.getTasks();
    const tasks = filterTasks(rawTasks);

    if (taskFilterState.viewMode === 'kanban') {
      if (kanbanBoard) kanbanBoard.style.display = 'grid';
      if (listView) listView.style.display = 'none';
      renderKanban(tasks, projects);
    } else {
      if (kanbanBoard) kanbanBoard.style.display = 'none';
      if (listView) listView.style.display = 'flex';
      renderList(tasks, projects);
    }
  }

  function renderKanban(tasks, projects) {
    const columns = {
      todo: document.getElementById('col-todo-cards'),
      in_progress: document.getElementById('col-inprogress-cards'),
      review: document.getElementById('col-review-cards'),
      done: document.getElementById('col-done-cards')
    };

    const counts = {
      todo: document.getElementById('col-todo-count'),
      in_progress: document.getElementById('col-inprogress-count'),
      review: document.getElementById('col-review-count'),
      done: document.getElementById('col-done-count')
    };

    // Reset columns
    Object.keys(columns).forEach(k => {
      if (columns[k]) columns[k].innerHTML = '';
      if (counts[k]) counts[k].textContent = '0';
    });

    const statusGroup = { todo: [], in_progress: [], review: [], done: [] };
    tasks.forEach(t => {
      if (statusGroup[t.status]) statusGroup[t.status].push(t);
      else statusGroup.todo.push(t);
    });

    Object.keys(statusGroup).forEach(status => {
      const colEl = columns[status];
      const countEl = counts[status];
      if (countEl) countEl.textContent = statusGroup[status].length;

      if (!colEl) return;

      if (statusGroup[status].length === 0) {
        colEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 2rem 0;">No tasks</div>`;
        return;
      }

      colEl.innerHTML = statusGroup[status].map(task => {
        const project = projects.find(p => p.id === task.project_id);
        const overdue = task.status !== 'done' && isOverdue(task.due_date);

        return `
          <div class="task-card" draggable="true" data-id="${task.id}">
            <div class="task-card-header">
              <span class="badge badge-${task.priority}">${task.priority}</span>
              <div style="display:flex; gap:0.25rem;">
                <button class="btn btn-ghost btn-icon btn-sm btn-edit-task" data-id="${task.id}" title="Edit task">✎</button>
                <button class="btn btn-ghost btn-icon btn-sm btn-del-task" data-id="${task.id}" title="Delete task" style="color:var(--danger);">✕</button>
              </div>
            </div>

            <h4 class="task-card-title card-title-clickable" data-id="${task.id}">${task.title}</h4>
            <p class="task-card-desc">${task.description || 'No description provided.'}</p>

            <div class="task-subtasks-preview">
              <span style="font-size:0.75rem;">${task.estimated_minutes || 30} mins</span>
              <button class="btn btn-ai btn-sm btn-card-breakdown" data-id="${task.id}" title="AI Subtask Breakdown">
                ⚡ Subtasks
              </button>
            </div>

            <div class="task-card-footer">
              <span class="task-due-date ${overdue ? 'overdue' : ''}">
                📅 ${formatDate(task.due_date)}
              </span>
              <span class="font-mono" style="font-size:0.72rem; color:var(--primary-light);">
                ${project ? project.name : 'Personal'}
              </span>
            </div>
          </div>
        `;
      }).join('');
    });

    attachCardEventListeners();
    setupDragAndDrop();
  }

  function renderList(tasks, projects) {
    if (!listView) return;

    if (tasks.length === 0) {
      listView.innerHTML = `<div class="empty-state-card"><h3>No tasks found</h3></div>`;
      return;
    }

    listView.innerHTML = tasks.map(task => {
      const project = projects.find(p => p.id === task.project_id);
      const isDone = task.status === 'done';

      return `
        <div class="task-list-item" data-id="${task.id}">
          <div style="display:flex; align-items:center; gap: 1rem;">
            <input type="checkbox" class="task-checkbox-toggle" data-id="${task.id}" ${isDone ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
            <div>
              <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); ${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                ${task.title}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); display:flex; gap:0.6rem; align-items:center;">
                <span>${project ? project.name : 'Personal'}</span>
                <span>•</span>
                <span>Due: ${formatDate(task.due_date)}</span>
              </div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap: 0.75rem;">
            <span class="badge badge-status badge-${task.status}">${task.status}</span>
            <span class="badge badge-${task.priority}">${task.priority}</span>
            <button class="btn btn-secondary btn-sm open-task-modal-btn" data-id="${task.id}">Details</button>
          </div>
        </div>
      `;
    }).join('');

    listView.querySelectorAll('.task-checkbox-toggle').forEach(box => {
      box.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.checked ? 'done' : 'in_progress';
        await taskService.updateTask(id, { status: newStatus });
        renderView();
      });
    });

    listView.querySelectorAll('.open-task-modal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        openTaskDetails(e.currentTarget.dataset.id, () => renderView());
      });
    });
  }

  function attachCardEventListeners() {
    // Open details on title click
    document.querySelectorAll('.card-title-clickable').forEach(el => {
      el.addEventListener('click', (e) => {
        openTaskDetails(e.currentTarget.dataset.id, () => renderView());
      });
    });

    // Breakdown button on card
    document.querySelectorAll('.btn-card-breakdown').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        openTaskDetails(id, () => renderView());
      });
    });

    // Edit button
    document.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditTaskModal(e.currentTarget.dataset.id, () => renderView());
      });
    });

    // Delete button
    document.querySelectorAll('.btn-del-task').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        if (confirm('Delete this task?')) {
          await taskService.deleteTask(id);
          showToast('Task removed', 'info');
          renderView();
        }
      });
    });
  }

  function setupDragAndDrop() {
    const cards = document.querySelectorAll('.task-card');
    const dropzones = document.querySelectorAll('.column-cards-container');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });

    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.style.background = 'rgba(99, 102, 241, 0.08)';
      });

      zone.addEventListener('dragleave', () => {
        zone.style.background = 'transparent';
      });

      zone.addEventListener('drop', async (e) => {
        e.preventDefault();
        zone.style.background = 'transparent';
        const taskId = e.dataTransfer.getData('text/plain');
        const targetStatus = zone.dataset.status;

        if (taskId && targetStatus) {
          await taskService.updateTask(taskId, { status: targetStatus });
          renderView();
        }
      });
    });
  }

  await renderView();
}
