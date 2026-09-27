/**
 * DevFlow Main Application Entrypoint
 * Orchestrates page lifecycle, authentication guards, navigation, notifications, and AI modal
 */

import { requireAuth, getCurrentUser } from './auth/authGuard.js';
import { handleLogout } from './auth/logout.js';
import { notificationService } from './services/notificationService.js';
import { projectService } from './services/projectService.js';
import { taskService } from './services/taskService.js';
import { aiEngine } from './ai/ai.js';
import { getInitials, STORAGE_KEYS } from './utils/helpers.js';
import { timeAgo } from './utils/dateUtils.js';
import { showToast } from './utils/notifications.js';
import { isSupabaseConfigured } from './config/supabase.js';

// Page-specific controllers
import { initLoginPage } from './auth/login.js';
import { initSignupPage } from './auth/signup.js';
import { initDashboardPage } from './dashboard/dashboard.js';
import { initProjectsPage } from './projects/projects.js';
import { initTasksPage } from './tasks/tasks.js';
import { initWorkflowPage } from './workflow/workflow.js';
import { initAnalyticsPage } from './analytics/analytics.js';
import { initFocusPage } from './focus/focus.js';
import { initNotesPage } from './notes/notes.js';
import { initProfilePage } from './profile/profile.js';

document.addEventListener('DOMContentLoaded', async () => {
  const currentPath = window.location.pathname;

  // 1. Auth pages (login, signup, index)
  if (currentPath.endsWith('login.html')) {
    initLoginPage();
    return;
  }
  if (currentPath.endsWith('signup.html')) {
    initSignupPage();
    return;
  }
  if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
    // Landing page handles its own live preview interactions
    setupLandingPage();
    return;
  }

  // 2. Protected Workspace routes
  const currentUser = await requireAuth();
  if (!currentUser) return;

  // 3. Initialize Global UI shell
  setupGlobalShell(currentUser);

  // 4. Initialize Specific Workspace Page
  if (currentPath.endsWith('dashboard.html')) {
    initDashboardPage(currentUser);
  } else if (currentPath.endsWith('projects.html')) {
    initProjectsPage();
  } else if (currentPath.endsWith('tasks.html')) {
    initTasksPage();
  } else if (currentPath.endsWith('workflow.html')) {
    initWorkflowPage();
  } else if (currentPath.endsWith('analytics.html')) {
    initAnalyticsPage();
  } else if (currentPath.endsWith('focus.html')) {
    initFocusPage();
  } else if (currentPath.endsWith('notes.html')) {
    initNotesPage();
  } else if (currentPath.endsWith('profile.html')) {
    initProfilePage(currentUser);
  }
});

function setupGlobalShell(user) {
  // Populate User Profile in Sidebar & Navbar
  const initials = getInitials(user.name);
  const avatarEls = document.querySelectorAll('.user-avatar, #nav-user-avatar, #sidebar-user-avatar');
  avatarEls.forEach(el => el.textContent = initials);

  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  if (nameEl) nameEl.textContent = user.name || 'Developer';
  if (roleEl) roleEl.textContent = user.role || 'Full-Stack Developer';

  // Highlight Active Navigation Link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
    const page = link.dataset.page;
    if (page && currentPath.includes(page)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Mobile Drawer Toggle
  const mobileToggle = document.getElementById('mobile-sidebar-toggle');
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (mobileToggle && sidebar && overlay) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Setup Notification Center
  setupNotificationCenter();

  // Setup Global AI Assistant Modal
  setupGlobalAIPanel();

  // Setup Global Modal Close
  setupModalBackdrop();

  // Update counts in sidebar
  updateSidebarCounts();

  // Demo Banner Handling
  setupDemoBanner();
}

function setupDemoBanner() {
  const banner = document.getElementById('demo-mode-banner');
  const closeBtn = document.getElementById('close-demo-banner');
  const isDismissed = sessionStorage.getItem(STORAGE_KEYS.DEMO_BANNER_DISMISSED);

  if (banner) {
    if (isSupabaseConfigured() || isDismissed) {
      banner.classList.add('hidden');
    } else {
      banner.classList.remove('hidden');
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        banner.classList.add('hidden');
        sessionStorage.setItem(STORAGE_KEYS.DEMO_BANNER_DISMISSED, 'true');
      });
    }
  }
}

async function updateSidebarCounts() {
  try {
    const pCountEl = document.getElementById('sidebar-projects-count');
    const tCountEl = document.getElementById('sidebar-tasks-count');

    if (pCountEl) {
      const projects = await projectService.getProjects();
      pCountEl.textContent = projects.length;
    }

    if (tCountEl) {
      const tasks = await taskService.getTasks();
      const pending = tasks.filter(t => t.status !== 'done').length;
      tCountEl.textContent = pending;
    }
  } catch (err) {
    console.warn("Could not load sidebar counts:", err);
  }
}

