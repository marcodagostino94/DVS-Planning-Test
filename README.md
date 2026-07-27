# DVS Planning v20.3.2

## Correzione 20.3.2

- Inserito uno spazio fisico scorribile dopo i Promemoria della Dashboard su iPhone verticale.

## Correzione 20.3.1

- Spazio di scorrimento reale dopo l'ultima scheda della Dashboard su iPhone verticale.

## Correzioni 20.3

- Maggiore spazio finale scorribile in Dashboard e Centro Stampa su iPhone.
- Aggiunto il comando per tornare ai Riepiloghi dall'anteprima PDF.

## Novità 20.2

- Barra Liquid Glass realmente sovrapposta ai contenuti.
- Capsula attiva trascinabile tra le sezioni su iPhone verticale.
- La sezione viene aperta al rilascio della capsula.

## Novità 20.1

- Nuova barra di navigazione flottante Liquid Glass su iPhone verticale.
- Sezione attiva evidenziata con una capsula traslucida.
- iPhone orizzontale, iPad e Mac invariati.

## Novità 20.0

- Su iPhone, il pannello Utenti collegati include il comando `Esci dal profilo`.
- Su iPhone in verticale resta attiva l'interfaccia iPhone.
- Ruotando un iPhone in orizzontale viene applicata automaticamente l'interfaccia iPad.
- Mac e iPad mantengono il comportamento precedente.

Release finale dell'applicazione collaborativa per la gestione del Planning di Digital Video Service.

## Correzione 19.0.3

- Le etichette visibili `Sala 11`–`Sala 15` diventano `Sala 1A`–`Sala 5A`.
- I codici interni `sala-11`–`sala-15` e l'ordine delle sale rimangono invariati.
- Aggiornate Dashboard, Planning, selezione turno, riepiloghi e stampa tramite l'elenco centrale delle sale.
- Inclusa la migrazione Supabase `013_room_labels_19_0_3.sql` per allineare stampa ed export del Backup Agent.
- Backup Agent incluso e invariato alla versione 2.0.1.

## Correzione 19.0.2

- Semaforo condiviso verde su tutti i dispositivi soltanto quando autorizzazione, cartella e ultimo backup sono validi e il backup risale a non più di 24 ore.
- Un Mac non autorizzato non può più sovrascrivere lo stato globale del backup.
- Backup Agent incluso aggiornato alla versione 2.0.1.

## Correzione 19.0.1

- Aggiunto il comando **Autorizza nuovo computer** dopo la revoca del Backup Agent.
- Il profilo connesso diventa automaticamente l'utente autorizzato.
- Non è più necessario eseguire manualmente una query SQL per registrare un nuovo Mac.

## Contenuto della release

- Corretto su iPhone il pulsante `•••`: apre lo stesso menu contestuale utilizzato su Mac.
- La pressione lunga resta riservata allo spostamento dei turni.
- Conservato il comportamento già funzionante su Mac e iPad.
- Verificati i riferimenti a file, icone, documentazione, database e Backup Agent.
- Aggiornati titolo, manifest, stampe e schermata Informazioni alla v19 Golden Master.

## Avvio

Aprire `index.html` oppure pubblicare l'intera cartella sul servizio web già utilizzato dal progetto.

## Copyright

© 2026 Marco D'Agostino per Digital Video Service  
Ideazione e sviluppo: Marco D'Agostino per Digital Video Service.  
Tutti i diritti riservati.
