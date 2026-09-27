-- 002_projects.sql
-- Projects table
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

-- Enable RLS
alter table public.projects enable row level security;

-- Policies
create policy "Users can view own projects" 
  on public.projects for select 
  using (auth.uid() = user_id);

create policy "Users can insert own projects" 
  on public.projects for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own projects" 
  on public.projects for update 
  using (auth.uid() = user_id);

create policy "Users can delete own projects" 
  on public.projects for delete 
  using (auth.uid() = user_id);

create index if not exists projects_user_id_idx on public.projects (user_id);
