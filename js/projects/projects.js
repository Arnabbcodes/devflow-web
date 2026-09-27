/**
 * DevFlow Projects Page Controller
 */

import { projectService } from '../services/projectService.js';
import { taskService } from '../services/taskService.js';
import { openProjectDetails } from './projectDetails.js';
import { getInitials } from '../utils/helpers.js';
import { showToast } from '../utils/notifications.js';

export async function initProjectsPage() {
  const container = document.getElementById('projects-grid-container');
  const searchInput = document.getElementById('projects-search');
  const newProjectBtn = document.getElementById('new-project-btn');

  if (newProjectBtn) {
    newProjectBtn.addEventListener('click', openCreateProjectModal);
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => renderProjects());
  }

  async function renderProjects() {
    if (!container) return;
    try {
      let projects = await projectService.getProjects();
      const allTasks = await taskService.getTasks();

      const query = (searchInput?.value || '').toLowerCase().trim();
      if (query) {
        projects = projects.filter(p => 
          p.name.toLowerCase().includes(query) || 
          (p.description && p.description.toLowerCase().includes(query))
        );
      }

      if (projects.length === 0) {
        container.innerHTML = `
          <div class="empty-state-card">
            <img src="assets/images/empty-projects.svg" alt="No projects" />
            <h3>No projects found</h3>
            <p>Kickstart your developer workflow by assembling your first software project.</p>
            <button class="btn btn-primary" id="empty-add-proj-btn">+ Create Project</button>
          </div>
        `;
        const btn = document.getElementById('empty-add-proj-btn');
        if (btn) btn.onclick = openCreateProjectModal;
        return;
      }

      container.innerHTML = projects.map(p => {
        const pTasks = allTasks.filter(t => t.project_id === p.id);
        const tagsHtml = (p.tech_stack || []).map(t => `<span class="tag font-mono">${t}</span>`).join('');

        return `
          <div class="project-card" data-id="${p.id}">
            <div class="project-top">
              <div class="project-color-badge" style="background: ${p.color || '#6366f1'};">
                ${getInitials(p.name)}
              </div>
              <div class="project-actions">
                <button class="project-menu-btn delete-proj-btn" data-id="${p.id}" title="Delete project">✕</button>
              </div>
            </div>
            
            <h3 class="project-name">${p.name}</h3>
            <p class="project-desc">${p.description || 'No description provided.'}</p>
            
            <div class="project-tags">
              ${tagsHtml}
            </div>

            <div class="project-meta-stats">
              <span>Velocity</span>
              <span class="font-mono">${p.progress}%</span>
            </div>
            <div class="progress-bar-bg" style="margin-bottom: 1.25rem;">
              <div class="progress-bar-fill" style="width: ${p.progress}%; background: ${p.color || 'var(--primary)'};"></div>
            </div>

            <div class="project-footer">
              <span style="font-size: 0.8rem; color: var(--text-muted);">${pTasks.length} linked tasks</span>
              <button class="btn btn-secondary btn-sm open-proj-details-btn" data-id="${p.id}">
                Details &amp; Tasks →
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Wire detail buttons
      container.querySelectorAll('.open-proj-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          openProjectDetails(id, () => renderProjects());
        });
      });

      // Wire delete buttons
      container.querySelectorAll('.delete-proj-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          if (confirm('Delete this project and dissociate its tasks?')) {
            await projectService.deleteProject(id);
            showToast('Project deleted', 'info');
            renderProjects();
          }
        });
      });

    } catch (err) {
      console.error("Error rendering projects:", err);
    }
  }

  function openCreateProjectModal() {
    const modalBackdrop = document.getElementById('app-modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body-content');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    modalTitle.textContent = 'Create New Project';
    confirmBtn.textContent = 'Create Project';

    modalBody.innerHTML = `
      <form id="create-project-form">
        <div class="form-group">
          <label class="form-label">Project Name</label>
          <input type="text" id="new-proj-name" class="form-control" placeholder="e.g. Next-Gen Authentication API" required />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="new-proj-desc" class="form-control" rows="2" placeholder="Describe the goal and architecture of this project..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Tech Stack (comma-separated)</label>
          <input type="text" id="new-proj-tech" class="form-control" placeholder="Supabase, Groq, TypeScript, Next.js" />
        </div>

        <div class="form-group">
          <label class="form-label">Accent Theme Color</label>
          <div style="display:flex; gap:0.5rem;">
            <input type="color" id="new-proj-color" value="#6366f1" style="height: 38px; width: 60px; cursor: pointer; background: transparent; border: 1px solid var(--border-card); border-radius: var(--radius-sm);" />
            <input type="text" id="new-proj-repo" class="form-control" placeholder="GitHub Repository URL (optional)" />
          </div>
        </div>
      </form>
    `;

    modalBackdrop.classList.add('active');

    const handleCreate = async () => {
      const name = document.getElementById('new-proj-name').value.trim();
      const description = document.getElementById('new-proj-desc').value.trim();
      const techRaw = document.getElementById('new-proj-tech').value;
      const color = document.getElementById('new-proj-color').value;
      const repo_url = document.getElementById('new-proj-repo').value.trim();

      if (!name) {
        showToast('Project name is required.', 'warning');
        return;
      }

      const tech_stack = techRaw ? techRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

      try {
        await projectService.createProject({
          name,
          description,
          tech_stack,
          color,
          repo_url,
          progress: 0,
          status: 'active'
        });
        showToast('Project created successfully!', 'success');
        modalBackdrop.classList.remove('active');
        confirmBtn.removeEventListener('click', handleCreate);
        renderProjects();
      } catch (err) {
        showToast(`Error creating project: ${err.message}`, 'error');
      }
    };

    confirmBtn.onclick = handleCreate;
  }

  await renderProjects();
}
