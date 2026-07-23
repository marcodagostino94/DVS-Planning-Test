-- DVS Planning — Build 13.0
-- Profili dinamici, presenza online e sincronizzazione realtime.
-- Eseguire una sola volta in Supabase > SQL Editor.

begin;

create extension if not exists pgcrypto;

create table if not exists public.planning_profiles (
  id text primary key default gen_random_uuid()::text,
  display_name text not null,
  first_name text not null default '',
  last_name text not null default '',
  initials text not null default '',
  tone text not null default 'red' check (tone in ('red','blue','purple','orange','green','cyan')),
  avatar_url text,
  role text not null default 'admin' check (role in ('admin','editor','viewer')),
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_presence (
  profile_id text primary key references public.planning_profiles(id) on update cascade on delete cascade,
  is_online boolean not null default false,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_planning_profiles_updated_at on public.planning_profiles;
create trigger trg_planning_profiles_updated_at
before update on public.planning_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_profile_presence_updated_at on public.profile_presence;
create trigger trg_profile_presence_updated_at
before update on public.profile_presence
for each row execute function public.set_updated_at();

insert into public.planning_profiles (id, display_name, first_name, last_name, initials, tone, role, active, sort_order) values
  ('alessio-iuso','Alessio Iuso','Alessio','Iuso','AI','red','admin',true,1),
  ('nicola-iuso','Nicola Iuso','Nicola','Iuso','NI','blue','admin',true,2),
  ('sara-dal-pont','Sara Dal Pont','Sara','Dal Pont','SD','purple','admin',true,3),
  ('marco-dagostino','Marco D''Agostino','Marco','D''Agostino','MD','orange','admin',true,4)
on conflict (id) do update set
  display_name=excluded.display_name,
  first_name=excluded.first_name,
  last_name=excluded.last_name,
  initials=excluded.initials,
  tone=excluded.tone,
  active=true,
  sort_order=excluded.sort_order;

alter table public.planning_profiles enable row level security;
alter table public.profile_presence enable row level security;

drop policy if exists "planning profiles read" on public.planning_profiles;
drop policy if exists "planning profiles write" on public.planning_profiles;
create policy "planning profiles read" on public.planning_profiles for select to anon, authenticated using (true);
create policy "planning profiles write" on public.planning_profiles for all to anon, authenticated using (true) with check (true);

drop policy if exists "profile presence read" on public.profile_presence;
drop policy if exists "profile presence write" on public.profile_presence;
create policy "profile presence read" on public.profile_presence for select to anon, authenticated using (true);
create policy "profile presence write" on public.profile_presence for all to anon, authenticated using (true) with check (true);

do $$
begin
  begin alter publication supabase_realtime add table public.planning_profiles;
  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.profile_presence;
  exception when duplicate_object then null; end;
end $$;

commit;
