/**
 * DevFlow Dashboard Statistics Renderer
 */

import { analyticsService } from '../services/analyticsService.js';
import { formatDurationMinutes } from '../utils/dateUtils.js';

export async function renderDashboardStats() {
  const metrics = await analyticsService.getOverallMetrics();

  const totalEl = document.getElementById('stat-total-tasks');
  const inProgressEl = document.getElementById('stat-in-progress');
  const focusTimeEl = document.getElementById('stat-focus-time');
  const velocityEl = document.getElementById('stat-completion-rate');

  if (totalEl) totalEl.textContent = metrics.totalTasks;
  if (inProgressEl) inProgressEl.textContent = metrics.inProgressTasks;
  if (focusTimeEl) focusTimeEl.textContent = formatDurationMinutes(metrics.totalFocusMinutes);
  if (velocityEl) velocityEl.textContent = `${metrics.completionRate}%`;

  return metrics;
}
