# Grafschafter Leistungen
Interne, schlanke Web-App zur Erstellung von Leistungsnachweisen und Rechnungen für Grafschafter Alltagsservice, Inhaberin Sokayna Malki.

## Kundenverwaltung und Monatsakten

Die Anwendung besitzt einen **verschlüsselten Kunden-Tresor** im lokalen IndexedDB-Speicher des Browsers. Er ist durch eine selbstgewählte Passphrase (mindestens 12 Zeichen) geschützt. Technisch werden die gespeicherten Datensätze über **AES-256-GCM** verschlüsselt; der Schlüssel wird mithilfe von **PBKDF2-SHA-256 (310.000 Iterationen)** aus der Passphrase hergeleitet und nur während der entsperrten Sitzung im Speicher gehalten.

1. Beim ersten Öffnen Passphrase festlegen und sicher außerhalb des Geräts verwahren.
2. **Neuer Kunde** wählen, Stammdaten und ggf. einen ersten Einsatz eintragen, dann **Kunden & Monat speichern**.
3. Für denselben Kunden im nächsten Monat **+ Folgemonat** anklicken. Der vorherige Leistungsmonat bleibt unverändert gespeichert.
4. Frühere Monatsakten im Dropdown **Gespeicherte Monatsabrechnungen** erneut laden oder ändern. Nach Änderungen wird die geöffnete Kundenakte automatisch gespeichert.
5. **Backup sichern** erzeugt eine verschlüsselte `.gkbackup`-Datei. **Backup laden** kann sie auch auf einem anderen Gerät mit der zugehörigen Passphrase wiederherstellen.

**Einschränkungen:** Der Tresor ist **nur auf diesem Browserprofil und Gerät** verfügbar. Es gibt keine Cloud-Synchronisierung; ein anderer Browser benötigt den verschlüsselten Backup-Import. Bei gelöschten Browserdaten, Datenverlust oder vergessenem Passwort ist ohne funktionierendes Backup **keine Wiederherstellung** möglich. Eine Passphrase darf nicht ins GitHub-Repository oder in Vercel-Umgebungsvariablen geschrieben werden. Die App erfüllt durch diese Verschlüsselung nicht automatisch sämtliche DSGVO-Pflichten. Schutzmaßnahmen für Endgeräte und Backups bleiben erforderlich.

## Funktionen
- Rechnungstypen: Entlastungsbetrag (§ 45b SGB XI), stundenweise Verhinderungspflege (§ 39 SGB XI), Privatrechnung.
- Stammdaten der versicherten Person bzw. des Kunden und Pflegekasse, optional direkte Abrechnung mit Abtretung.
- Beliebig viele Einsätze mit Datum, Beginn, Ende, Pausen, Leistung und Notiz.
- Automatisch errechnete Einsatzminuten, Stundensumme und Rechnungsbetrag.
- Monatlicher Leistungsnachweis mit 31 Kalendertag-Spalten und Unterschriftsfeldern (A4 quer).
- Einzelrechnung mit eindeutiger manuell prüfbarer Rechnungsnummer, Steuerhinweis, IBAN (A4 hoch).
- Drucken oder über den Browser als PDF speichern.
- Verschlüsselte Kundenkartei und Monatsakten im lokalen Browserdatenspeicher, mit passphrasegeschütztem Backup/Restore.
- Import früherer einzelner JSON-Monatsdateien; kein Kundendatenbank-Backend, kein API-Endpunkt, kein Versand der Eingaben.

## Datenschutz und Zugriffe
Die App verarbeitet Formularinhalte lokal auf dem Endgerät. Nach Entsperrung können Kundenstammdaten und Monatsakten verschlüsselt in IndexedDB gespeichert werden. Die App überträgt die eingegebenen Kundendaten nicht an einen Server. Der alte Einzelmonat-Import akzeptiert unverschlüsselte JSON-Dateien aus der Vorversion; der sichere Backup-Knopf erzeugt hingegen ausschließlich verschlüsselte Backups. Gedruckte/PDF-Rechnungen und exportierte Einzelmonatsdateien können Gesundheitsdaten im Klartext enthalten und müssen geschützt werden.

Die Bereitstellung auf Vercel sollte mit Vercel Authentication/SSO oder gleichwertiger Zugriffskontrolle geschützt werden. Nicht öffentlich als Kundenportal betreiben. Das offizielle Logo wird von www.grafschafter-alltagsservice.de nachgeladen; dabei werden keine Formulardaten übertragen.

## Abrechnungsrechtlicher Hinweis
Rechnungen sind Vorlagen, keine rechtsverbindliche Feststellung der Erstattungsfähigkeit. Vor Versand sind neben Rechnungspflichtangaben insbesondere die NRW-Anerkennung, der konkrete Leistungsumfang, die Abrechnungsvollmacht/Abtretung, ggf. Genehmigung bzw. Budget bei § 39, der richtige Steuerhinweis und die kassenindividuellen Abrechnungswege zu prüfen. Ein IK berechtigt allein nicht zu jeder Abrechnung. Die Software nimmt keine automatische Prüfung oder Übermittlung an Pflegekassen vor.

## Bereitstellung
Statische HTML-, CSS- und JavaScript-Dateien. Kein Build, keine Abhängigkeiten, keine Datenbank. Bei Vercel das GitHub-Repository verbinden, Framework: Other, Root: Projektwurzel. Der Quellcode darf öffentlich sein; echte Kundendaten niemals ins Repository committen.

## Lokale Nutzung
index.html über einen lokalen statischen Webserver öffnen, z. B. \`python3 -m http.server 8000\`, und http://localhost:8000 aufrufen.

© Grafschafter Alltagsservice. Interner Verwendungszweck.

## Tests

`node --check app.js && node --check kunden.js && node --test tests/*.test.mjs`

GitHub Actions führt Syntax- und Kundentresor-Tests bei jedem Pull Request aus.
