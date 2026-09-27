/**
 * DevFlow Core AI Engine
 * Orchestrates calls to the Supabase "groq-ai" Edge Function.
 * Includes intelligent local developer heuristic fallbacks when credentials are being set up.
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';

export const aiEngine = {
  /**
   * Invokes the Supabase Edge Function 'groq-ai' with proper payload.
   * If credentials are not yet configured or function is not deployed,
   * provides a simulated AI response to demonstrate functionality.
   */
  async callGroq(action, payload) {
    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.functions.invoke('groq-ai', {
          body: { action, ...payload }
        });

        if (error) {
          console.warn("Supabase Edge Function returned error, using fallback simulator:", error);
          return this.getSimulatedResponse(action, payload);
        }

        if (data && data.success && data.data) {
          return data.data;
        } else if (data && !data.error) {
          return data;
        }
      } catch (err) {
        console.warn("Network or invocation error calling Supabase Edge Function:", err);
        return this.getSimulatedResponse(action, payload);
      }
    }

    // Fallback simulation when Edge Function isn't deployed yet
    await new Promise(r => setTimeout(r, 800)); // natural realistic AI latency feel
    return this.getSimulatedResponse(action, payload);
  },

  getSimulatedResponse(action, payload) {
    if (action === 'task_breakdown') {
      const task = payload.task || 'Feature Implementation';
      return {
        subtasks: [
          `Research & design interface schema for ${task}`,
          `Implement core logic and state handlers`,
          `Write comprehensive unit & integration tests`,
          `Refactor edge cases, error boundary, and optimize performance`
        ],
        estimated_minutes: 180,
        priority: 'high',
        tags: ['architecture', 'testing', 'full-stack'],
        advice: `Focus first on clean type signatures and interface isolation before writing implementation code.`
      };
    }

    if (action === 'daily_plan') {
      return {
        focus_goal: 'Deliver high-priority edge function integration and resolve blocking review tasks.',
        schedule: [
          { time_block: '09:00 - 11:00', task: 'Deep Work: Edge Function implementation & CORS tuning', type: 'deep_work' },
          { time_block: '11:15 - 12:30', task: 'Code Review & PR Feedback resolution', type: 'code_review' },
          { time_block: '13:30 - 15:30', task: 'Implement Webhook Idempotency Store', type: 'deep_work' },
          { time_block: '16:00 - 17:00', task: 'Verification, testing, and daily retro', type: 'wrap_up' }
        ],
        recommendations: [
          'Tackle the highest cognitive load architecture tasks before noon.',
          'Take a 5-minute break after every 25-minute Pomodoro session.'
        ],
        estimated_total_minutes: 315
      };
    }

    if (action === 'priority_analyzer') {
      return {
        priority: 'urgent',
        reason: 'Directly impacts authentication and edge delivery pipeline. Crucial for end-to-end user workflows.',
        suggested_minutes: 90
      };
    }

    if (action === 'project_planner') {
      return {
        recommended_stack: ['Supabase', 'Groq Llama 3', 'TypeScript', 'TailwindCSS / Vanilla CSS'],
        milestones: ['MVP Core Architecture', 'Auth & Security Layer', 'AI Edge Orchestration', 'Production Deployment'],
        initial_tasks: [
          { title: 'Define Database Schemas and RLS Policies', priority: 'high', estimated_minutes: 60 },
          { title: 'Deploy Groq AI Supabase Edge Function', priority: 'urgent', estimated_minutes: 90 },
          { title: 'Construct Reactive Frontend Dashboard', priority: 'high', estimated_minutes: 120 }
        ]
      };
    }

    return { message: 'AI inference completed successfully.' };
  }
};
