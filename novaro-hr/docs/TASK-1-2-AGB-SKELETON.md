# NOVARO HR – ALLGEMEINE GESCHÄFTSBEDINGUNGEN (AGB)

**Version:** 1.0 (Draft für Legal Review)  
**Gültig ab:** 1. Januar 2027  
**Sprache:** Deutsch (DE)  
**Gerichtsstand:** Deutschland  

---

## PRÄAMBEL

Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") regeln die Beziehung zwischen Novaro HR GmbH (nachfolgend "Anbieter") und Unternehmen, die die Novaro HR Plattform nutzen (nachfolgend "Auftraggeber" oder "Kunde").

Die Novaro HR Plattform ist eine mandantenfähige Software-as-a-Service (SaaS)-Lösung zur Verwaltung von Arbeitszeiten, Urlaub, Abwesenheiten, Schichten und Personalfunktionen.

---

## 1. VERTRAGSGEGENSTAND

### 1.1 Leistungsumfang
Der Anbieter stellt eine cloudbasierte HR-Management-Plattform bereit, die umfasst:
- Zeiterfassung (manuell, QR, NFC, optional Geofencing)
- Urlaubsverwaltung und Abwesenheitserfassung
- Schichtplanung
- Dokumentenverwaltung
- Payroll-Integration (Import/Export)
- Berichtserstellung
- Rollenbasierte Zugriffskontrolle
- Audit Logging und Compliance-Reporting

### 1.2 Nicht Inbegriffenes
- Deutsche Steuer- und Sozialversicherungsberechnung (externe Integration)
- Rechtliche Beratung
- Anpassungsprogrammierung (außer im Enterprise-Plan)
- Hardware oder externe Systeme

---

## 2. SUBSCRIPTION & PREISMODELL

### 2.1 Verfügbare Pläne

| Plan | Preis (monatlich) | Preis (jährlich) | Mitarbeiter | Storage | API | Trial |
|---|---|---|---|---|---|---|
| **Starter** | €29 | €319 (Sparquote 8%) | Bis 25 | 5 GB | 10K/Tag | 14 Tage |
| **Professional** | €49 | €539 (Sparquote 8%) | Bis 250 | 50 GB | 100K/Tag | 14 Tage |
| **Enterprise** | €99+ | Custom | Unbegrenzt | Unbegrenzt | Unbegrenzt | 30 Tage |

### 2.2 Zahlungsbedingungen
- **Abrechnung:** Monatlich oder jährlich (Jahresabrechnung um 8% günstiger)
- **Zahlungsart:** Kreditkarte (Stripe), Banküberweisung (Enterprise)
- **Zahlungsfällig:** Am 1. des Monats (wiederkehrendes Abonnement)
- **Rechnungsverzug:** Nach 14 Tagen Mahnung, dann 7 Tage Frist
- **Stornierung:** Jederzeit zum Ende der Abrechnungsperiode möglich

### 2.3 Zusatzgebühren
- **Überschreitungskosten:** Über Plan hinaus = €5 pro 1.000 zusätzliche API-Calls/Tag
- **Add-ons:** Geofencing (€20/Monat), Premium Support (€100/Monat)
- **Data Export:** Bis 10 GB kostenlos, dann €1 pro GB

---

## 3. DATEN DES AUFTRAGEBERS

### 3.1 Datenbestandteile
Der Auftraggeber ist für die Vollständigkeit, Aktualität und Legalität folgender Daten verantwortlich:
- Mitarbeiterdaten (Name, Kontakt, Personalnummer)
- Vertragliche Daten (Eintritt, Austritt, Arbeitszeit)
- Dokumente (Verträge, Bescheinigungen)
- Zeiterfassungsdaten (Stempel, Pausen, Korrekturen)

### 3.2 Backup & Verfügbarkeit
- **Automatische Backups:** Täglich, redundant, EU-Server
- **Verfügbarkeitsziel (SLA):** 99,5% pro Monat (Excludes Force Majeure)
- **Recovery-Zeit-Ziel (RTO):** Bis zu 4 Stunden bei Datenvertust
- **Datenrettung:** Kostenlos bis 30 Tage zurück, dann €500/Request

