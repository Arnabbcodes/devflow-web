-- 006_workflow_runs.sql
-- Execution logs of automated workflows
create table if not exists public.workflow_runs (
  id uuid default gen_random_uuid() primary key,
  workflow_id uuid references public.workflows(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  status text default 'success' check (status in ('success', 'failed', 'skipped')),
  details jsonb default '{}'::jsonb,
  executed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.workflow_runs enable row level security;

-- Policies
create policy "Users can view own workflow runs" 
  on public.workflow_runs for select 
  using (auth.uid() = user_id);

create policy "Users can insert own workflow runs" 
  on public.workflow_runs for insert 
  with check (auth.uid() = user_id);

create index if not exists workflow_runs_workflow_id_idx on public.workflow_runs (workflow_id);
