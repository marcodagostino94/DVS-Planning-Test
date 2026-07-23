-- DVS Planning — Build 4.0
-- Eseguire in Supabase > SQL Editor > New query > Run.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.editors (
  id text primary key,
  first_name text not null,
  last_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editors_unique_name unique (first_name, last_name)
);

create table if not exists public.rooms (
  code text primary key,
  display_name text not null,
  sort_order integer not null unique,
  active boolean not null default true
);

create table if not exists public.shifts (
  id text primary key,
  room_code text not null references public.rooms(code),
  shift_date date not null,
  production text not null,
  film text not null,
  start_time time not null,
  end_time time not null,
  end_is_24 boolean not null default false,
  work_type text not null
    check (work_type in ('EDIT','ASSISTENTE','GRAFICA','COLOR','SOUND DESIGN')),
  editor_id text references public.editors(id),
  status text not null
    check (status in ('provvisorio','definitivo')),
  color_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Intervallo normalizzato: 24:00 viene memorizzato come 00:00 con end_is_24=true.
create or replace function public.shift_end_timestamp(
  p_date date,
  p_end time,
  p_end_is_24 boolean
)
returns timestamp
language sql
immutable
as $$
  select case
    when p_end_is_24 then (p_date + 1)::timestamp
    else (p_date + p_end)::timestamp
  end;
$$;

create or replace function public.prevent_room_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.shifts s
    where s.id <> new.id
      and s.room_code = new.room_code
      and tsrange(
        s.shift_date + s.start_time,
        public.shift_end_timestamp(s.shift_date, s.end_time, s.end_is_24),
        '[)'
      ) &&
      tsrange(
        new.shift_date + new.start_time,
        public.shift_end_timestamp(new.shift_date, new.end_time, new.end_is_24),
        '[)'
      )
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

alter table public.editors enable row level security;
alter table public.rooms enable row level security;
alter table public.shifts enable row level security;

-- Policy temporanee per il prototipo pubblico.
-- Verranno sostituite con policy basate su login prima dell'uso aziendale.
drop policy if exists "prototype editors read" on public.editors;
drop policy if exists "prototype editors write" on public.editors;
drop policy if exists "prototype rooms read" on public.rooms;
drop policy if exists "prototype shifts read" on public.shifts;
drop policy if exists "prototype shifts write" on public.shifts;

create policy "prototype editors read"
on public.editors for select to anon, authenticated using (true);

create policy "prototype editors write"
on public.editors for all to anon, authenticated
using (true) with check (true);

create policy "prototype rooms read"
on public.rooms for select to anon, authenticated using (true);

create policy "prototype shifts read"
on public.shifts for select to anon, authenticated using (true);

create policy "prototype shifts write"
on public.shifts for all to anon, authenticated
using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table public.editors;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.shifts;
exception
  when duplicate_object then null;
end $$;
