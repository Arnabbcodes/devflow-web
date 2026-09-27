/**
 * DevFlow Analytics Page Controller
 */

import { analyticsService } from '../services/analyticsService.js';
import { taskService } from '../services/taskService.js';
import { projectService } from '../services/projectService.js';
import { renderBarChart, renderDonutChart } from './charts.js';
import { formatDurationMinutes } from '../utils/dateUtils.js';

export async function initAnalyticsPage() {
  try {
    const metrics = await analyticsService.getOverallMetrics();
    const tasks = await taskService.getTasks();
    const projects = await projectService.getProjects();

    // Populate stat counters
    const rateEl = document.getElementById('analytics-completion-rate');
    const focusEl = document.getElementById('analytics-focus-hours');
    const overdueEl = document.getElementById('analytics-overdue-count');
    const totalEl = document.getElementById('analytics-total-count');

    if (rateEl) rateEl.textContent = `${metrics.completionRate}%`;
    if (focusEl) focusEl.textContent = formatDurationMinutes(metrics.totalFocusMinutes);
    if (overdueEl) overdueEl.textContent = metrics.overdueTasks;
    if (totalEl) totalEl.textContent = metrics.totalTasks;

    // Render SVG Charts
    renderBarChart('velocity-bar-chart-container', metrics.past7Days);
    renderDonutChart('status-donut-chart-container', metrics.statusCounts);

    // Render Project Breakdown Table
    const tableBody = document.getElementById('analytics-projects-table-body');
    if (tableBody) {
      if (projects.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding: 1.5rem;">No projects to analyze.</td></tr>`;
      } else {
        tableBody.innerHTML = projects.map(p => {
          const pTasks = tasks.filter(t => t.project_id === p.id);
          const pDone = pTasks.filter(t => t.status === 'done').length;
          const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : p.progress;

          return `
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="width:10px; height:10px; border-radius:50%; background:${p.color || 'var(--primary)'};"></span>
                  <strong>${p.name}</strong>
                </div>
              </td>
              <td>${pTasks.length}</td>
              <td>${pDone}</td>
              <td>
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  <div class="progress-bar-bg" style="width: 100px;">
                    <div class="progress-bar-fill" style="width: ${pct}%; background:${p.color || 'var(--primary)'};"></div>
                  </div>
                  <span class="font-mono" style="font-size:0.8rem;">${pct}%</span>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error("Error loading analytics:", err);
  }
}
