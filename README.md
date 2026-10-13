# DVS Planning v41 TEST SAFARI

Solo per il sito di test. Nessun SQL da eseguire.
Unica modifica funzionale rispetto alla v41: fitText non modifica i caratteri su WebKit desktop Mac. Chrome, iPhone, iPad, CSS, zoom e calcolo delle altezze invariati.
Questa è una prova diagnostica, non una correzione definitiva. I testi possono ancora risultare tagliati.

Aprire il sito di test e verificare la scritta v41 TEST SAFARI. Confrontare lo stesso mese e le stesse sale al 100%, 63% e 50%, poi risalire al 100%. Fare una prova anche dopo aver ricaricato al 50%. Inviare screenshot di Safari e segnalare se i caratteri diventano uniformi, se restano tagli e se cambia la fluidità.

La configurazione è quella della v41: il sito di test condivide i dati con il sito principale. Per questa prova basta visualizzare, scorrere e cambiare zoom; non occorre modificare turni.
Per tornare indietro ripubblicare la v41 originale nel sito di test.
Verificati sintassi JavaScript, isolamento della modifica e identità dei CSS. Nessuna verifica visiva su Safari effettuata qui.
