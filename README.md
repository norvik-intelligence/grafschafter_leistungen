# Grafschafter Leistungen
Interne, schlanke Web-App zur Erstellung von Leistungsnachweisen und Rechnungen für Grafschafter Alltagsservice, Inhaberin Sokayna Malki.

## Funktionen
- Rechnungstypen: Entlastungsbetrag (§ 45b SGB XI), stundenweise Verhinderungspflege (§ 39 SGB XI), Privatrechnung.
- Stammdaten der versicherten Person bzw. des Kunden und Pflegekasse, optional direkte Abrechnung mit Abtretung.
- Beliebig viele Einsätze mit Datum, Beginn, Ende, Pausen, Leistung und Notiz.
- Automatisch errechnete Einsatzminuten, Stundensumme und Rechnungsbetrag.
- Monatlicher Leistungsnachweis mit 31 Kalendertag-Spalten und Unterschriftsfeldern (A4 quer).
- Einzelrechnung mit eindeutiger manuell prüfbarer Rechnungsnummer, Steuerhinweis, IBAN (A4 hoch).
- Drucken oder über den Browser als PDF speichern.
- JSON-Export/Import zur eigenen gesicherten Aufbewahrung; keine Kundendatenbank, kein API-Endpunkt, kein Versand der Eingaben.

## Datenschutz und Zugriffe
Diese App verarbeitet Formularinhalte ausschließlich im Arbeitsspeicher des Browsers und überträgt die Eingaben nicht an den Server. Beim Schließen oder Aktualisieren ohne Export gehen nicht gespeicherte Angaben verloren. Die vom Nutzer gespeicherten JSON-Dateien und ausgedruckten PDFs können personenbezogene Gesundheitsdaten enthalten und müssen geschützt werden.

Die Bereitstellung auf Vercel sollte mit Vercel Authentication/SSO oder gleichwertiger Zugriffskontrolle geschützt werden. Nicht öffentlich als Kundenportal betreiben. Das offizielle Logo wird von www.grafschafter-alltagsservice.de nachgeladen; dabei werden keine Formulardaten übertragen.

## Abrechnungsrechtlicher Hinweis
Rechnungen sind Vorlagen, keine rechtsverbindliche Feststellung der Erstattungsfähigkeit. Vor Versand sind neben Rechnungspflichtangaben insbesondere die NRW-Anerkennung, der konkrete Leistungsumfang, die Abrechnungsvollmacht/Abtretung, ggf. Genehmigung bzw. Budget bei § 39, der richtige Steuerhinweis und die kassenindividuellen Abrechnungswege zu prüfen. Ein IK berechtigt allein nicht zu jeder Abrechnung. Die Software nimmt keine automatische Prüfung oder Übermittlung an Pflegekassen vor.

## Bereitstellung
Statische HTML-, CSS- und JavaScript-Dateien. Kein Build, keine Abhängigkeiten, keine Datenbank. Bei Vercel das GitHub-Repository verbinden, Framework: Other, Root: Projektwurzel. Der Quellcode darf öffentlich sein; echte Kundendaten niemals ins Repository committen.

## Lokale Nutzung
index.html über einen lokalen statischen Webserver öffnen, z. B. \`python3 -m http.server 8000\`, und http://localhost:8000 aufrufen.

© Grafschafter Alltagsservice. Interner Verwendungszweck.
