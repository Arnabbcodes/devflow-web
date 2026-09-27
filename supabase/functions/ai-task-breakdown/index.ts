// supabase/functions/ai-task-breakdown/index.ts
// Specialized Edge Function for breaking tasks into subtasks via Groq AI

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing GROQ_API_KEY secret' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { task, description } = await req.json();

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an AI task breakdown assistant for developers. Output ONLY valid JSON: { "subtasks": ["subtask1", "subtask2", "subtask3"], "estimated_minutes": 120, "priority": "medium" }'
          },
          {
            role: 'user',
            content: `Task: ${task}. Description: ${description || ''}`
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    const data = await groqResponse.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
