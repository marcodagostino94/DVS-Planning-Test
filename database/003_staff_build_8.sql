-- DVS Planning — Build 8.0.2 / Sezione Dipendenti
-- Versione corretta e idempotente.
-- Può essere eseguita anche se la precedente query si è interrotta.

create table if not exists public.staff (
  id text primary key,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('Montatore','Grafico','Colorist','Sound','Assistente','Altro')),
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_unique_name unique (first_name, last_name)
);

create index if not exists staff_last_name_first_name_idx
  on public.staff (lower(last_name), lower(first_name));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_staff_updated_at on public.staff;
create trigger trg_staff_updated_at
before update on public.staff
for each row execute function public.set_updated_at();

-- Copia i vecchi montatori SOLO se la tabella public.editors esiste.
do $$
begin
  if to_regclass('public.editors') is not null then
    execute $copy$
      insert into public.staff (id, first_name, last_name, role)
      select id::text, first_name, last_name, 'Montatore'
      from public.editors
      on conflict (id) do update set
        first_name = excluded.first_name,
        last_name = excluded.last_name
    $copy$;
  end if;
end $$;

-- Collega shifts.editor_id a staff SOLO se tabella e colonna esistono.
do $$
begin
  if to_regclass('public.shifts') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'shifts'
         and column_name = 'editor_id'
     ) then

    alter table public.shifts
      drop constraint if exists shifts_editor_id_fkey;

    -- Aggiunge la FK soltanto se non è già presente.
    if not exists (
      select 1
      from pg_constraint
      where conname = 'shifts_editor_id_fkey'
        and conrelid = 'public.shifts'::regclass
    ) then
      alter table public.shifts
        add constraint shifts_editor_id_fkey
        foreign key (editor_id)
        references public.staff(id)
        on delete set null;
    end if;
  end if;
end $$;

alter table public.staff enable row level security;

drop policy if exists "prototype staff read" on public.staff;
drop policy if exists "prototype staff write" on public.staff;

create policy "prototype staff read"
on public.staff
for select
to anon, authenticated
using (true);

create policy "prototype staff write"
on public.staff
for all
to anon, authenticated
using (true)
with check (true);

-- Abilita Realtime senza generare errore se la tabella è già inclusa.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'staff'
  ) then
    alter publication supabase_realtime add table public.staff;
  end if;
end $$;
