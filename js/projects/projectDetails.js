/**
 * DevFlow Project Details Modal / Drawer
 */

import { projectService } from '../services/projectService.js';
import { taskService } from '../services/taskService.js';
import { generateProjectBlueprint } from '../ai/projectPlanner.js';
import { showToast } from '../utils/notifications.js';

export async function openProjectDetails(projectId, onUpdate) {
  const modalBackdrop = document.getElementById('app-modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body-content');
  const confirmBtn = document.getElementById('modal-confirm-btn');

  const project = await projectService.getProjectById(projectId);
  if (!project) return;

  const tasks = await taskService.getTasks({ projectId });

  modalTitle.textContent = project.name;
  confirmBtn.textContent = 'Close';

  modalBody.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <p style="color: var(--text-secondary); margin-bottom: 0.75rem;">${project.description || 'No description provided.'}</p>
      
      <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1rem;">
        ${(project.tech_stack || []).map(t => `<span class="tag font-mono">${t}</span>`).join('')}
      </div>

      <div style="display:flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.4rem;">
        <span>Progress</span>
        <strong>${project.progress}%</strong>
      </div>
      <div class="progress-bar-bg" style="margin-bottom: 1.25rem;">
        <div class="progress-bar-fill" style="width: ${project.progress}%; background: ${project.color || 'var(--primary)'};"></div>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
        <button class="btn btn-ai btn-sm" id="btn-project-ai-blueprint">
          ⚡ Generate AI Blueprint with Groq
        </button>
        ${project.repo_url ? `<a href="${project.repo_url}" target="_blank" rel="noreferrer" class="btn btn-secondary btn-sm">GitHub Repo ↗</a>` : ''}
      </div>

      <div id="project-blueprint-result" class="glass-panel" style="display: none; padding: 1rem; margin-bottom: 1rem; font-size: 0.85rem;"></div>

      <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem;">Linked Tasks (${tasks.length})</h4>
      <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 200px; overflow-y: auto;">
        ${tasks.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.85rem;">No tasks created for this project yet.</p>' : tasks.map(t => `
          <div style="display:flex; align-items:center; justify-content:space-between; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">
            <div style="display:flex; align-items:center; gap: 0.5rem;">
              <span class="badge badge-status badge-${t.status}">${t.status}</span>
              <span style="font-size: 0.85rem;">${t.title}</span>
            </div>
            <span class="badge badge-${t.priority}">${t.priority}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modalBackdrop.classList.add('active');

  const blueprintBtn = document.getElementById('btn-project-ai-blueprint');
  if (blueprintBtn) {
    blueprintBtn.onclick = async () => {
      blueprintBtn.disabled = true;
      blueprintBtn.innerHTML = '<span class="spinner"></span> Architecting...';
      const bp = await generateProjectBlueprint(project.name, project.description);
      const resContainer = document.getElementById('project-blueprint-result');
      if (resContainer) {
        resContainer.style.display = 'block';
        resContainer.innerHTML = `
          <strong>Architectural Milestones:</strong>
          <ul style="margin: 0.5rem 0 0 1rem; list-style: disc;">
            ${(bp.milestones || []).map(m => `<li>${m}</li>`).join('')}
          </ul>
        `;
      }
      blueprintBtn.disabled = false;
      blueprintBtn.innerHTML = '⚡ Generate AI Blueprint with Groq';
    };
  }

  confirmBtn.onclick = () => {
    modalBackdrop.classList.remove('active');
  };
}
