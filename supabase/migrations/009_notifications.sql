-- 009_notifications.sql
-- System and workflow notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'urgent')),
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view own notifications" 
  on public.notifications for select 
  using (auth.uid() = user_id);

create policy "Users can insert own notifications" 
  on public.notifications for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own notifications" 
  on public.notifications for update 
  using (auth.uid() = user_id);

create policy "Users can delete own notifications" 
  on public.notifications for delete 
  using (auth.uid() = user_id);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
