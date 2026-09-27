/**
 * DevFlow Workflow & Automation Service
 * Handles triggers, automated actions, and run history
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { STORAGE_KEYS, generateUUID } from '../utils/helpers.js';

const INITIAL_MOCK_WORKFLOWS = [
  {
    id: 'wf-1',
    name: 'Overdue Deadline Guardian',
    description: 'When a task passes its deadline, immediately dispatch an alert and escalate priority.',
    trigger_type: 'task_overdue',
    action_type: 'mark_urgent',
    config: { notify: true, priority: 'urgent' },
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'wf-2',
    name: 'Upcoming Deadline Warning',
    description: 'When a task deadline is within 24 hours, alert the developer and flag high priority.',
    trigger_type: 'deadline_approaching',
    action_type: 'send_notification',
    config: { hours_threshold: 24 },
    is_active: true,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'wf-3',
    name: 'Auto-Recalculate Project Velocity',
    description: 'When any task is marked Done, recalculate project completion percentage and log activity.',
    trigger_type: 'task_completed',
    action_type: 'update_project_progress',
    config: {},
    is_active: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

const INITIAL_MOCK_RUNS = [
  {
    id: 'run-1',
    workflow_id: 'wf-3',
    status: 'success',
    details: { message: 'Updated DevFlow Cloud Engine progress to 68%', task_title: 'Configure GitHub Actions' },
    executed_at: new Date(Date.now() - 25 * 60000).toISOString()
  },
  {
    id: 'run-2',
    workflow_id: 'wf-2',
    status: 'success',
    details: { message: 'Alerted developer: Task Deploy Groq AI Supabase Edge Function is due in 24h' },
    executed_at: new Date(Date.now() - 120 * 60000).toISOString()
  }
];

function getLocalWorkflows() {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_WORKFLOWS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_WORKFLOWS, JSON.stringify(INITIAL_MOCK_WORKFLOWS));
    return INITIAL_MOCK_WORKFLOWS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_MOCK_WORKFLOWS; }
}

function saveLocalWorkflows(list) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_WORKFLOWS, JSON.stringify(list));
}

function getLocalRuns() {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_WORKFLOW_RUNS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_WORKFLOW_RUNS, JSON.stringify(INITIAL_MOCK_RUNS));
    return INITIAL_MOCK_RUNS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_MOCK_RUNS; }
}

function saveLocalRuns(list) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_WORKFLOW_RUNS, JSON.stringify(list));
}

export const workflowService = {
  async getWorkflows() {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient.from('workflows').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getLocalWorkflows();
  },

  async createWorkflow(workflow) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const payload = {
        ...workflow,
        user_id: user ? user.id : null,
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabaseClient.from('workflows').insert([payload]).select().single();
      if (error) throw error;
      return data;
    }

    const workflows = getLocalWorkflows();
    const newWf = {
      ...workflow,
      id: generateUUID(),
      is_active: workflow.is_active ?? true,
      created_at: new Date().toISOString()
    };
    workflows.unshift(newWf);
    saveLocalWorkflows(workflows);
    return newWf;
  },

  async toggleWorkflow(id, isActive) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient.from('workflows').update({ is_active: isActive }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }

    const workflows = getLocalWorkflows();
    const idx = workflows.findIndex(w => w.id === id);
    if (idx !== -1) {
      workflows[idx].is_active = isActive;
      saveLocalWorkflows(workflows);
      return workflows[idx];
    }
    return null;
  },

  async deleteWorkflow(id) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { error } = await supabaseClient.from('workflows').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    let workflows = getLocalWorkflows();
    workflows = workflows.filter(w => w.id !== id);
    saveLocalWorkflows(workflows);
    return true;
  },

  async logRun(workflowId, status, details) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      await supabaseClient.from('workflow_runs').insert([{
        workflow_id: workflowId,
        user_id: user ? user.id : null,
        status,
        details,
        executed_at: new Date().toISOString()
      }]);
      return;
    }

    const runs = getLocalRuns();
    runs.unshift({
      id: generateUUID(),
      workflow_id: workflowId,
      status,
      details,
      executed_at: new Date().toISOString()
    });
    saveLocalRuns(runs.slice(0, 50));
  },

  async getRuns() {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient.from('workflow_runs').select('*').order('executed_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    }
    return getLocalRuns();
  }
};
