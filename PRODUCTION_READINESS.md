# Produktionsfreigabe – Grafschafter Leistungen

**Stand:** Nicht freigegeben. Bestehende Produktionsoberfläche unverändert lassen, bis alle Punkte erfüllt sind.

## Vor dem Deployment
- [ ] Vercel-Limit aufgehoben; Feature-Branch als Preview deployt
- [ ] Production-Umgebungsvariablen CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_D1_API_TOKEN, OS_SESSION_SECRET und OS_ADMIN_PASSWORD_SCRYPT gesetzt; Geheimnisse nicht ins Repository oder in Chats schreiben
- [ ] Admin-Passwort-Hash aus einem tatsächlich festgelegten Passwort erzeugt und Anmeldung getestet; Session-Secret frisch und zufällig
- [ ] Cloudflare R2 Upload-Berechtigungen und privater Bucket eingerichtet; Upload/Download nur authentifiziert, Dateityp und Größe beschränkt
- [ ] `node --test tests/*.test.js` lokal oder in CI erfolgreich

## Funktionstests
- [ ] Login, Logout, Ablauf der Session, falsches Passwort und wiederholte Fehlversuche
- [ ] D1-Lese- und Schreibtest mit synthetischem Testkunden; Neuladen und erneutes Abrufen
- [ ] Kunden, Leistungen, Rechnungsentwürfe, Firmendaten und Budgets vollständig prüfen
- [ ] Dokumente hochladen, wieder herunterladen und Berechtigungen testen
- [ ] Navigation auf Smartphone und Desktop; PDF-Ausgabe und Druck prüfen
- [ ] Fehlende/ungültige Eingaben, D1-Ausfall, R2-Ausfall und Netzwerkunterbrechungen testen
- [ ] Verschlüsselte lokale Originaldaten vor Migration sichern, Migration explizit freigeben, Anzahl/Prüfsummen vergleichen und Rückweg prüfen
- [ ] Aufbewahrung, Zugriffskontrollen, AV-Verträge, Löschung und DSGVO-Freigabe für reale Kundendaten dokumentieren
- [ ] Backup-Wiederherstellung in isolierter Testumgebung erfolgreich

## Freigabe
Erst nach bestandenem Ende-zu-Ende-Test den Feature-Branch prüfen, freigeben und nach Production übernehmen. Den lokalen Tresor nicht automatisch löschen.