### 3.3 Datensicherheit
- **Verschlüsselung:** TLS 1.3 in Transit, AES-256 at Rest
- **Zugriffskontrolle:** RLS (Row-Level Security), Role-Based Access Control (RBAC)
- **Audit Logging:** Alle Zugriffe und Änderungen geloggt, 7 Jahre Aufbewahrung
- **Penetrationstests:** Mindestens jährlich durch externe Firmen

---

## 4. ABWESENHEITEN, LIZENZEN, RECHTE

### 4.1 Auftraggeber-Rechte
Der Auftraggeber erhält eine nicht-ausschließliche, nicht-abtretbare Lizenz zur Nutzung der Plattform für interne Zwecke (Zeiterfassung, Personalverwaltung).

### 4.2 Einschränkungen
Der Auftraggeber darf **nicht**:
- Die Software reproduzieren, verändern, dekompilieren oder rückwärts entwickeln
- APIs für externe kommerzielle Zwecke nutzen
- Daten von anderen Tenants (Unternehmen) abzweigen
- Die Software an Dritte weiterlizenzieren
- Automatisierte Zugriffe ohne API-Lizenz durchführen

### 4.3 Intellektuelle Eigenschaft
- **Plattform:** Novaro HR behält alle Rechte an Code, Design, Dokumentation
- **Auftraggeber-Daten:** Auftraggeber behält Eigentumsrechte an seinen Daten
- **Feedback:** Feedback kann vom Anbieter ohne Vergütung genutzt werden

---

## 5. DATENSCHUTZ & COMPLIANCE

### 5.1 Datenverarbeitung
Der Anbieter ist Datenverarbeiter (gemäß Art. 28 DSGVO), der Auftraggeber ist Datenverantwortlicher.

- **Datenschutzerklärung:** Siehe Anlage B (Datenschutzerklärung)
- **AV-Vertrag:** Muss unterzeichnet sein vor Inbetriebnahme (siehe Anhang)
- **Datenübertragbarkeit:** Auftraggeber kann Daten jederzeit als CSV/JSON exportieren
- **Datenlöschung:** Nach Vertragsendeigung werden Daten nach 30 Tagen gelöscht (DSGVO Right to be Forgotten)

### 5.2 Besondere Kategorien von Daten
Sofern der Auftraggeber Gesundheitsdaten, Gewerkschaftszugehörigkeit oder andere sensible Daten speichert:
- Auftraggeber ist alleinig verantwortlich für die Rechtmäßigkeit
- Anbieter implementiert zusätzliche Schutzmaßnahmen auf Anfrage
- **Geofencing ist OPTIONAL und kann deaktiviert werden** (Art. 88 DSGVO)

### 5.3 Subunternehmer
Der Anbieter nutzt folgende Subunternehmer (Datenverarbeiter):
- **Supabase (Cloud Hosting):** EU (Frankfurt) — [Link zum AV-Vertrag]
- **Stripe (Payment Processing):** EU + USA (Privacy Shield) — [Link zum AV-Vertrag]
- **Sentry (Error Tracking):** EU + USA (Standard Contractual Clauses) — [Link zum AV-Vertrag]

Auftraggeber wird über Änderungen informiert (30 Tage Widerspruchsfrist).

---

## 6. COMPLIANCE & REGULIERUNG

### 6.1 Arbeitszeitgesetz (ArbZG)
Die Plattform ermöglicht die Dokumentation von Arbeitszeiten gemäß:
- **§ 16 ArbZG:** Aufzeichnungspflicht (tägliche Arbeits- und Pausenzeiten)
- **§ 88 ArbZG:** Technische Überwachung (Betriebsratszustimmung erforderlich)

### 6.2 Steuer & Buchhaltung
- **Nicht enthalten:** Deutsche Steuererklärung oder Sozialversicherungsberechnung
- **Integration:** Export zu Standard-Buchhaltungssystemen (Datev, Lexware)
- **Aufbewahrung:** Daten für 10 Jahre verfügbar (für GoBD-Compliance)

### 6.3 Branchenzertifizierungen
- **ISO 27001:** Geplant bis Q2 2027
- **TISAX:** Unter Prüfung (für Automobilindustrie)
- **Audit-Berichte:** Auf Anfrage verfügbar

