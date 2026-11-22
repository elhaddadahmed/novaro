# BETRIEBSRAT-MITTEILUNG
## ArbZG § 88 Abs. 1 – Unterrichtung über Videotechnik & Geolokalisierung

**Versand-Datum:** 25. Oktober 2026  
**Einspruchsfrist:** 14 Tage nach Zugang  
**Adressat:** Betriebsrat [Firmennamen]  
**Von:** Geschäftsführung / HR-Abteilung [Firmennamen]

---

## 1. FORMALE UNTERRICHTUNG

Hiermit wird der Betriebsrat gemäß § 88 Abs. 1 Arbeitszeitgesetz (ArbZG) über die Implementierung technischer Einrichtungen zur Überwachung und Kontrolle der Arbeitnehmer unterrichtet.

### 1.1 Betroffene Technologien

Die Novaro HR Platform wird zwei technische Module mit Überwachungspotential bereitstellen:

#### A) **Geofencing** (Standort-basierte Zeiterfassung)
- **Funktion:** GPS-gestützte Zeiterfassung bei Ein-/Ausstieg bestimmter Arbeitsorte
- **Opt-in/Opt-out:** Unternehmen können die Funktion aktivieren oder deaktivieren
- **Datenerfassung:** Nur bei aktiver Schicht; Standort wird min. gespeichert
- **Löschung:** Nach 90 Tagen (konfigurierbar)
- **Rechtsbasis:** Art. 88 DSGVO (Arbeitnehmerdaten)

#### B) **NFC-Tags** (Näherungsbasierte Zeiterfassung)
- **Funktion:** Kontaktlose Kartenkommunikation für Zeitstempel an NFC-Lesegeräten
- **Datenerfassung:** Tag-ID + Timestamp, kein Tracking zwischen Lesern
- **Löschung:** Nach Ablauf eines Kalenderjahres
- **Rechtsbasis:** Art. 88 DSGVO

#### C) **QR-Codes** (Statische Zeiterfassung)
- **Funktion:** Manuelle QR-Code-Erfassung an definierten Orten (kein Tracking)
- **Datenerfassung:** Nur Timestamp + Benutzer-ID bei Scan
- **Keine Überwachung:** Dieser Modus erfordert aktive Handlung des Arbeitnehmers
- **Status:** Nicht unter ArbZG § 88 (keine automatische Lokalisierung)

---

## 2. TECHNISCHE DETAILS

### Geofencing
```
- Radius: Konfigurierbar (Standard: 50–200 m)
- Genauigkeit: ±5–10 m (GPS-Toleranz)
- Aktivierung: Nur während Schicht
- Datenverarbeitung: Lokal auf Gerät, dann zu Supabase (EU-Server)
- Verschlüsselung: TLS + DB-Verschlüsselung
```

### NFC
```
- Standard: ISO/IEC 15693 oder 14443
- Lesebereich: 1–10 cm (physisch begrenzt)
- Tag-Speicher: 64–4096 Bytes (nur Metadaten)
- Keine Einzeltracking zwischen Lesern
```

### Datenspeicherung
- **Server:** Supabase (PostgreSQL), EU (Frankfurt oder ähnlich)
- **Backups:** Täglich, verschlüsselt
- **Zugriff:** RLS (Row-Level Security), nur berechtigte Administratoren
- **Logs:** Alle Zugriffe auditiert

---

## 3. ZWECK & NUTZEN

### Für das Unternehmen
- Automatisierte, fälschungssichere Zeiterfassung
- Reduzierung manueller Fehlereinträge
- Schichtübersicht in Echtzeit
- Compliance mit Arbeitszeitgesetz (ArbZG § 16 Dokumentationspflicht)

### Für den Arbeitnehmer
- Keine manuellen Zeiteinträge mehr nötig
- Mobile App für On-Demand Zeiterfassung (ohne GPS)
- Transparente Übersicht der eigenen Stunden
- Historische Daten jederzeit verfügbar

---

## 4. DATENSCHUTZ & GDPR

