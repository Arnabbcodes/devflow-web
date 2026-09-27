/**
 * DevFlow Auth Guard
 * Protects workspace pages and resolves current authenticated user identity
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { STORAGE_KEYS } from '../utils/helpers.js';

export async function getCurrentUser() {
  if (isSupabaseConfigured() && supabaseClient) {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        return {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          role: session.user.user_metadata?.role || 'Full-Stack Developer'
        };
      }
    } catch (err) {
      console.warn("Error getting Supabase session:", err);
    }
  }

  // Fallback to local demo user
  const stored = localStorage.getItem(STORAGE_KEYS.LOCAL_USER);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  return null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath.endsWith('login.html') || currentPath.endsWith('signup.html') || currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');

  if (!user && !isAuthPage) {
    window.location.href = 'login.html';
    return null;
  }

  return user;
}