---

## 7. SUPPORT & SERVICE LEVELS

### 7.1 Support-Ebenen
- **Starter & Professional:** Email-Support, 24h Response-Zeit
- **Enterprise:** Priority Support, 2h Response-Zeit, Telefon-Hotline

### 7.2 Verfügbarkeitsverpflichtung
- **Uptime-SLA:** 99,5% verfügbar pro Monat
- **Ausnahmen:** Geplante Wartung (max. 2h/Monat, angekündigt), Force Majeure
- **Ausfall-Kompensation:** Nach 4h Ausfall = 10% Monatsgebühr Gutschrift (max. 100% Monatsgebühr)

### 7.3 Wartung & Updates
- **Updates:** Monatlich, keine Breaking Changes ohne 30-Tage-Ankündigung
- **Notfall-Patches:** Ohne Ankündigung (bei Sicherheitslücken)
- **Wartungsfenster:** Sonntag 22:00–06:00 UTC (optional)

---

## 8. VERSCHWIEGENHEIT & SICHERHEIT

### 8.1 Vertrauliche Informationen
Beide Parteien verpflichten sich, Betriebsgeheimnisse, Technologie und Geschäftsdaten vertraulich zu behandeln.

### 8.2 Sicherheitsverpflichtungen Auftraggeber
- Sichere Passwörter für Admin-Accounts
- Zwei-Faktor-Authentifizierung für sensitive Rollen (empfohlen)
- Regelmäßige Benutzer-Reviews und Löschen ungenutzter Accounts

### 8.3 Incident Response
Bei Sicherheitsverletzung werden folgende Maßnahmen ergriffen:
1. **Erkennung & Isolation:** Sofort (in der Regel < 2h)
2. **Benachrichtigung:** Auftraggeber innerhalb 24h
3. **Mitteilung Behörden:** Nach DSGVO Art. 33 (Auftraggeber entscheidet)
4. **Post-Incident Review:** Innerhalb 5 Tagen

---

## 9. HAFTUNG & VERSICHERUNG

### 9.1 Haftungsbegrenzung
**Außnahmen (Unbegrenzte Haftung):**
- Personenschäden (Verletzungen, Tod)
- Grobes Verschulden oder Vorsatz
- Datenschutzverletzungen durch Anbieter-Fahrlässigkeit
- Verletzung von Eigentums- oder Urheberrechten

**Begrenzte Haftung (Max. das 12-Fache des Monatsgebührs):**
- Datenverlust durch technische Fehler (nicht durch Auftraggeber-Fahrlässigkeit)
- Temporärer Service-Ausfall
- Performance-Probleme

**Keine Haftung für:**
- Indirekte Schäden (Gewinnverlust, entgangene Geschäfte)
- Schäden durch Auftraggeber-Konfigurationsfehler
- Drittanbieter-Software (Stripe, Supabase, etc.)

### 9.2 Versicherung
Anbieter ist versichert gegen:
- Cyber-Liability (€5 Mio. Deckung)
- Professional Indemnity (€2 Mio. Deckung)
- General Liability (€1 Mio. Deckung)

---

## 10. KÜNDIGUNG & BEENDIGUNG

### 10.1 Kündigung durch Auftraggeber
- **Kündigungsfrist:** Zum Ende eines Abrechnungszeitraums (monatlich oder jährlich)
- **Kündigungsart:** Schriftlich via Email oder Kundenportal
- **Datenzugriff:** Bis zum Ende des Abrechnungszeitraums erhalten bleiben

### 10.2 Kündigung durch Anbieter
Anbieter kann mit **60 Tagen Frist** kündigen, wenn:
- Auftraggeber 30 Tage überfällig zahlt
- Auftraggeber gegen AGB verstößt und nicht korrigiert
- Auftraggeber illegale oder schädliche Inhalte speichert
- Anbieter die Plattform einstellt (mit Alternative für Daten)

### 10.3 Konsequenzen der Beendigung
- **Datenexport:** Auftraggeber kann noch 30 Tage Daten exportieren
- **Datenlöschung:** Nach 30 Tagen werden alle Daten gelöscht (DSGVO Art. 17)
- **Abrechnung:** Restzahlung ist fällig

