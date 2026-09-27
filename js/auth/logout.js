/**
 * DevFlow Logout Controller
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { STORAGE_KEYS } from '../utils/helpers.js';
import { showToast } from '../utils/notifications.js';

export async function handleLogout() {
  try {
    if (isSupabaseConfigured() && supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  } catch (err) {
    console.warn("Error signing out from Supabase:", err);
  } finally {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
    showToast('Signed out of DevFlow.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 300);
  }
}
