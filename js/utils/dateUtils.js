/**
 * DevFlow Date and Time Utilities
 */

export function formatDate(dateStr) {
  if (!dateStr) return 'No due date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  // Due before beginning of today
  return due.getTime() < now.getTime();
}

export function isDueWithinHours(dateStr, hours = 24) {
  if (!dateStr) return false;
  const due = new Date(dateStr).getTime();
  const now = Date.now();
  const diffHours = (due - now) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= hours;
}

export function timeAgo(dateStr) {
  if (!dateStr) return 'just now';
  const timestamp = new Date(dateStr).getTime();
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function formatDurationMinutes(mins) {
  if (!mins || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
