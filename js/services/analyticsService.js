/**
 * DevFlow Analytics Service
 * Aggregates statistics, velocities, and focus metrics
 */

import { taskService } from './taskService.js';
import { projectService } from './projectService.js';
import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { STORAGE_KEYS, generateUUID } from '../utils/helpers.js';
import { isOverdue } from '../utils/dateUtils.js';

const INITIAL_MOCK_SESSIONS = [
  { id: 'f-1', duration_minutes: 50, mode: 'flow', completed_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'f-2', duration_minutes: 25, mode: 'pomodoro', completed_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'f-3', duration_minutes: 25, mode: 'pomodoro', completed_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'f-4', duration_minutes: 50, mode: 'flow', completed_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'f-5', duration_minutes: 25, mode: 'pomodoro', completed_at: new Date(Date.now() - 4 * 86400000).toISOString() }
];

function getLocalSessions() {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_FOCUS_SESSIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_FOCUS_SESSIONS, JSON.stringify(INITIAL_MOCK_SESSIONS));
    return INITIAL_MOCK_SESSIONS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_MOCK_SESSIONS; }
}

function saveLocalSessions(list) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_FOCUS_SESSIONS, JSON.stringify(list));
}

export const analyticsService = {
  async logFocusSession(durationMinutes, mode = 'pomodoro', taskId = null) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const { data, error } = await supabaseClient
        .from('focus_sessions')
        .insert([{
          user_id: user ? user.id : null,
          task_id: taskId,
          duration_minutes: durationMinutes,
          mode,
          completed_at: new Date().toISOString()
        }])
        .select()
        .single();
      if (error) console.error("Error logging focus session:", error);
      return data;
    }

    const sessions = getLocalSessions();
    const newSession = {
      id: generateUUID(),
      duration_minutes: durationMinutes,
      mode,
      task_id: taskId,
      completed_at: new Date().toISOString()
    };
    sessions.unshift(newSession);
    saveLocalSessions(sessions);
    return newSession;
  },

  async getFocusSessions() {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('focus_sessions')
        .select('*')
        .order('completed_at', { ascending: false });
      if (error) return getLocalSessions();
      return data || [];
    }
    return getLocalSessions();
  },

  async getOverallMetrics() {
    const tasks = await taskService.getTasks();
    const projects = await projectService.getProjects();
    const sessions = await this.getFocusSessions();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = tasks.filter(t => t.status !== 'done' && isOverdue(t.due_date)).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    // Distribution by status
    const statusCounts = {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: inProgressTasks,
      review: tasks.filter(t => t.status === 'review').length,
      done: completedTasks
    };

    // Velocity by day (past 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      
      const count = tasks.filter(t => {
        if (t.status !== 'done') return false;
        const taskDate = (t.updated_at || t.created_at || '').split('T')[0];
        return taskDate === dateStr;
      }).length;

      past7Days.push({ day: dayName, date: dateStr, count });
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      totalFocusMinutes,
      activeProjectsCount: projects.filter(p => p.status === 'active').length,
      statusCounts,
      past7Days
    };
  }
};
