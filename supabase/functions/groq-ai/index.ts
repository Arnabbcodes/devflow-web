// supabase/functions/groq-ai/index.ts
// Supabase Edge Function connecting DevFlow securely to Groq AI

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface RequestPayload {
  action: 'task_breakdown' | 'daily_plan' | 'priority_analyzer' | 'project_planner';
  task?: string;
  tasks?: any[];
  project?: string;
  description?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'GROQ_API_KEY secret is not set in Supabase Edge Function environment.',
          fallback: true 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: RequestPayload = await req.json();
    const { action, task, tasks, project, description } = payload;

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'task_breakdown') {
      systemPrompt = `You are DevFlow's Senior Software Architect AI. Break down the provided developer task into actionable technical subtasks, estimate total completion time in minutes, recommend priority (low, medium, high, or urgent), and provide helpful technical tags.
Output ONLY valid JSON with keys:
{
  "subtasks": ["subtask 1", "subtask 2", "subtask 3", "subtask 4"],
  "estimated_minutes": 120,
  "priority": "high",
  "tags": ["react", "auth", "security"],
  "advice": "Short 1-sentence pro tip for this task"
}`;
      userPrompt = `Task: ${task || description}`;

    } else if (action === 'daily_plan') {
      systemPrompt = `You are DevFlow's AI Productivity Coach for Software Engineers. Analyze the list of pending tasks, their priorities, deadlines, and time estimates to formulate an optimal high-impact developer workday schedule.
Output ONLY valid JSON with keys:
{
  "focus_goal": "Primary objective for the day",
  "schedule": [
    { "time_block": "09:00 - 11:00", "task": "...", "type": "deep_work" },
    { "time_block": "11:15 - 12:30", "task": "...", "type": "code_review" },
    { "time_block": "13:30 - 15:30", "task": "...", "type": "implementation" }
  ],
  "recommendations": ["Tip 1", "Tip 2"],
  "estimated_total_minutes": 270
}`;
      userPrompt = `Pending Tasks: ${JSON.stringify(tasks || [])}`;

    } else if (action === 'priority_analyzer') {
      systemPrompt = `Analyze the developer task title and description. Return JSON with:
{
  "priority": "low" | "medium" | "high" | "urgent",
  "reason": "Clear explanation of impact and urgency",
  "suggested_minutes": 60
}`;
      userPrompt = `Task: ${task}. Description: ${description || 'None'}`;

    } else if (action === 'project_planner') {
      systemPrompt = `You are a Principal Software Architect. Given a software project name and description, generate recommended tech stack tags, milestones, and initial core tasks. Output ONLY valid JSON:
{
  "recommended_stack": ["Node.js", "PostgreSQL", "TailwindCSS"],
  "milestones": ["MVP Architecture", "Core API & DB", "Frontend UI", "Deployment & CI/CD"],
  "initial_tasks": [
    { "title": "Setup Repository & Schema", "priority": "high", "estimated_minutes": 60 },
    { "title": "Implement Authentication & JWT", "priority": "high", "estimated_minutes": 90 },
    { "title": "Design Core Dashboard UI", "priority": "medium", "estimated_minutes": 120 }
  ]
}`;
      userPrompt = `Project: ${project}. Description: ${description || 'Modern web application'}`;

    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Groq API (using high-speed llama-3.3-70b-versatile or llama-3.1-8b-instant)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return new Response(
        JSON.stringify({ error: 'Groq API error', details: errorText }),
        { status: groqResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { raw: content };
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
