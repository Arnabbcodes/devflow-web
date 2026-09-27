/**
 * DevFlow Toast & In-App Notification Manager
 */

export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span style="font-weight:bold; font-size:1.1rem; line-height:1;">${iconMap[type] || '•'}</span>
    <span style="flex:1;">${message}</span>
    <button class="toast-close" style="background:transparent; border:none; color:inherit; opacity:0.6; cursor:pointer; font-size:0.9rem;">✕</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  const dismiss = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.95)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  };

  closeBtn.addEventListener('click', dismiss);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}
