-- DVS Planning — Build 9.0
-- Schema completo di base. Da questa build in poi usare soltanto migrazioni incrementali.
-- Eseguire una sola volta in Supabase > SQL Editor > New query > Run.
-- Preserva i dipendenti già presenti nella tabella public.staff.

begin;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- Funzione comune per updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Qualifiche disponibili nel progetto.
create table if not exists public.qualifications (
  code text primary key,
  display_name text not null unique,
  sort_order integer not null unique,
  active boolean not null default true
);

insert into public.qualifications (code, display_name, sort_order) values
  ('Montatore', 'Montatore', 1),
  ('Grafico', 'Grafico', 2),
  ('Colorist', 'Colorist', 3),
  ('Sound', 'Sound', 4),
  ('Assistente', 'Assistente', 5),
  ('Altro', 'Altro', 6)
on conflict (code) do update set
  display_name = excluded.display_name,
  sort_order = excluded.sort_order,
  active = true;

-- Dipendenti: tabella già presente, mantenuta e normalizzata.
create table if not exists public.staff (
  id text primary key default gen_random_uuid()::text,
  first_name text not null,
  last_name text not null,
  role text not null default 'Altro',
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff add column if not exists role text not null default 'Altro';
alter table public.staff add column if not exists phone text;
alter table public.staff add column if not exists email text;
alter table public.staff add column if not exists notes text;
alter table public.staff add column if not exists created_at timestamptz not null default now();
alter table public.staff add column if not exists updated_at timestamptz not null default now();

update public.staff
set first_name = upper(trim(first_name)),
    last_name = upper(trim(last_name)),
    role = case when role in ('Montatore','Grafico','Colorist','Sound','Assistente','Altro') then role else 'Altro' end;

create unique index if not exists staff_unique_name_ci
  on public.staff (lower(first_name), lower(last_name));
create index if not exists staff_role_idx on public.staff(role);
create index if not exists staff_first_name_idx on public.staff(first_name, last_name);

drop trigger if exists trg_staff_updated_at on public.staff;
create trigger trg_staff_updated_at
before update on public.staff
for each row execute function public.set_updated_at();

-- Sale e postazioni remote.
create table if not exists public.rooms (
  code text primary key,
  display_name text not null,
  group_name text not null,
  room_type text not null default 'sala' check (room_type in ('sala','remoto')),
  sort_order integer not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.rooms (code, display_name, group_name, room_type, sort_order) values
  ('sala-1','Sala 1','CHINOTTO 1','sala',1),
  ('sala-2','Sala 2','CHINOTTO 1','sala',2),
  ('sala-3','Sala 3','CHINOTTO 1','sala',3),
  ('sala-4','Sala 4','CHINOTTO 1','sala',4),
  ('sala-5','Sala 5','CHINOTTO 1','sala',5),
  ('sala-6','Sala 6','CHINOTTO 2','sala',6),
  ('sala-7','Sala 7','CHINOTTO 2','sala',7),
  ('sala-8','Sala 8','CHINOTTO 2','sala',8),
  ('sala-9','Sala 9','CHINOTTO 2','sala',9),
  ('sala-10','Sala 10','CHINOTTO 2','sala',10),
  ('sala-11','Sala 1A','CARSO 3','sala',11),
  ('sala-12','Sala 2A','CARSO 3','sala',12),
  ('sala-13','Sala 3A','CARSO 3','sala',13),
  ('sala-14','Sala 4A','CARSO 3','sala',14),
  ('sala-15','Sala 5A','CARSO 3','sala',15),
  ('remoto-grafica','Grafica remoto','LAVORAZIONI DA REMOTO','remoto',16),
  ('remoto-sound','Sound remoto','LAVORAZIONI DA REMOTO','remoto',17),
  ('remoto-3','Remoto 3','LAVORAZIONI DA REMOTO','remoto',18)
on conflict (code) do update set
  display_name = excluded.display_name,
  group_name = excluded.group_name,
  room_type = excluded.room_type,
  sort_order = excluded.sort_order,
  active = true;

drop trigger if exists trg_rooms_updated_at on public.rooms;
create trigger trg_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

-- Produzioni/film per suggerimenti e riutilizzo futuro.
create table if not exists public.productions (
  id uuid primary key default gen_random_uuid(),
  production_name text not null,
  film_name text not null default '',
  active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists productions_unique_ci
  on public.productions (lower(production_name), lower(film_name));

drop trigger if exists trg_productions_updated_at on public.productions;
create trigger trg_productions_updated_at
before update on public.productions
for each row execute function public.set_updated_at();

-- Turni: fonte ufficiale del Planning dalla Build 9.0.
create table if not exists public.shifts (
  id text primary key default gen_random_uuid()::text,
  room_code text not null references public.rooms(code) on update cascade,
  shift_date date not null,
  production text not null,
  film text not null default '',
  start_time time not null,
  end_time time not null,
  end_is_24 boolean not null default false,
  work_type text not null check (work_type in ('EDIT','ASSISTENTE','GRAFICA','COLOR','SOUND DESIGN')),
  staff_id text references public.staff(id) on update cascade on delete set null,
  status text not null default 'provvisorio' check (status in ('provvisorio','definitivo')),
  confirmed boolean not null default false,
  color_key text not null default 'amber',
  recurrence_group_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shifts_date_room_idx on public.shifts(shift_date, room_code, start_time);
create index if not exists shifts_staff_idx on public.shifts(staff_id, shift_date);
create index if not exists shifts_production_idx on public.shifts(production, film);

create or replace function public.shift_end_timestamp(p_date date, p_end time, p_end_is_24 boolean)
returns timestamp
language sql
immutable
as $$
  select case when p_end_is_24 then (p_date + 1)::timestamp else (p_date + p_end)::timestamp end;
$$;

create or replace function public.prevent_room_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.shifts s
    where s.id <> new.id
      and s.room_code = new.room_code
      and tsrange(s.shift_date + s.start_time,
                  public.shift_end_timestamp(s.shift_date, s.end_time, s.end_is_24), '[)')
          &&
          tsrange(new.shift_date + new.start_time,
                  public.shift_end_timestamp(new.shift_date, new.end_time, new.end_is_24), '[)')
  ) then
    raise exception 'ORARI_NON_COMPATIBILI';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_room_overlap on public.shifts;
create trigger trg_prevent_room_overlap
before insert or update on public.shifts
for each row execute function public.prevent_room_overlap();

drop trigger if exists trg_shifts_updated_at on public.shifts;
create trigger trg_shifts_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();

-- Profili applicativi, pronti per login e profili stile Netflix.
create table if not exists public.app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  initials text,
  avatar_url text,
  role text not null default 'operatore' check (role in ('admin','responsabile','operatore','sola_lettura')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_app_profiles_updated_at on public.app_profiles;
create trigger trg_app_profiles_updated_at
before update on public.app_profiles
for each row execute function public.set_updated_at();

-- Impostazioni condivise e metadati applicativi.
create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings(setting_key, setting_value) values
  ('database_schema_version', '{"version":9,"build":"9.0"}'::jsonb),
  ('planning_defaults', '{"default_start":"10:00","default_duration_hours":8,"backup_time":"16:00"}'::jsonb)
on conflict (setting_key) do update set setting_value = excluded.setting_value, updated_at = now();

-- RLS: policy temporanee del prototipo pubblico. Saranno ristrette quando verrà attivato il login.
alter table public.qualifications enable row level security;
alter table public.staff enable row level security;
alter table public.rooms enable row level security;
alter table public.productions enable row level security;
alter table public.shifts enable row level security;
alter table public.app_profiles enable row level security;
alter table public.app_settings enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['qualifications','staff','rooms','productions','shifts','app_settings'] loop
    execute format('drop policy if exists "prototype %s read" on public.%I', t, t);
    execute format('drop policy if exists "prototype %s write" on public.%I', t, t);
    execute format('create policy "prototype %s read" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "prototype %s write" on public.%I for all to anon, authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

drop policy if exists "profiles own read" on public.app_profiles;
drop policy if exists "profiles own write" on public.app_profiles;
create policy "profiles own read" on public.app_profiles for select to authenticated using (auth.uid() = user_id);
create policy "profiles own write" on public.app_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime.
do $$
declare
  t text;
begin
  foreach t in array array['staff','rooms','productions','shifts','app_settings'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

commit;

-- Verifica finale consigliata:
-- select table_name from information_schema.tables where table_schema='public' order by table_name;
