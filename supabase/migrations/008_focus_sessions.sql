-- 008_focus_sessions.sql
-- Pomodoro and deep work session telemetry
create table if not exists public.focus_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  duration_minutes integer not null,
  mode text default 'pomodoro' check (mode in ('pomodoro', 'short_break', 'long_break', 'flow')),
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.focus_sessions enable row level security;

-- Policies
create policy "Users can view own focus sessions" 
  on public.focus_sessions for select 
  using (auth.uid() = user_id);

create policy "Users can insert own focus sessions" 
  on public.focus_sessions for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete own focus sessions" 
  on public.focus_sessions for delete 
  using (auth.uid() = user_id);

create index if not exists focus_sessions_user_id_idx on public.focus_sessions (user_id);
