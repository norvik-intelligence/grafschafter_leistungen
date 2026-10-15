# Cloudflare D1 + R2 – Inbetriebnahme

## Aktueller Stand
- D1-Datenbank und privater R2-Bucket existieren im Cloudflare-Konto.
- Kunden, Leistungen, Rechnungsentwürfe, Budgets und Einstellungen nutzen D1-API-Endpunkte.
- Der neue Endpunkt `/api/document-file` lädt PDF/JPEG/PNG/WebP (maximal 4 MiB) nach R2 hoch, schreibt die Metadaten in D1 und bietet authentifizierte Downloads.
- Dateien werden nicht öffentlich freigegeben; der R2-Bucket benötigt keine öffentliche Domain.
- Der bisherige lokale Tresor bleibt unverändert. Eine echte Migration aus dem Tresor ist noch nicht umgesetzt und darf erst nach verifizierter Vollständigkeit erfolgen.

## Erforderliche Konfiguration vor Benutzung
1. In Cloudflare ein **separates, minimal berechtigtes API-Token** für R2-Objektlesen und -schreiben in `grafschafter-dokumente` erstellen. Nicht das D1-Token wiederverwenden, falls es unnötige Rechte besitzt.
2. Dieses Token als **sensitive** Vercel-Umgebungsvariable `CF_R2_API_TOKEN` für Preview hinterlegen. `CF_R2_BUCKET=grafschafter-dokumente` ist optional.
3. Die Vercel-Preview-Anmeldung mit einem selbst gewählten, sicheren Administratorpasswort korrekt initialisieren: `OS_ADMIN_PASSWORD_SCRYPT` ist derzeit kein bestätigter Hash eines bekannten Passworts. `OS_SESSION_SECRET` rotieren. Passwörter und Token niemals in GitHub einchecken.
4. Neue Vorschau deployen und Upload, Download, Ablehnung nicht angemeldeter Requests, falsche Dateitypen, D1-Metadaten und R2-Objekte testen.
5. D1- und R2-Datensicherung, Benutzerrollen, Aufbewahrungsfristen, Löschprozesse und Datenschutzprüfung vor echtem Kundeneinsatz abschließen.

## Grenzen
Der Upload erfolgt derzeit als Base64-JSON durch die Vercel-Funktion, mit 4 MiB Dateigrenze. Für größere Dateien und produktiven Mehrbenutzerbetrieb sollten zeitlich begrenzte Upload-URLs über einen Worker mit R2-Binding eingeführt werden. Der Upload ist nur verfügbar, wenn `CF_R2_API_TOKEN` gesetzt ist. Ein erfolgreicher CI- oder Vercel-Build bestätigt **nicht** den R2-Zugriff.
