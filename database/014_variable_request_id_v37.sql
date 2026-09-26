-- DVS Planning v37.0 TEST. Eseguire sul progetto di TEST prima di usare la v37.
-- Aggiunta compatibile con v36; non crea tabelle e non modifica dati o policy.
BEGIN;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS request_id text;
COMMENT ON COLUMN public.shifts.request_id IS 'ID richiesta facoltativo per turni variabili; conserva zeri iniziali e lettere.';
COMMIT;
NOTIFY pgrst, 'reload schema';
