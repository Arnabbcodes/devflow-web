-- 007_notes.sql
-- Developer notes, snippets, scratchpad
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

-- Enable RLS
alter table public.notes enable row level security;

-- Policies
create policy "Users can view own notes" 
  on public.notes for select 
  using (auth.uid() = user_id);

create policy "Users can insert own notes" 
  on public.notes for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own notes" 
  on public.notes for update 
  using (auth.uid() = user_id);

create policy "Users can delete own notes" 
  on public.notes for delete 
  using (auth.uid() = user_id);

create index if not exists notes_user_id_idx on public.notes (user_id);
