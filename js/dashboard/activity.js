/**
 * DevFlow Activity Timeline Renderer
 */

import { timeAgo } from '../utils/dateUtils.js';

export function renderActivityFeed(containerId = 'activity-feed-list') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const mockActivities = [
    { type: 'ai', text: 'Groq AI decomposed "Deploy Groq AI Supabase Edge Function" into 4 subtasks', time: new Date(Date.now() - 15 * 60000).toISOString() },
    { type: 'complete', text: 'Completed subtask "Add GROQ_API_KEY to Supabase Secrets"', time: new Date(Date.now() - 45 * 60000).toISOString() },
    { type: 'create', text: 'Created new project "Stripe Webhook Gateway"', time: new Date(Date.now() - 180 * 60000).toISOString() },
    { type: 'focus', text: 'Finished 50min Flow State deep work session on Edge Functions', time: new Date(Date.now() - 360 * 60000).toISOString() }
  ];

  container.innerHTML = mockActivities.map(act => `
    <div class="activity-item">
      <div class="activity-bullet action-${act.type}"></div>
      <div class="activity-details">
        <p class="activity-text">${act.text}</p>
        <div class="activity-time">${timeAgo(act.time)}</div>
      </div>
    </div>
  `).join('');
}
