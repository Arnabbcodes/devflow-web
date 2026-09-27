/**
 * DevFlow Task & Subtask Service
 * Manages task operations with Supabase Database or Mock Storage
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { STORAGE_KEYS, generateUUID } from '../utils/helpers.js';

const INITIAL_MOCK_TASKS = [
  {
    id: 'task-101',
    project_id: 'proj-1',
    title: 'Deploy Groq AI Supabase Edge Function',
    description: 'Setup Supabase Edge Functions with secret GROQ_API_KEY and configure CORS headers for frontend consumption.',
    status: 'in_progress',
    priority: 'urgent',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    estimated_minutes: 120,
    actual_minutes: 60,
    ai_generated: true,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'task-102',
    project_id: 'proj-1',
    title: 'Connect Realtime Supabase Database Listeners',
    description: 'Listen to changes on tasks and workflow_runs table for instant UI synchronization without manual polling.',
    status: 'todo',
    priority: 'high',
    due_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    estimated_minutes: 90,
    actual_minutes: 0,
    ai_generated: false,
    created_at: new Date(Date.now() - 48000000).toISOString()
  },
  {
    id: 'task-103',
    project_id: 'proj-2',
    title: 'Implement Webhook Idempotency Store',
    description: 'Ensure duplicate events from Stripe are filtered out using Redis key-value expiration.',
    status: 'review',
    priority: 'medium',
    due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    estimated_minutes: 150,
    actual_minutes: 130,
    ai_generated: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'task-104',
    project_id: 'proj-3',
    title: 'Configure GitHub Actions CI/CD Pipeline',
    description: 'Automatically trigger test suite and preview builds on every pull request push.',
    status: 'done',
    priority: 'low',
    due_date: new Date(Date.now() - 86400000).toISOString(),
    estimated_minutes: 45,
    actual_minutes: 40,
    ai_generated: false,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

const INITIAL_MOCK_SUBTASKS = [
  { id: 'sub-1', task_id: 'task-101', title: 'Initialize supabase/functions/groq-ai', is_completed: true, position: 0 },
  { id: 'sub-2', task_id: 'task-101', title: 'Add GROQ_API_KEY to Supabase Secrets', is_completed: true, position: 1 },
  { id: 'sub-3', task_id: 'task-101', title: 'Verify JSON output mode with llama-3.3-70b', is_completed: false, position: 2 },
  { id: 'sub-4', task_id: 'task-101', title: 'Deploy via supabase CLI functions deploy', is_completed: false, position: 3 }
];

function getLocalTasks() {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_TASKS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_TASKS, JSON.stringify(INITIAL_MOCK_TASKS));
    return INITIAL_MOCK_TASKS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_MOCK_TASKS;
  }
}

function saveLocalTasks(tasks) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_TASKS, JSON.stringify(tasks));
}

function getLocalSubtasks() {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_SUBTASKS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_SUBTASKS, JSON.stringify(INITIAL_MOCK_SUBTASKS));
    return INITIAL_MOCK_SUBTASKS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_MOCK_SUBTASKS;
  }
}

function saveLocalSubtasks(subtasks) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_SUBTASKS, JSON.stringify(subtasks));
}

export const taskService = {
  async getTasks(filters = {}) {
    if (isSupabaseConfigured() && supabaseClient) {
      let query = supabaseClient.from('tasks').select('*').order('created_at', { ascending: false });
      if (filters.projectId) query = query.eq('project_id', filters.projectId);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    let tasks = getLocalTasks();
    if (filters.projectId) tasks = tasks.filter(t => t.project_id === filters.projectId);
    if (filters.status) tasks = tasks.filter(t => t.status === filters.status);
    if (filters.priority) tasks = tasks.filter(t => t.priority === filters.priority);
    return tasks;
  },

  async getTaskById(id) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    return getLocalTasks().find(t => t.id === id) || null;
  },

  async createTask(task) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const payload = {
        ...task,
        user_id: user ? user.id : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const tasks = getLocalTasks();
    const newTask = {
      ...task,
      id: generateUUID(),
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    tasks.unshift(newTask);
    saveLocalTasks(tasks);
    return newTask;
  },

  async updateTask(id, updates) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const tasks = getLocalTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...updates, updated_at: new Date().toISOString() };
      saveLocalTasks(tasks);
      return tasks[idx];
    }
    return null;
  },

  async deleteTask(id) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }

    let tasks = getLocalTasks();
    tasks = tasks.filter(t => t.id !== id);
    saveLocalTasks(tasks);
    return true;
  },

  // Subtasks management
  async getSubtasks(taskId) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    }

    return getLocalSubtasks().filter(s => s.task_id === taskId);
  },

  async addSubtask(taskId, title) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const { data, error } = await supabaseClient
        .from('subtasks')
        .insert([{
          task_id: taskId,
          user_id: user ? user.id : null,
          title,
          is_completed: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const subtasks = getLocalSubtasks();
    const newSubtask = {
      id: generateUUID(),
      task_id: taskId,
      title,
      is_completed: false,
      position: subtasks.length,
      created_at: new Date().toISOString()
    };
    subtasks.push(newSubtask);
    saveLocalSubtasks(subtasks);
    return newSubtask;
  },

  async toggleSubtask(id, isCompleted) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('subtasks')
        .update({ is_completed: isCompleted })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const subtasks = getLocalSubtasks();
    const idx = subtasks.findIndex(s => s.id === id);
    if (idx !== -1) {
      subtasks[idx].is_completed = isCompleted;
      saveLocalSubtasks(subtasks);
      return subtasks[idx];
    }
    return null;
  },

  async batchAddSubtasks(taskId, titles) {
    const results = [];
    for (const title of titles) {
      const res = await this.addSubtask(taskId, title);
      results.push(res);
    }
    return results;
  }
};
