/**
 * DevFlow Notification Service
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { STORAGE_KEYS, generateUUID } from '../utils/helpers.js';
import { showToast } from '../utils/notifications.js';

const INITIAL_MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Welcome to DevFlow',
    message: 'Your developer workspace is ready. Try breaking down a task with Groq AI or start a Pomodoro timer.',
    type: 'info',
    is_read: false,
    created_at: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: 'notif-2',
    title: 'Automation Triggered',
    message: 'Task "Deploy Groq AI Supabase Edge Function" marked urgent (deadline in < 24h).',
    type: 'urgent',
    is_read: false,
    created_at: new Date(Date.now() - 120 * 60000).toISOString()
  }
];

function getLocalNotifications() {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_NOTIFICATIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_NOTIFICATIONS, JSON.stringify(INITIAL_MOCK_NOTIFICATIONS));
    return INITIAL_MOCK_NOTIFICATIONS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_MOCK_NOTIFICATIONS; }
}

function saveLocalNotifications(list) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_NOTIFICATIONS, JSON.stringify(list));
}

export const notificationService = {
  async getNotifications() {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return getLocalNotifications();
      return data || [];
    }
    return getLocalNotifications();
  },

  async createNotification(title, message, type = 'info') {
    // Show in-app toast immediately
    showToast(`${title}: ${message}`, type);

    if (isSupabaseConfigured() && supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const { data, error } = await supabaseClient
        .from('notifications')
        .insert([{
          user_id: user ? user.id : null,
          title,
          message,
          type,
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      if (error) console.error("Error saving notification:", error);
      return data;
    }

    const list = getLocalNotifications();
    const newNotif = {
      id: generateUUID(),
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };
    list.unshift(newNotif);
    saveLocalNotifications(list);
    return newNotif;
  },

  async markAllAsRead() {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        await supabaseClient
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id);
      }
      return;
    }

    const list = getLocalNotifications();
    list.forEach(n => n.is_read = true);
    saveLocalNotifications(list);
  },

  async getUnreadCount() {
    const list = await this.getNotifications();
    return list.filter(n => !n.is_read).length;
  }
};
