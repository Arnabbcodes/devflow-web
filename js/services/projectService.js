/**
 * DevFlow Project Service
 * Handles CRUD for projects via Supabase Database or Mock Storage Fallback
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { STORAGE_KEYS, generateUUID } from '../utils/helpers.js';

const INITIAL_MOCK_PROJECTS = [
  {
    id: 'proj-1',
    name: 'DevFlow Cloud Engine',
    description: 'Autonomous developer workflow orchestration with Supabase and Groq Llama 3.',
    color: '#6366f1',
    tech_stack: ['Supabase', 'Groq', 'Deno', 'PostgreSQL'],
    repo_url: 'https://github.com/developer/devflow',
    status: 'active',
    progress: 68,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'proj-2',
    name: 'Stripe Webhook Gateway',
    description: 'High-throughput payment microservice with idempotency checks and automated retries.',
    color: '#06b6d4',
    tech_stack: ['TypeScript', 'Docker', 'Redis', 'Node.js'],
    repo_url: 'https://github.com/developer/stripe-gateway',
    status: 'active',
    progress: 42,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'proj-3',
    name: 'AI Code Reviewer Bot',
    description: 'GitHub Action bot that analyzes pull request diffs and posts smart architectural suggestions.',
    color: '#8b5cf6',
    tech_stack: ['GitHub Actions', 'Groq AI', 'Python'],
    repo_url: 'https://github.com/developer/ai-code-reviewer',
    status: 'active',
    progress: 85,
    created_at: new Date(Date.now() - 21 * 86400000).toISOString()
  }
];

function getLocalProjects() {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_PROJECTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_PROJECTS, JSON.stringify(INITIAL_MOCK_PROJECTS));
    return INITIAL_MOCK_PROJECTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_MOCK_PROJECTS;
  }
}

function saveLocalProjects(projects) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_PROJECTS, JSON.stringify(projects));
}

export const projectService = {
  async getProjects() {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getLocalProjects();
  },

  async getProjectById(id) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    return getLocalProjects().find(p => p.id === id) || null;
  },

  async createProject(project) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const payload = {
        ...project,
        user_id: user ? user.id : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabaseClient
        .from('projects')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const projects = getLocalProjects();
    const newProject = {
      ...project,
      id: generateUUID(),
      progress: project.progress || 0,
      status: project.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    projects.unshift(newProject);
    saveLocalProjects(projects);
    return newProject;
  },

  async updateProject(id, updates) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const projects = getLocalProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updated_at: new Date().toISOString() };
      saveLocalProjects(projects);
      return projects[index];
    }
    return null;
  },

  async deleteProject(id) {
    if (isSupabaseConfigured() && supabaseClient) {
      const { error } = await supabaseClient
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }

    let projects = getLocalProjects();
    projects = projects.filter(p => p.id !== id);
    saveLocalProjects(projects);
    return true;
  }
};
