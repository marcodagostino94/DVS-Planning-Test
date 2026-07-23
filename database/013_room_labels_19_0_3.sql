-- DVS Planning v19.0.3
-- Aggiorna esclusivamente i nomi visibili delle sale.
-- I codici usati dai turni e l'ordinamento restano invariati.

begin;

update public.rooms
set display_name = case code
  when 'sala-11' then 'Sala 1A'
  when 'sala-12' then 'Sala 2A'
  when 'sala-13' then 'Sala 3A'
  when 'sala-14' then 'Sala 4A'
  when 'sala-15' then 'Sala 5A'
  else display_name
end
where code in ('sala-11', 'sala-12', 'sala-13', 'sala-14', 'sala-15');

commit;
