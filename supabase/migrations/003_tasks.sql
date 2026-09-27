-- 003_tasks.sql
-- Tasks table with priority, status, and AI estimation fields
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamp with time zone,
  estimated_minutes integer default 30,
  actual_minutes integer default 0,
  ai_generated boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tasks enable row level security;

-- Policies
create policy "Users can view own tasks" 
  on public.tasks for select 
  using (auth.uid() = user_id);

create policy "Users can insert own tasks" 
  on public.tasks for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own tasks" 
  on public.tasks for update 
  using (auth.uid() = user_id);

create policy "Users can delete own tasks" 
  on public.tasks for delete 
  using (auth.uid() = user_id);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_status_idx on public.tasks (status);