### Rechtsgrundlage
- **Art. 88 DSGVO:** Verarbeitung von Arbeitnehmerdaten zur Kontrolle und Überwachung ist zulässig, wenn:
  - Betriebsrat hat Gelegenheit zur Stellungnahme (§ 87 Abs. 1 BetrVG)
  - Verhältnismäßigkeit beachtet (Art. 5 Abs. 1 (c) DSGVO)
  - Datenschutz-Folgenabschätzung (DPIA) durchgeführt

### Datenschutz-Folgenabschätzung (DPIA)
- ✅ Durchgeführt gemäß Art. 35 DSGVO
- ✅ Risikobewertung: **MITTEL** (bei Aktivierung)
- ✅ Mitigationen: Opt-in, Löschfristen, Transparenz, RLS
- 📄 **Siehe:** `/docs/PHASE-33-LEGAL-COMPLIANCE.md` (DPIA-Details)

### Datenminimierung
- Nur notwendige Daten: Benutzer-ID, Timestamp, Standort (wenn aktiv), Schicht-ID
- Kein Tracking ohne aktive Schicht
- Automatische Löschung nach definierten Fristen
- Employee kann Geofencing deaktivieren

### Transparenz
- **Datenschutzerklärung:** Aktualisiert, klar und verständlich
- **Betriebsvereinbarung:** Kann ab Betriebsrat-Zustimmung abgeschlossen werden
- **Arbeitnehmer-Info:** Schriftlich vor Aktivierung
- **Audit Logs:** Alle technischen Zugriffe nachvollziehbar

---

## 5. STELLUNGNAHMERECHT DES BETRIEBSRATS

**Gemäß § 87 Abs. 1 BetrVG** hat der Betriebsrat das Recht, zu folgenden Punkten Stellung zu nehmen:

1. **Notwendigkeit und Verhältnismäßigkeit** des Einsatzes
2. **Art und Ausmaß** der Datenerfassung
3. **Speicherdauer** und Löschfristen
4. **Zugriff und Nutzung** der Daten
5. **Transparenz gegenüber Arbeitnehmern**
6. **Einwände gegen Geofencing** (z. B. zu invasiv)
7. **Alternativlösungen** (z. B. nur QR oder NFC, kein GPS)
8. **Implementierungszeitplan**

**Einspruchsfrist:** 14 Tage nach Zugang dieser Mitteilung  
**Adresse für Einspruch:** [Geschäftsleitung E-Mail / Büro]

---

## 6. IMPLEMENTIERUNGSPLAN

### Zeitlinie
- **Baseline:** Diese Mitteilung (25. Okt 2026)
- **BR-Frist:** 8. November 2026 (14 Tage)
- **Gespräch (falls gewünscht):** 5. – 7. November 2026
- **Betriebsvereinbarung (optional):** 9. – 15. November 2026
- **Technische Aktivierung:** 16. November 2026 oder später (nach Genehmigung)
- **Mitarbeiter-Information:** 1 Woche vor Aktivierung
- **Go-Live:** 28. November 2026

### Rollout-Phasen
1. **Phase 1 (optional):** QR-Codes nur (kein Tracking, unkritisch)
2. **Phase 2 (nach BR-OK):** NFC-Tags in Pilotlokation
3. **Phase 3 (nach Pilotbewertung):** Geofencing in definierten Zonen
4. **Phase 4:** Ausrollung auf alle Standorte (mit Opt-out für Mitarbeiter)

---

## 7. HÄUFIGE FRAGEN & ANTWORTEN

### F: Sind Mitarbeiter verpflichtet, Geofencing zu nutzen?
**A:** Nein. Geofencing ist **optional** auf Unternehmensebene und kann pro Mitarbeiter deaktiviert werden. Stattdessen können QR oder NFC verwendet werden. Mobile App ermöglicht auch manuelle Zeiterfassung ohne GPS.

### F: Wird der Standort ständig überwacht?
**A:** Nein. GPS wird **nur während aktiver Schicht** erfasst und **nur beim Ein-/Ausstieg**. Die App sendet keine kontinuierlichen Standort-Updates. Nach Schichtende wird das Recht auf räumliche Privatsphäre wiederhergestellt.

### F: Wie lange werden die Daten gespeichert?
**A:** Standortdaten werden nach 90 Tagen automatisch gelöscht (konfigurierbar). Zeitstempel bleiben für Payroll-Gründe 7 Jahre (deutsches Handelsgesetzbuch).

