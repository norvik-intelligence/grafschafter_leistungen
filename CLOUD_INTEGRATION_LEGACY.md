# Grafschafter Leistungen: bestehende Oberfläche + Cloud-Erweiterung

**Verbindliche Produktentscheidung:** Die produktive Oberfläche aus `index.html`, `style.css`, `app.js` und `kunden.js` bleibt die einzige Benutzeroberfläche. Die separate Next.js-Oberfläche in `os/` wird **nicht** als Ersatz ausgerollt.

## Vorhandene Funktionen schützen
- IndexedDB-Tresor mit PBKDF2/AES-GCM, bestehende Passphrase und lokale Kundendaten unverändert erhalten.
- Bestehende Rechnung, Nachweis, Drucklayouts, Monatsakten und Geschäftsstandardwerte beibehalten.
- Keine automatische Migration, keine Löschung, kein automatischer Klartext-Upload.
- Neue Bedienflächen ausschließlich im vorhandenen visuellen Stil, optional und rückwärtskompatibel.

## Sichere Cloud-Anbindung in Etappen
1. Server-API unter `/api/` für die bestehende statische Vercel-App; keine Tokens im Browser.
2. Sichere serverseitige Anmeldung, Rollen und Mandantenzuordnung; CSRF-Schutz und Ratenbegrenzung für schreibende Endpunkte.
3. Dediziertes D1-Runtime-Token in Vercel Secrets; D1-Verbindung und Berechtigungen serverseitig testen.
4. Verschlüsselte Kundendaten aus dem entsperrten Tresor nur nach expliziter Zustimmung und mit überprüfbarem Importprotokoll übernehmen. Bestehende Monatsakten erhalten.
5. Unternehmensstammdaten in jedem neuen Kundenformular automatisch vorbelegen (bestehende verschlüsselte `business`-Voreinstellungen berücksichtigen).
6. R2-Upload mit Dateigrößen- und Typprüfung, privatem Bucket, Malware-Scanning und verschlüsselten Objekten; niemals öffentliche R2-URLs für Kundendokumente.
7. KI-Auslesung ausschließlich mit Vorschau, menschlicher Freigabe, dokumentierter Rechtsgrundlage und datenschutzkonformem Dienst.
8. §45b-Lots mit 131 EUR/Monat, Vorjahresablauf 30.06. und manueller Verifikation. §39 nicht mit veralteten 1612 EUR hartkodieren.

## Release-Gates
- Bestehende Kunden-/Monatsakten und PDF-Drucke gegen Referenz testen.
- Authentifizierung, Zugriff über fremde Organisationen, Upload und Wiederherstellung testen.
- Datenschutzprüfung, AVV, Berechtigungen und Backup-/Recovery-Prozess abschließen.
- Erst nach Freigabe aus dem Feature-Branch in `main` übernehmen und die **bestehende** Vercel-Domain aktualisieren.

**Aktueller Status:** Diese Datei dokumentiert die Zielarchitektur. Es gibt noch keine produktive Cloud-Synchronisierung in der bisherigen Oberfläche.