async function setupNotificationCenter() {
  const notifBtn = document.getElementById('notification-btn');
  const notifDropdown = document.getElementById('notification-dropdown');
  const notifList = document.getElementById('notification-items-list');
  const notifDot = document.getElementById('unread-notification-dot');
  const markReadBtn = document.getElementById('mark-all-read-btn');

  if (!notifBtn || !notifDropdown) return;

  async function refreshNotifications() {
    const notifications = await notificationService.getNotifications();
    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (notifDot) {
      notifDot.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    if (notifList) {
      if (notifications.length === 0) {
        notifList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem;">No notifications</div>`;
      } else {
        notifList.innerHTML = notifications.slice(0, 6).map(n => `
          <div style="padding: 0.6rem; border-radius: var(--radius-sm); background: ${n.is_read ? 'transparent' : 'rgba(99,102,241,0.08)'}; border-left: 3px solid ${n.type === 'urgent' ? 'var(--danger)' : 'var(--primary)'};">
            <div style="display:flex; justify-content: space-between; font-size: 0.78rem;">
              <strong style="color:var(--text-primary);">${n.title}</strong>
              <span style="color:var(--text-muted); font-size: 0.7rem;">${timeAgo(n.created_at)}</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">${n.message}</p>
          </div>
        `).join('');
      }
    }
  }

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = notifDropdown.style.display === 'block';
    notifDropdown.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) refreshNotifications();
  });

  document.addEventListener('click', (e) => {
    if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
      notifDropdown.style.display = 'none';
    }
  });

  if (markReadBtn) {
    markReadBtn.addEventListener('click', async () => {
      await notificationService.markAllAsRead();
      refreshNotifications();
      showToast('All notifications marked read', 'info');
    });
  }

  await refreshNotifications();
}

function setupGlobalAIPanel() {
  const globalAiBtn = document.getElementById('global-ai-btn');
  const aiModal = document.getElementById('ai-assistant-modal');
  const aiCloseBtn = document.getElementById('ai-modal-close');
  const aiRunBtn = document.getElementById('ai-run-btn');
  const aiInput = document.getElementById('ai-prompt-input');
  const aiResultArea = document.getElementById('ai-result-area');
  const aiResultContent = document.getElementById('ai-result-content');
  const aiSpinner = document.getElementById('ai-result-spinner');
  const presetBtns = document.querySelectorAll('.ai-preset-btn');

  if (!globalAiBtn || !aiModal) return;

  globalAiBtn.addEventListener('click', () => {
    aiModal.classList.add('active');
  });

  if (aiCloseBtn) {
    aiCloseBtn.addEventListener('click', () => {
      aiModal.classList.remove('active');
    });
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('btn-primary'));
      btn.classList.add('btn-primary');
      const mode = btn.dataset.mode;
      if (mode === 'breakdown') {
        aiInput.value = 'Implement user role management with RBAC policies and permission gates';
      } else if (mode === 'daily') {
        aiInput.value = 'Review pull requests, refactor auth middleware, and deploy production Edge Function';
      } else if (mode === 'priority') {
        aiInput.value = 'Fix memory leak occurring during high-concurrency WebSocket broadcast';
      } else if (mode === 'project') {
        aiInput.value = 'Autonomous GitHub issue triage bot using Groq AI and Webhooks';
      }
    });
  });

  if (aiRunBtn && aiInput) {
    aiRunBtn.addEventListener('click', async () => {
      const prompt = aiInput.value.trim();
      if (!prompt) {
        showToast('Please enter an engineering task or prompt for Groq.', 'warning');
        return;
      }

      if (aiResultArea) aiResultArea.style.display = 'block';
      if (aiSpinner) aiSpinner.style.display = 'block';
      if (aiResultContent) aiResultContent.innerHTML = '';

      aiRunBtn.disabled = true;

      try {
        const activePreset = document.querySelector('.ai-preset-btn.btn-primary');
        const mode = activePreset ? activePreset.dataset.mode : 'breakdown';
        const actionMap = {
          breakdown: 'task_breakdown',
          daily: 'daily_plan',
          priority: 'priority_analyzer',
          project: 'project_planner'
        };

        const result = await aiEngine.callGroq(actionMap[mode] || 'task_breakdown', {
          task: prompt,
          description: prompt,
          project: prompt
        });

        if (aiSpinner) aiSpinner.style.display = 'none';

        if (aiResultContent) {
          aiResultContent.innerHTML = `
            <div style="color: var(--secondary); font-weight: 700; margin-bottom: 0.5rem;">Groq Llama 3 Output:</div>
            <pre class="font-mono" style="background: rgba(0,0,0,0.4); padding: 1rem; border-radius: var(--radius-sm); overflow-x: auto; color: #a5f3fc;">${JSON.stringify(result, null, 2)}</pre>
          `;
        }
      } catch (err) {
        if (aiSpinner) aiSpinner.style.display = 'none';
        if (aiResultContent) {
          aiResultContent.innerHTML = `<span style="color:var(--danger);">Error running AI inference: ${err.message}</span>`;
        }
      } finally {
        aiRunBtn.disabled = false;
      }
    });
  }
}

function setupModalBackdrop() {
  const backdrop = document.getElementById('app-modal-backdrop');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  const close = () => {
    if (backdrop) backdrop.classList.remove('active');
  };

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
  }
}

function setupLandingPage() {
  // Interactive teaser demo on landing page
  const demoInput = document.getElementById('landing-task-input');
  const demoBtn = document.getElementById('landing-breakdown-btn');
  const demoOutput = document.getElementById('landing-subtasks-preview');

  if (demoBtn && demoInput && demoOutput) {
    demoBtn.addEventListener('click', async () => {
      const task = demoInput.value.trim() || 'Build authentication system';
      demoBtn.disabled = true;
      demoBtn.innerHTML = '<span class="spinner"></span> Architecting...';

      const result = await aiEngine.callGroq('task_breakdown', { task });
      demoBtn.disabled = false;
      demoBtn.innerHTML = 'Break Down with AI ⚡';

      demoOutput.innerHTML = (result.subtasks || []).map(s => `
        <div style="padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--secondary);">✓</span>
          <span>${s}</span>
        </div>
      `).join('');
    });
  }
}
