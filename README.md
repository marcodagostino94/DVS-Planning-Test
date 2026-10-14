# DVS Planning v41 TEST SAFARI 5

Base: v41 ufficiale. Versione sperimentale per il sito di test.

## Installazione
Sostituire i file dell’app sul sito di test con il contenuto di questa cartella e ricaricare.
Nessuno SQL da eseguire. Non pubblicare ancora sul sito ufficiale.
La configurazione Supabase è quella della v41: le modifiche ai turni nel test agiscono sugli stessi dati.

## Modifica
Solo Safari su Mac: sotto il 100% riduzione visiva tramite transform; dal 100% in su zoom nativo senza trasformazione di ingrandimento. Anche le copie delle intestazioni usano la stessa modalità.
Area scorrevole coerente con la scala. Intestazioni visive separate dalla griglia trasformata e fissate con position:sticky nativo. Nessun riposizionamento JavaScript durante lo scorrimento.
Chrome mantiene il percorso di zoom originale. Su Mac il nome montatore parte da 11 px nella fascia originale e l’apertura di Planning dal menu imposta 80% sulla data odierna. iPhone e iPad invariati.
Il TEST 4 non ha risolto la sfocatura: questo test evita di ingrandire con transform, usando lo zoom nativo dal 100%. Il risultato grafico e il passaggio attraverso il 100% vanno verificati sul Mac. Rimane la rimozione delle trasformazioni 3D delle card.
Il pulsante Diagnostica esporta misure su richiesta, senza testi di programmi, nomi o note.
Le percentuali indicate nei file diagnostici corrispondono allo zoom scelto anche con il nuovo sistema.

## Prova sul Mac
Controllare al 200% la nitidezza rispetto alla v41 ufficiale e al TEST 4. Provare 80% → 100% → 125% → 200% → 80%, anche dopo ricarica; verificare a capo, barre fisse e selezione.
Aprire Planning dal menu: deve tornare all’80% e alla data odierna. Verificare nomi brevi e lunghi nella fascia montatore.
Confrontare 100%, 78%, 50%, 125% e ritorno a 100%, prima senza ricaricare e poi dopo la ricarica.
Controllare che gli a capo del medesimo titolo rimangano uguali e che non compaiano sovrapposizioni.
Scorrere in entrambe le direzioni: giorni e sale devono rimanere visibili.
Controllare selezione singola e multipla, menu destro e pulsante Oggi.
Per il trascinamento usare soltanto un turno di prova: il database è condiviso.
Esportare la diagnostica se persistono differenze; per tornare indietro ripubblicare la v41 ufficiale.

## Verifiche
Sintassi JavaScript, isolamento del nuovo codice a Safari desktop, sequenze di zoom,
geometria delle intestazioni al 50/78/100/125%, assenza di compensazione JavaScript dello scorrimento, aggiornamento al cambio contenuto,
conservazione delle dimensioni quando la vista è nascosta, risorse locali e confronto con la base.
Verifiche automatiche di logica con DOM simulato, non una certificazione grafica Safari.
Browser WebKit non avviabile nell’ambiente di sviluppo per dipendenze di sistema mancanti.
La verifica grafica e dei gesti sul Mac rimane necessaria.
Nessuna connessione o modifica al database effettuata durante la preparazione.