### F: Wer kann die Daten einsehen?
**A:** Nur berechtigte Administratoren (HR, Manager mit RLS-Berechtigung). Mitarbeiter können ihre eigenen Daten einsehen. Betriebsrat hat Kontrollzugriff (Art. 87 BetrVG).

### F: Was ist, wenn Geofencing nicht funktioniert (schlechtes Signal)?
**A:** Fallback: QR-Code oder manuelle Eingabe. Technische Fehler werden nicht zu Unzulässigkeitsvorwürfen führen.

### F: Kann das Unternehmen jederzeit alle Mitarbeiter tracken?
**A:** Nein. RLS-Policies im Backend verhindern, dass auch Administratoren über ihre autorisierten Bereiche hinaus Daten sehen. Supabase RLS ist eine technische Grenze.

---

## 8. KONTAKTINFORMATIONEN

Für Rückfragen oder Einwände:

| Rolle | Name / Kontakt |
|---|---|
| **Datenschutzbeauftragte/r** | [DSB-Name] / [DSB-Email] |
| **HR-Leitung** | [HR-Name] / [HR-Email] |
| **Geschäftsführung** | [GF-Name] / [GF-Email] |
| **Externe Rechtskanzlei** | [Kanzlei] / [Telefon] |

**Betriebsrat-Ansprechpartner für diese Unterrichtung:**  
[BR-Vorsitzender Name] — [BR-Email] / [BR-Telefon]

---

## 9. ANLAGEN

- **ANLAGE A:** Technische Übersicht (Geofencing/NFC/QR)
- **ANLAGE B:** Datenschutzerklärung (aktualisierte Version)
- **ANLAGE C:** DPIA-Zusammenfassung (Art. 35 DSGVO)
- **ANLAGE D:** Betriebsvereinbarungsvorlage (optional)
- **ANLAGE E:** Arbeitnehmer-Informationsschreiben (wird vor Aktivierung verteilt)

---

## 10. BESTÄTIGUNG DES ZUGANGS

**Der Betriebsrat wird gebeten, den Empfang dieser Mitteilung schriftlich zu bestätigen.**

Zugestellt am: _______________  
Unterschrift Betriebsrat: _______________  
Name (Druck): _______________  

---

**Gültig bis:** 1. Januar 2027  
**Nächste Überprüfung:** Januari 2027 (nach Go-Live)  
**Dokument-Version:** 1.0  
**Letzte Aktualisierung:** 25. Oktober 2026

---

## 11. ANHANG: TECHNISCHE ÜBERSICHT (ANLAGE A)

### Geofencing-Flow
```
1. Mitarbeiter startet Schicht (App)
2. Geofencing aktiviert sich (wenn konfiguriert)
3. Beim Betreten der Zone → GPS-Check
4. Wenn in Zone → Zeitstempel + Standort
5. Nach 90 Tagen: Standort-Daten gelöscht
6. Zeitstempel bleibt (Payroll)
```

### NFC-Flow
```
1. NFC-Lesegerät an Eingang / Schichtbüro
2. Mitarbeiter hält Karte/Telefon vor Leser
3. System liest Tag-ID (keine Mitarbeiter-ID vor Ort sichtbar)
4. Server validiert: Ist Tag aktiv? Welche Mitarbeiter? Welche Schicht?
5. Zeitstempel + Tag-ID → Datenbank
6. Quittung auf Display oder in App
```

### Sicherheitsmaßnahmen
- **Verschlüsselung in Transit:** TLS 1.3
- **Verschlüsselung at Rest:** PostgreSQL-Spalten verschlüsselt
- **Authentifizierung:** Nur App mit gültigem Session-Token
- **Rate Limiting:** Max 10 Scans pro Minute pro Benutzer
- **Audit Logging:** Alle Scans und Zugriffe geloggt
- **RLS:** Daten nur für berechtigte Nutzer sichtbar

---

**ENDE DER MITTEILUNG**

---

**Hinweis für Versand:**
- PDF drucken und signieren
- Begleitschreiben mit Anschreiben hinzufügen
- Einschreiben mit Rückschein versenden (Beweis des Zugangs)
- Kopie in Personalakte abheften
- Scan in Compliance-System speichern
