-- ==========================================================================
-- DEVFLOW COMPLETE SUPABASE SCHEMA (RUN ALL IN SQL EDITOR)
-- ==========================================================================

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'Full-Stack Developer',
  theme text default 'dark',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Projects Table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  color text default '#6366f1',
  tech_stack text[] default '{}'::text[],
  repo_url text,
  status text default 'active' check (status in ('active', 'completed', 'archived', 'paused')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;
create policy "Users can view own projects" on public.projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on public.projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = user_id);
create index if not exists projects_user_id_idx on public.projects (user_id);

-- 3. Tasks Table
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

alter table public.tasks enable row level security;
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);

-- 4. Subtasks Table
create table if not exists public.subtasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subtasks enable row level security;
create policy "Users can view own subtasks" on public.subtasks for select using (auth.uid() = user_id);
create policy "Users can insert own subtasks" on public.subtasks for insert with check (auth.uid() = user_id);
create policy "Users can update own subtasks" on public.subtasks for update using (auth.uid() = user_id);
create policy "Users can delete own subtasks" on public.subtasks for delete using (auth.uid() = user_id);
create index if not exists subtasks_task_id_idx on public.subtasks (task_id);

-- 5. Workflows Table
create table if not exists public.workflows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  trigger_type text not null,
  action_type text not null,
  config jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.workflows enable row level security;
create policy "Users can view own workflows" on public.workflows for select using (auth.uid() = user_id);
create policy "Users can insert own workflows" on public.workflows for insert with check (auth.uid() = user_id);
create policy "Users can update own workflows" on public.workflows for update using (auth.uid() = user_id);
create policy "Users can delete own workflows" on public.workflows for delete using (auth.uid() = user_id);

-- 6. Workflow Runs Table
create table if not exists public.workflow_runs (
  id uuid default gen_random_uuid() primary key,
  workflow_id uuid references public.workflows(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  status text default 'success' check (status in ('success', 'failed', 'skipped')),
  details jsonb default '{}'::jsonb,
  executed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.workflow_runs enable row level security;
create policy "Users can view own workflow runs" on public.workflow_runs for select using (auth.uid() = user_id);
create policy "Users can insert own workflow runs" on public.workflow_runs for insert with check (auth.uid() = user_id);

-- 7. Notes Table
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  content text default '',
  tags text[] default '{}'::text[],
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notes enable row level security;
create policy "Users can view own notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on public.notes for delete using (auth.uid() = user_id);

-- 8. Focus Sessions Table
create table if not exists public.focus_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  duration_minutes integer not null,
  mode text default 'pomodoro' check (mode in ('pomodoro', 'short_break', 'long_break', 'flow')),
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.focus_sessions enable row level security;
create policy "Users can view own focus sessions" on public.focus_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own focus sessions" on public.focus_sessions for insert with check (auth.uid() = user_id);
create policy "Users can delete own focus sessions" on public.focus_sessions for delete using (auth.uid() = user_id);

-- 9. Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'urgent')),
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can insert own notifications" on public.notifications for insert with check (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Users can delete own notifications" on public.notifications for delete using (auth.uid() = user_id);

-- 10. Activity Logs Table
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.activity_logs enable row level security;
create policy "Users can view own activity logs" on public.activity_logs for select using (auth.uid() = user_id);
create policy "Users can insert own activity logs" on public.activity_logs for insert with check (auth.uid() = user_id);
