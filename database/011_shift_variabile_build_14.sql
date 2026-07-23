-- DVS Planning — Build 14.0
-- Aggiunge il flag VARIABILE ai turni esistenti e futuri.

alter table public.shifts
  add column if not exists is_variable boolean not null default false;

comment on column public.shifts.is_variable is
  'Se true, il Planning mostra la lavorazione come TIPO - VARIABILE.';
