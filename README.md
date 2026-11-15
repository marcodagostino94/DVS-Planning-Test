# DVS Planning v44.1

Include Backup Agent 2.2.0 completo. Base interfaccia: v43.3 TEST iPad.

## Aggiornamento
Carica il contenuto della cartella su GitHub come di consueto. Dopo la pubblicazione, in Impostazioni > Backup premi Scarica Backup Agent e apri il PKG sul Mac autorizzato. Non occorre disinstallare la versione precedente. Configurazione, stato, autorizzazione e cartella scelta vengono conservati. L'installer archivia il programma precedente e sostituisce programma e runtime.
Se un backup è in corso, attendi che termini e ripeti l'installazione. Dopo l'installazione premi Backup ora nella Utility e verifica la nuova coppia.

## Nuovo Mac
Lo stesso PKG installa programma, runtime e Utility anche senza installazioni precedenti. Scegli la cartella di destinazione e autorizza il nuovo computer dalle impostazioni Backup del Planning. In una cartella già usata dal nuovo Agent, le copie complete vengono riconosciute tramite i relativi file di verifica.

## Copie
Nella destinazione scelta viene creata DVS_Backup_Storico/ANNO. Ogni backup riuscito crea una sottocartella con data, ora e identificativo, contenente Planning_ANNO.xlsx, Planning_ANNO_SUCCESSIVO.xlsx, DVS_Planning_Backup.json e backup-completo.json.
Si conservano le ultime 7 coppie per anno. La pulizia parte solo dopo la verifica della nuova coppia. Il primo backup del nuovo anno crea la nuova cartella senza eliminare copie dell'anno precedente.
Le vecchie cartelle possono essere rimesse accanto a DVS_Backup_Storico: non vengono cancellate o incorporate automaticamente. Le copie con file aggiunti, modificati o in conflitto sono conservate: in questi casi il numero può superare temporaneamente sette.
Ogni copia contiene due Excel: anno corrente e successivo, anche quando il successivo è vuoto. Nel 2026: Excel 2026 e 2027; dal primo backup del 2027: Excel 2027 e 2028 nella nuova cartella 2027. Il JSON conserva le tabelle esportate dall'Agent precedente e la vista Planning dei due anni. Questa versione non aggiunge uno schema SQL o nuove tabelle al backup.

## Verifiche
Test locali: rotazione, errori, cambio anno, riconoscimento copie su nuovo Mac, protezione cartelle precedenti e conflitti. Verificati struttura, checksum e script del PKG completo. Installer non firmato/notarizzato; installazione macOS e sincronizzazione iCloud da verificare sul Mac. Nessun accesso al database durante la preparazione. Nessuno SQL da eseguire.
