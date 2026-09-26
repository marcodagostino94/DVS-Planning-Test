# DVS Planning v38.0 TEST

Base v37.1. Nuova sezione Schema turni e allineamento colonne Variabili.
Nessun nuovo SQL se è già stato applicato database/014_variable_request_id_v37.sql.
La configurazione Supabase è quella della versione precedente: verificare di usare l’ambiente di test desiderato prima di modificare dati. Nessuna pubblicazione automatica.

Schema turni è una vista in sola lettura. Mese selezionabile, programmi in ordine alfabetico, tabelle per Montaggio (EDIT e ASSISTENTE), Grafica, Color e Sound. Ogni cella contiene le ore di un solo turno. Le righe sono distinte per ora iniziale e standard/variabile e ripetute secondo il massimo numero giornaliero di ciascun gruppo. Turni CLIENTE e originali barrati esclusi, destinazioni degli spostamenti incluse. Provvisori arancioni, inclusi nei totali. Le ore sono decimali; doppia postazione non raddoppia la durata.

Le note con parole che iniziano per UFFICI (UFFICIAL., UFFICI, UFFICIALMENTE, UFFICIALE) seguite da intervalli come 10-18, 10:00–18:00 o dalle 10 alle 18 sostituiscono soltanto l’orario nello schema. La data resta quella del Planning. Una stella segnala le celle con orario ufficiale. Intervalli incompleti, multipli o non validi sono mostrati in Da verificare e non conteggiati: i totali sono indicati come parziali. Correggere la nota nel Planning e lo schema si aggiorna. Nessuna nota o turno viene riscritto dalla vista.

Nessuna stampa, intestazione amministrativa o totale per produzione.
