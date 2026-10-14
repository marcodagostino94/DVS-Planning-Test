# DVS Planning v42

Versione da verificare sul sito di test prima della pubblicazione generale.
Base: TEST SAFARI 5 confermato. Nessuna modifica derivata dal TEST 6.

## Aggiornamento dalla v41
Sostituire i file del sito con il contenuto della cartella DVS-Planning_v42.
Il file src/diagnostica.js delle precedenti prove non serve più e può essere eliminato dal repository.
Nessuno SQL da eseguire. Configurazione del database invariata; il sito di test usa gli stessi dati.

## Modifiche
Rimossi pulsante e codice Diagnostica.
Su Mac, nella stessa sala e fascia, le card riempiono l’altezza della più alta anche quando questa contiene note. La misurazione parte dalle dimensioni naturali e può ridursi quando una nota viene rimossa. Conservata la gestione dei turni che occupano due fasce.
Mantenuti nome montatore più grande nella fascia originale e apertura del Planning sulla data odierna con zoom 80% sui Mac.
Safari conserva il sistema del TEST 5: riduzione tramite trasformazione sotto il 100%, zoom nativo dal 100% in su e intestazioni fisse. La lieve morbidezza sotto il 100% resta quella nota del TEST 5.
iPhone e iPad mantengono il comportamento precedente.

## Verifica prima della pubblicazione
Confrontare la riga con una nota e le card adiacenti. Controllare righe con due turni, turni intermedi su doppia fascia e blocchi sala.
Verificare Safari e Chrome a 80%, 100%, 200%, scorrimento e selezione.
Il database è condiviso: eventuali inserimenti o spostamenti di prova modificano i dati reali.

## Controlli eseguiti
Sintassi JavaScript, risorse locali, assenza Diagnostica, integrità ZIP.
Test di logica sull’allineamento: altezza comune, nessuna crescita cumulativa, riduzione dopo rimozione nota, comportamento touch invariato. Confronto del modulo zoom con il TEST 5.
Non eseguita una verifica grafica in Safari nell’ambiente di preparazione; necessaria la verifica sul Mac.
Nessuna modifica al database durante la preparazione.

Aggiornamento grafico: GRAFICA, SOUND e COLOR in rosso con peso 900, come VARIABILE. Sfondi e fascia montatore delle sole card di queste lavorazioni leggermente più intensi; tonalità assegnata invariata.
