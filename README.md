# DVS Planning v37.1 TEST

Versione di prova basata sulla v36.0 definitiva, con nuova sezione Variabili e ID richiesta facoltativo.

Prima dell’uso leggere LEGGIMI_TEST_v37.txt ed eseguire database/014_variable_request_id_v37.sql **sul progetto Supabase di test**. Non rieseguire SQL storici o seed. Verificare la configurazione in src/config.js: un sito di test collegato al database condiviso modifica i dati condivisi.

La sezione raggruppa i variabili per produzione e programma, in ordine di data e ora, con totali mensili per programma. Comprende i provvisori, identificati come tali. Considera la data e l’orario attuali; esclude le copie barrate dei turni spostati da capitolato.

ID richiesta facoltativo in inserimento/modifica; al passaggio da provvisorio a definitivo viene richiesto nuovamente, anche per selezioni multiple. OK con campo vuoto è valido.

Grafica del Planning e backup agent conservati. Nessuna pubblicazione o migrazione automatica.

Aggiornamento v37.1: elenco Variabili scorrevole e semafori di stato. Se lo SQL 014 è già stato eseguito per la v37.0, non occorrono altre modifiche al database.
