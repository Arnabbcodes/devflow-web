/**
 * DevFlow Dashboard Page Controller
 */

import { renderDashboardStats } from './statistics.js';
import { renderActivityFeed } from './activity.js';
import { taskService } from '../services/taskService.js';
import { projectService } from '../services/projectService.js';
import { generateDailyPlan } from '../ai/dailyPlanner.js';
import { formatDate } from '../utils/dateUtils.js';

export async function initDashboardPage(currentUser) {
  // Personalized Greeting
  const greetingEl = document.getElementById('dash-greeting');
  const dateEl = document.getElementById('dash-today-date');

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const devName = currentUser?.name || 'Developer';

  if (greetingEl) greetingEl.textContent = `${timeGreeting}, ${devName} 🚀`;
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  // Render Stats & Activity
  await renderDashboardStats();
  renderActivityFeed();

  // Load Priority Sprint Tasks
  const sprintTasksContainer = document.getElementById('dash-sprint-tasks');
  if (sprintTasksContainer) {
    try {
      const tasks = await taskService.getTasks();
      const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 4);

      if (activeTasks.length === 0) {
        sprintTasksContainer.innerHTML = `
          <div style="text-align:center; padding: 2rem; color: var(--text-secondary);">
            <p>All caught up! No pending sprint tasks.</p>
            <a href="tasks.html" class="btn btn-secondary btn-sm" style="margin-top:0.75rem;">Create a Task</a>
          </div>
        `;
      } else {
        sprintTasksContainer.innerHTML = activeTasks.map(t => `
          <div class="task-list-item">
            <div style="display:flex; align-items:center; gap: 0.85rem;">
              <span class="badge badge-${t.priority}">${t.priority}</span>
              <div>
                <h4 style="font-size:0.92rem; font-weight:600; color:var(--text-primary); margin-bottom: 0.2rem;">${t.title}</h4>
                <span style="font-size:0.75rem; color:var(--text-muted);">Due: ${formatDate(t.due_date)} • ${t.estimated_minutes || 30} mins</span>
              </div>
            </div>
            <a href="tasks.html" class="btn btn-ghost btn-sm" title="View in Kanban">View →</a>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error("Error loading sprint tasks:", err);
    }
  }

  // AI Daily Plan Trigger
  const dailyPlanBtn = document.getElementById('trigger-daily-plan-btn');
  const aiPlanBanner = document.getElementById('ai-daily-plan-banner');
  const aiPlanContent = document.getElementById('ai-daily-plan-text');

  if (dailyPlanBtn) {
    dailyPlanBtn.addEventListener('click', async () => {
      const origText = dailyPlanBtn.innerHTML;
      dailyPlanBtn.disabled = true;
      dailyPlanBtn.innerHTML = '<span class="spinner"></span> Generating with Groq...';

      try {
        const plan = await generateDailyPlan();
        if (aiPlanBanner && aiPlanContent) {
          aiPlanBanner.style.display = 'flex';
          aiPlanContent.innerHTML = `
            <strong>🎯 Focus Goal:</strong> ${plan.focus_goal || 'Execute highest impact tasks'}<br>
            <div style="margin-top: 0.6rem; display: flex; flex-direction: column; gap: 0.35rem;">
              ${(plan.schedule || []).map(s => `
                <div style="font-size: 0.82rem; display: flex; gap: 0.5rem;">
                  <span class="font-mono" style="color: var(--secondary);">${s.time_block}:</span>
                  <span>${s.task}</span>
                </div>
              `).join('')}
            </div>
          `;
        }
      } catch (err) {
        console.error("AI daily plan error:", err);
      } finally {
        dailyPlanBtn.disabled = false;
        dailyPlanBtn.innerHTML = origText;
      }
    });
  }
}
