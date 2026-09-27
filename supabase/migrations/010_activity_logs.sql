-- 010_activity_logs.sql
-- Real-time audit and activity log
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  entity_type text not null, -- 'task', 'project', 'workflow', 'ai', 'focus'
  entity_id uuid,
  action text not null,      -- 'created', 'updated', 'completed', 'deleted', 'generated'
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.activity_logs enable row level security;

-- Policies
create policy "Users can view own activity logs" 
  on public.activity_logs for select 
  using (auth.uid() = user_id);

create policy "Users can insert own activity logs" 
  on public.activity_logs for insert 
  with check (auth.uid() = user_id);

create index if not exists activity_logs_user_id_idx on public.activity_logs (user_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);
