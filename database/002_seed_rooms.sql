-- Sale fisse DVS Planning

insert into public.rooms (code, display_name, sort_order, active) values
  ('sala-1', 'Sala 1', 1, true),
  ('sala-2', 'Sala 2', 2, true),
  ('sala-3', 'Sala 3', 3, true),
  ('sala-4', 'Sala 4', 4, true),
  ('sala-5', 'Sala 5', 5, true),
  ('sala-6', 'Sala 6', 6, true),
  ('sala-7', 'Sala 7', 7, true),
  ('sala-8', 'Sala 8', 8, true),
  ('sala-9', 'Sala 9', 9, true),
  ('sala-10', 'Sala 10', 10, true),
  ('sala-11', 'Sala 1A', 11, true),
  ('sala-12', 'Sala 2A', 12, true),
  ('sala-13', 'Sala 3A', 13, true),
  ('sala-14', 'Sala 4A', 14, true),
  ('sala-15', 'Sala 5A', 15, true),
  ('remoto-grafica', 'Grafica remoto', 16, true),
  ('remoto-sound', 'Sound remoto', 17, true)
on conflict (code) do update set
  display_name = excluded.display_name,
  sort_order = excluded.sort_order,
  active = excluded.active;
