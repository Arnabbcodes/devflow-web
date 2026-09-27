-- 004_subtasks.sql
-- Subtasks table (created manually or broken down by Groq AI)
create table if not exists public.subtasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.subtasks enable row level security;

-- Policies
create policy "Users can view own subtasks" 
  on public.subtasks for select 
  using (auth.uid() = user_id);

create policy "Users can insert own subtasks" 
  on public.subtasks for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own subtasks" 
  on public.subtasks for update 
  using (auth.uid() = user_id);

create policy "Users can delete own subtasks" 
  on public.subtasks for delete 
  using (auth.uid() = user_id);

create index if not exists subtasks_task_id_idx on public.subtasks (task_id);
