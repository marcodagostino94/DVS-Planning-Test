-- DVS Planning v21 TEST
-- Migrazione additiva e retrocompatibile per serie e creazione multisala.
-- La v20.5 continua a funzionare perché ignora queste colonne nullable.

begin;

alter table if exists public.shifts
  add column if not exists series_id uuid,
  add column if not exists series_group_id uuid;

comment on column public.shifts.series_id is
  'Identifica la serie della singola sala; NULL per i turni precedenti alla v21 TEST.';

comment on column public.shifts.series_group_id is
  'Collega le serie generate insieme su più sale; NULL per i turni precedenti alla v21 TEST.';

create index if not exists shifts_series_id_idx
  on public.shifts (series_id, shift_date)
  where series_id is not null;

create index if not exists shifts_series_group_id_idx
  on public.shifts (series_group_id, shift_date)
  where series_group_id is not null;

commit;

-- Ritorno facoltativo, da eseguire soltanto se tutti i turni TEST sono stati eliminati:
-- drop index if exists public.shifts_series_group_id_idx;
-- drop index if exists public.shifts_series_id_idx;
-- alter table public.shifts drop column if exists series_group_id;
-- alter table public.shifts drop column if exists series_id;
