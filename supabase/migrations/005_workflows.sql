-- 005_workflows.sql
-- Automation rules and workflows
create table if not exists public.workflows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  trigger_type text not null, -- 'task_overdue', 'deadline_approaching', 'task_completed', 'subtasks_completed'
  action_type text not null,  -- 'send_notification', 'mark_urgent', 'update_project_progress', 'assign_priority'
  config jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.workflows enable row level security;

-- Policies
create policy "Users can view own workflows" 
  on public.workflows for select 
  using (auth.uid() = user_id);

create policy "Users can insert own workflows" 
  on public.workflows for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own workflows" 
  on public.workflows for update 
  using (auth.uid() = user_id);

create policy "Users can delete own workflows" 
  on public.workflows for delete 
  using (auth.uid() = user_id);
