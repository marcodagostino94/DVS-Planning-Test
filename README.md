# DVS Planning v35.3 TEST
Base v34. Variazione: tasto destro su un turno → Variazione → nuova data, orari HH:MM e sala → VARIA. Annulla non modifica dati.
L’originale rimane con X e senza montatore. Il nuovo mantiene programma, produzione, montatore e caratteristiche. Le nuove note usano il formato SPOSTATO AL 18 SET - MAIL / SPOSTATO DAL 15 SET - MAIL. Le note dei turni già salvati restano invariate. La X dipende dalla riga SPOSTATO AL: cancellarla rimuove la X. Le note precedenti vengono conservate; oltre 100 caratteri l’app chiede di accorciarle. In variazioni successive viene aggiornata l’indicazione automatica.
Turni confermati: annullare prima la conferma. Un originale già barrato non può essere variato nuovamente; si varia il nuovo turno. Sale filtrate per data e fascia oraria, considerando occupanti anche i turni barrati. Conteggi e backup invariati. Nessuna migrazione SQL richiesta. Configurazione Supabase originale conservata: provare sul sito di test e verificare il database configurato. Nessuna pubblicazione automatica.

Icone aggiornate dal PNG Planning originale fornito, senza ritocchi.
