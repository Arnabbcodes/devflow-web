/**
 * DevFlow Profile & API Settings Controller
 */

import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured, saveSupabaseConfig, clearSupabaseConfig, supabaseClient } from '../config/supabase.js';
import { STORAGE_KEYS } from '../utils/helpers.js';
import { showToast } from '../utils/notifications.js';

export async function initProfilePage(currentUser) {
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const roleInput = document.getElementById('profile-role');
  const profileForm = document.getElementById('profile-form');

  const supabaseUrlInput = document.getElementById('cfg-supabase-url');
  const supabaseKeyInput = document.getElementById('cfg-supabase-key');
  const saveKeysBtn = document.getElementById('btn-save-keys');
  const clearKeysBtn = document.getElementById('btn-clear-keys');
  const connectionBadge = document.getElementById('connection-status-badge');
  const exportDataBtn = document.getElementById('btn-export-data');

  // Fill profile fields
  if (nameInput) nameInput.value = currentUser?.name || '';
  if (emailInput) emailInput.value = currentUser?.email || '';
  if (roleInput) roleInput.value = currentUser?.role || 'Full-Stack Developer';

  // Fill API config fields
  if (supabaseUrlInput) {
    supabaseUrlInput.value = isSupabaseConfigured() ? SUPABASE_URL : '';
  }
  if (supabaseKeyInput) {
    supabaseKeyInput.value = isSupabaseConfigured() ? SUPABASE_KEY : '';
  }

  // Update status badge
  if (connectionBadge) {
    if (isSupabaseConfigured()) {
      connectionBadge.className = 'badge badge-low';
      connectionBadge.innerHTML = '● Connected to Cloud Supabase';
    } else {
      connectionBadge.className = 'badge badge-medium';
      connectionBadge.innerHTML = '⚡ Local Simulation Mode';
    }
  }

  // Save profile updates
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updatedUser = {
        ...currentUser,
        name: nameInput.value.trim(),
        role: roleInput.value.trim()
      };

      if (isSupabaseConfigured() && supabaseClient) {
        try {
          await supabaseClient.auth.updateUser({
            data: { full_name: updatedUser.name, role: updatedUser.role }
          });
        } catch (err) {
          console.warn("Could not sync profile to auth table:", err);
        }
      }

      localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(updatedUser));
      showToast('Profile updated!', 'success');
      setTimeout(() => window.location.reload(), 400);
    });
  }

  // Save Supabase credentials from UI
  if (saveKeysBtn) {
    saveKeysBtn.addEventListener('click', () => {
      const url = supabaseUrlInput.value.trim();
      const key = supabaseKeyInput.value.trim();

      if (!url || !key) {
        showToast('Please enter both Supabase Project URL and Anon Key.', 'warning');
        return;
      }

      saveSupabaseConfig(url, key);
    });
  }

  if (clearKeysBtn) {
    clearKeysBtn.addEventListener('click', () => {
      if (confirm('Switch back to local simulation mode?')) {
        clearSupabaseConfig();
      }
    });
  }

  // Export workspace data
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      const exportPayload = {
        exported_at: new Date().toISOString(),
        projects: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_PROJECTS) || '[]'),
        tasks: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_TASKS) || '[]'),
        notes: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_NOTES) || '[]')
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devflow-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Workspace data exported!', 'success');
    });
  }
}
