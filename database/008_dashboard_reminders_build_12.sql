-- Build 12: promemoria condivisi Dashboard
create table if not exists public.reminders (
  id uuid primary key,
  text text not null check (char_length(text) between 1 and 180),
  created_by text,
  created_at timestamptz not null default now()
);
alter table public.reminders enable row level security;
drop policy if exists "reminders_select_all" on public.reminders;
drop policy if exists "reminders_insert_all" on public.reminders;
drop policy if exists "reminders_delete_all" on public.reminders;
create policy "reminders_select_all" on public.reminders for select using (true);
create policy "reminders_insert_all" on public.reminders for insert with check (true);
create policy "reminders_delete_all" on public.reminders for delete using (true);
alter publication supabase_realtime add table public.reminders;