---

## 11. GEWÄHRLEISTUNG & HAFTUNGSAUSSCHLUSS

### 11.1 Gewährleistung
Der Anbieter gewährleistet:
- Plattform wird den beschriebenen Funktionen entsprechend bereitgestellt
- Service ist kompatibel mit modernen Browsern (Chrome, Firefox, Safari, Edge) und iOS/Android
- Sicherheit wird auf dem Stand der Technik implementiert

### 11.2 Ausschluss von Gewährleistung
**Soweit gesetzlich zulässig, wird keine Gewährleistung übernommen für:**
- Fehlerfreien oder unterbrechungsfreien Betrieb
- Kompatibilität mit veralteten Systemen oder Browsern
- Datenverlust durch Auftraggeber-Fahrlässigkeit

---

## 12. BESONDERE BESTIMMUNGEN

### 12.1 Geofencing & Standortdaten (Art. 88 DSGVO)
- **Opt-in:** Muss vom Unternehmen explizit aktiviert werden
- **Betriebsrat:** Zustimmung erforderlich (§ 87 BetrVG)
- **Mitarbeiter-Opt-out:** Kann deaktiviert werden in Einstellungen
- **Datenlöschung:** Nach 90 Tagen automatisch (konfigurierbar)

### 12.2 Internationale Datentransfers
Auftraggeber stimmt zu, dass Daten in Supabase-Datacentern in EU (z. B. Frankfurt) verarbeitet werden.

### 12.3 Subskription & automatische Verlängerung
- **Automatische Verlängerung:** Wird automatisch am Rechnungsdatum verlängert, sofern nicht gekündigt
- **Kündigungsbestätigung:** Auftraggeber erhält sofort Bestätigung per Email

---

## 13. ALLGEMEINE BESTIMMUNGEN

### 13.1 Änderungen dieser AGB
- **Ankündigung:** Mindestens 30 Tage vor Änderung
- **Material Changes:** Auftraggeber kann kündigen, wenn Änderungen unzumutbar
- **Kleine Klarstellungen:** Können ohne Ankündigung erfolgen

### 13.2 Salvatorische Klausel
Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt der Rest gültig.

### 13.3 Gesamte Vereinbarung
Diese AGB + Datenschutzerklärung + AV-Vertrag + Angebot bilden die gesamte Vereinbarung.

### 13.4 Sprachen
Diese AGB existiert in Deutsch und Englisch. Im Falle von Widersprüchen gilt die Deutsche Version.

---

## 14. GERICHTSSTAND & GESETZE

- **Anwendbares Recht:** Bundesrepublik Deutschland (deutsches Recht)
- **Gerichtsstand:** [Sitz der Novaro HR GmbH — z. B. Bremen oder Berlin]
- **Schiedsverfahren (optional):** Parteien können sich auf internationales Schiedsverfahren einigen

---

## ANLAGEN

- **ANLAGE A:** Datenschutzerklärung (PHASE-33-LEGAL-COMPLIANCE.md)
- **ANLAGE B:** Auftragsverarbeitungs-Vereinbarung (AV-Vertrag)
- **ANLAGE C:** Service Level Agreement (SLA)
- **ANLAGE D:** Preisliste & Plan-Details
- **ANLAGE E:** Sicherheitsaudit-Report (nach Anfrage)

---

**Version:** 1.0 (Draft)  
**Status:** Bereit für anwaltliche Durchsicht  
**Nächste Review:** Nach Legal Team Feedback  
**Letzte Änderung:** 25. Oktober 2026

---

## HINWEISE FÜR LEGAL TEAM

- [ ] Gerichtsstand und Jurisdiction anpassen (in Abschnitt 14)
- [ ] Firmenname und Registered Address einfügen
- [ ] Subunternehmer-Links einfügen (Supabase, Stripe, Sentry AVV)
- [ ] Enterprise-Variationen hinzufügen (falls abweichend)
- [ ] Internationale SaaS-Standards abgleichen (z. B. US-GDPR für US-Kunden)
- [ ] Mit Compliance Team den Haftungsabschnitt (9.1) finalisieren
- [ ] Lokalisierung für zusätzliche Länder (z. B. AT, CH) vorbereiten
