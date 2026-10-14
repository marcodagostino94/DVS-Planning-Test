# DVS Planning v41 TEST SAFARI 6

Alternativa sperimentale. Conservare il TEST 5 come riferimento funzionante.

## Installazione
Sostituire i file del solo sito di test e ricaricare. Nessuno SQL.
La configurazione Supabase è invariata: i turni modificati sul sito di test appartengono allo stesso database.

## Modifiche
Safari Mac usa lo zoom nativo a tutte le percentuali e le intestazioni sticky originali, senza copie e senza trasformare la griglia in scala.
Programma e note vanno a capo tra parole. Il testo si riduce quando una parola non entra nella larghezza disponibile; limite di adattamento 5 px.
Gli spazi delle righe vengono ricalcolati dopo il testo, includendo i bordi e le card a doppia altezza. Il ricalcolo è raggruppato a 100 ms dalla fine del cambio zoom per limitare il lavoro durante rotella e gesto.
Lo spazio necessario alle card resta variabile secondo contenuti e numero di turni: non si eliminano le fasce vuote intenzionali di allineamento degli orari.
Chrome conserva il comportamento precedente. Nomi più grandi (11 px di partenza) e apertura Planning all’80% restano attivi sui Mac. iPhone e iPad invariati.

## Prova
Confrontare Safari con Chrome a 50%, 80%, 100%, 125%, 200%, poi tornare all’80%, anche dopo ricarica.
Controllare nitidezza, parole intere, nomi lunghi, note, doppia postazione, card singole e doppie, spazi tra righe.
Scorrere in entrambe le direzioni e controllare le intestazioni. Verificare selezione e trascinamento solo su turni di prova.
Usare Diagnostica in caso di problemi. Non pubblicare ancora a tutti.

## Verifica effettuata
Sintassi JavaScript, risorse locali, archivio ZIP. Test di logica con DOM simulato: esclusione altri browser/dispositivi, ciclo zoom 50/80/100/200, adattamento a una dimensione font sproporzionata, altezze normali e doppie.
Non è stato possibile eseguire il browser Safari in questo ambiente: la resa grafica, la velocità e le interazioni vanno confermate sul Mac.
Nessuna connessione o scrittura al database durante la preparazione.
