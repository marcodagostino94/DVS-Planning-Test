-- DVS Planning Build 13.3 — stato e autorizzazione Backup Agent

create table if not exists public.backup_agent_status (
  id text primary key default 'primary',
  authorized boolean not null default true,
  authorized_user_profile_id text null references public.planning_profiles(id) on delete set null,
  authorized_user_name text,
  computer_id text,
  computer_name text,
  agent_version text,
  healthy boolean not null default false,
  last_status text,
  last_success_at timestamptz,
  last_attempt_at timestamptz,
  last_error text,
  backup_folder text,
  record_counts jsonb not null default '{}'::jsonb,
  revoked_at timestamptz,
  revoked_by_profile_id text null references public.planning_profiles(id) on delete set null,
  revoked_by_name text,
  updated_at timestamptz not null default now(),
  constraint backup_agent_singleton check (id = 'primary')
);

alter table public.backup_agent_status enable row level security;

drop policy if exists "backup_agent_status_select" on public.backup_agent_status;
create policy "backup_agent_status_select" on public.backup_agent_status for select to anon, authenticated using (true);

drop policy if exists "backup_agent_status_insert" on public.backup_agent_status;
create policy "backup_agent_status_insert" on public.backup_agent_status for insert to anon, authenticated with check (id = 'primary');

drop policy if exists "backup_agent_status_update" on public.backup_agent_status;
create policy "backup_agent_status_update" on public.backup_agent_status for update to anon, authenticated using (id = 'primary') with check (id = 'primary');

do $$
begin
  begin alter publication supabase_realtime add table public.backup_agent_status;
  exception when duplicate_object then null; end;
end $$;

comment on table public.backup_agent_status is 'Stato condiviso, autorizzazione e ultimo esito del DVS Backup Agent.';
