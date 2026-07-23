# Supabase — Build 9.0

Eseguire in SQL Editor:

`database/005_complete_database_build_9.sql`

La migrazione preserva i dipendenti esistenti e crea lo schema completo di base.

Tabelle previste:
- qualifications
- staff
- rooms
- productions
- shifts
- app_profiles
- app_settings

Dopo l'esecuzione controllare:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```
