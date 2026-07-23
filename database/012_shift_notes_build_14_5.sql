-- DVS Planning — Build 14.5
-- Il campo notes era già previsto nelle installazioni complete; questa migrazione
-- lo aggiunge in modo sicuro alle installazioni che non lo possiedono.

alter table public.shifts
  add column if not exists notes text;
