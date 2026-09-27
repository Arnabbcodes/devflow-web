/**
 * DevFlow Helper Utilities
 */

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getInitials(name) {
  if (!name) return 'DF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const STORAGE_KEYS = {
  DEVFLOW_CONFIG: 'devflow_user_config',
  LOCAL_PROJECTS: 'devflow_mock_projects',
  LOCAL_TASKS: 'devflow_mock_tasks',
  LOCAL_SUBTASKS: 'devflow_mock_subtasks',
  LOCAL_WORKFLOWS: 'devflow_mock_workflows',
  LOCAL_WORKFLOW_RUNS: 'devflow_mock_workflow_runs',
  LOCAL_NOTES: 'devflow_mock_notes',
  LOCAL_FOCUS_SESSIONS: 'devflow_mock_focus_sessions',
  LOCAL_NOTIFICATIONS: 'devflow_mock_notifications',
  LOCAL_ACTIVITY: 'devflow_mock_activity',
  LOCAL_USER: 'devflow_demo_user',
  DEMO_BANNER_DISMISSED: 'devflow_banner_dismissed'
};
