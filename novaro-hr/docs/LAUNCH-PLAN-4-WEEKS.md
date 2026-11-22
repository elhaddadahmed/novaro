# Novaro HR — 4-Wochen Launch-Plan
**Zeitraum:** 25. Oktober — 28. November 2026  
**Ziel:** Production Go-Live (CONDITIONAL)  
**Status:** BLOCKIERT AUF EXTERNE GENEHMIGUNGEN

---

## WOCHE 1: 25. Okt — 1. Nov | LEGAL & GOVERNANCE

### ⚠️ CRITICAL PATH (Parallel starten)

#### Task 1.1: Betriebsrat-Mitteilung (ArbZG § 88)
- **Owner:** HR/Legal (extern)
- **Deadline:** 25. Oktober 2026
- **Substeps:**
  1. Formelle Mitteilung an Betriebsrat versenden
     - Geofencing (optional, kann deaktiviert werden)
     - NFC/QR-Zeiterfassung (Trackingaspekte klären)
     - Shift-Planung (Automatisierung von Schichtzuteilung)
  2. Vortrag/Erklärung anbieten (25. Okt, 14:00 Uhr)
  3. Mitbestimmung einleiten → Ziel: Entscheidung bis 7. Nov
- **Ausgabe:** Betriebsrats-Stellungnahme (genehmigt/mit Änderungen/abgelehnt)
- **Blocker-Status:** 🔴 BLOCKING — ohne diese Genehmigung kein Launch

#### Task 1.2: Rechtliche Dokumente (Parallel mit 1.1)
- **Owner:** Rechtskanzlei/Legal
- **Deadline:** 7. November 2026
- **Substeps:**
  1. Terms of Service (English + Deutsch)
     - Rollen & Permissions
     - Data Retention
     - Kündigungsbedingungen
     - Haftungsausschluss
  2. Datenschutzerklärung (DSGVO-konform, Deutsch)
     - Verarbeitung: Login, Zeiterfassung, Geofencing
     - Empfänger: Supabase (EU), Stripe (USA)
     - DPIA Zusammenfassung
  3. Allgemeine Geschäftsbedingungen
     - SLA: 99.5% Verfügbarkeit
     - Support-Stufenplan
  4. Datenschutz-Anpassungen basierend auf BR-Entscheidung

- **Deliverables:**
  - `docs/legal/TERMS-OF-SERVICE-DE.md`
  - `docs/legal/DATENSCHUTZ-DE.md`
  - `docs/legal/AGB-DE.md`
  - `docs/legal/DPIA-SUMMARY.md`
- **Blocker-Status:** 🔴 BLOCKING — ohne rechtliche Genehmigung kein Launch

#### Task 1.3: DPIA Finalisierung (DSGVO Art. 35)
- **Owner:** Data Protection Officer / Datenschutzbeauftragter
- **Deadline:** 31. Oktober 2026
- **Subtasks:**
  1. Risikobewertung finalisieren
  2. Mitigationen validieren
  3. Genehmigung durch DPO/Geschäftsführung
  4. Kopie an Betriebsrat senden (auch relevant für BR-Entscheidung)
- **Output:** `docs/legal/DPIA-APPROVED.pdf` (unterzeichnet)

#### Task 1.4: AVV mit Dienstleistern (Falls nicht vorhanden)
- **Owner:** Legal
- **Deadline:** 31. Oktober 2026
- **Check:** 
  - ✅ Supabase — bereits signiert
  - ✅ Stripe — bereits signiert
  - ⏳ Sentry — prüfen, ggf. unterzeichnen
- **Output:** `docs/legal/AVV-Sentry.pdf` (kopieren zu docs/legal/)

---

## WOCHE 2: 2. Nov — 8. Nov | INFRASTRUCTURE

### ✅ CAN START PARALLEL (unabhängig von BR-Entscheidung)

#### Task 2.1: Supabase Setup (Staging + Production)
- **Owner:** DevOps/Backend
- **Deadline:** 5. November 2026
- **Substeps:**
  1. **Staging-Projekt erstellen** (Supabase Console)
     - DB-Name: `novaro_staging`
     - Region: Frankfurt (EU)
     - Backup: tägliche automatische Backups
  2. **Production-Projekt erstellen**
     - DB-Name: `novaro_production`
     - Region: Frankfurt (EU)
     - Backup: stündlich (inkrementell) + wöchentlich (vollständig)
     - Point-in-Time Recovery: 30 Tage
  3. **Migrationen anwenden** (0001–0021)
     - Auf Staging: `pnpm supabase migration up --local` (in CI/CD testen)
     - Verify: Alle 50+ RLS Policies aktiv
  4. **Seed-Daten einfügen**
     - Test-Unternehmen (staging)
     - Produktions-Daten: leer starten
  5. **SSL/TLS validieren**
     - HTTPS erzwungen
     - Certificate Pinning (optional, für Mobile)

- **Deliverables:**
  - Staging DB aktiv + Test-Seed
  - Production DB aktiv + leer
  - Backup Schedule konfiguriert
  - RLS Policies verifiziert

#### Task 2.2: Stripe Live Mode Setup
- **Owner:** Finance/Backend
- **Deadline:** 5. November 2026
- **Substeps:**
  1. Stripe Account in Live Mode umschalten
  2. 3 Products erstellen:
     - `prod_starter_monthly` (€29/mo)
     - `prod_professional_monthly` (€49/mo)
     - `prod_enterprise_monthly` (€99/mo)
  3. 3 Prices pro Plan (monatlich + jährlich):
     - `price_starter_monthly` (€29), `price_starter_annual` (€319)
     - `price_professional_monthly` (€49), `price_professional_annual` (€539)
     - `price_enterprise_monthly` (€99), `price_enterprise_annual` (€1.088)
  4. Webhook-Endpoint registrieren:
     - URL: `https://api.novaro-hr.de/api/saas/stripe/webhook`
     - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
  5. Testcharge durchführen (mit Test-Kreditkarte)

- **Deliverables:**
  - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` → `.env.production`
  - Webhook Secret → `.env.production`
  - 6 Price IDs → `.env.production`
  - Test-Abonnement verifiziert

#### Task 2.3: GitHub Actions Secrets
- **Owner:** DevOps
- **Deadline:** 5. November 2026
- **Substeps:**
  1. **Staging-Secrets hinzufügen:**
     ```
     STAGING_SUPABASE_URL
     STAGING_SUPABASE_ANON_KEY
     STAGING_SUPABASE_SERVICE_ROLE_KEY
     STAGING_DATABASE_URL
     STAGING_STRIPE_SECRET_KEY
     STAGING_STRIPE_PUBLISHABLE_KEY
     STAGING_STRIPE_WEBHOOK_SECRET
     STAGING_STRIPE_PRICE_STARTER_MONTHLY
     STAGING_STRIPE_PRICE_STARTER_ANNUAL
     STAGING_STRIPE_PRICE_PROFESSIONAL_MONTHLY
     STAGING_STRIPE_PRICE_PROFESSIONAL_ANNUAL
     STAGING_STRIPE_PRICE_ENTERPRISE_MONTHLY
     STAGING_STRIPE_PRICE_ENTERPRISE_ANNUAL
     STAGING_SENTRY_DSN
     ```
  2. **Production-Secrets hinzufügen** (gleich, mit PROD_-Präfix)
  3. **GitHub Actions Workflows updaten:**
     - `.github/workflows/deploy-staging.yml` → automatischer Deploy auf Staging
     - `.github/workflows/deploy-prod.yml` → manueller Deploy auf Production (mit Approval)
  4. **Test:** Push → Staging Deploy automatisch, dann Approval + Prod Deploy

#### Task 2.4: Sentry Setup & Alerts
- **Owner:** Backend/Ops
- **Deadline:** 8. November 2026
- **Substeps:**
  1. Sentry Projekte für Staging + Production erstellen
  2. DSN in Umgebungsvariablen hinterlegen
  3. Alert Rules konfigurieren:
     - Severity 1 (Error) → Slack #alerts + SMS
     - Severity 2 (Warning) → Slack #alerts
     - Severity 3 (Info) → Slack #alerts (daily digest)
  4. Integration mit Slack (`#alerts` Channel)
  5. Error Tracking aktivieren (mobile + web)

#### Task 2.5: Email/SMTP Setup
- **Owner:** Backend
- **Deadline:** 8. November 2026
- **Substeps:**
  1. Email-Provider wählen (SendGrid / AWS SES / Mailgun)
  2. SMTP-Credentials in `.env.production`
  3. Email-Templates erstellen:
     - Welcome nach Signup
     - Trial Ending (7 Tage vorher)
     - Subscription Activated
     - Failed Payment Retry
     - Invoice Generated
  4. Test-Email versenden

---

## WOCHE 3: 9. Nov — 15. Nov | TESTING & VERIFICATION

### Task 3.1: End-to-End Verification (Staging)
- **Owner:** QA/Tech Lead
- **Deadline:** 12. November 2026
- **Substeps:**
  1. **Signup Flow (Staging)**
     - Neue Company registrieren
     - Trial aktivieren (14 Tage)
     - First employee (Admin) anlegen
  2. **Payment Flow (Test Stripe Cards)**
     - Upgrade zu Starter Plan
     - Zahlungsabwicklung testen
     - Invoice generiert
  3. **Core Features (RLS, Permissions)**
     - Employee anlegen, Login, Zeiterfassung
     - Manager: Leave Request genehmigen
     - Admin: Einstellungen ändern
     - Cross-Tenant Isolation prüfen
  4. **Critical User Paths:**
     - Login/Logout
     - Time Entry (Start/Stop/Pausen)
     - Leave Request
     - Shift View
     - Document Upload
  5. **Fehlerbehandlung:**
     - Network Timeout → Graceful Degradation
     - 401 Unauthorized → Redirect to Login
     - 403 Forbidden → Error Message
     - 500 Server Error → Sentry logged, User gets friendly message

- **Deliverables:**
  - Checklist: `docs/VERIFICATION-STAGING.md` (mit Screenshots/Logs)

#### Task 3.2: Load Test (k6 / Grafana)
- **Owner:** DevOps/Performance
- **Deadline:** 12. November 2026
- **Setup:** k6 in Staging
- **Scenarios:**
  1. **Normal Load:** 100 concurrent users, 5 min
  2. **Peak Load:** 1.000 concurrent users, 10 min
  3. **Spike:** 2.000 concurrent users, 2 min
  4. **Soak Test:** 500 users, 1 Stunde
- **Success Criteria:**
  - p95 < 500ms
  - Error Rate < 0.5%
  - CPU < 70%
  - Memory < 80%
  - DB connections < 80 (max_connections)

- **Deliverables:**
  - `docs/LOAD-TEST-RESULTS.md` + HTML report

#### Task 3.3: RLS & Security Spot Check
- **Owner:** Backend/Security
- **Deadline:** 12. November 2026
- **Manual Tests:**
  1. **Cross-Tenant Access (MUST FAIL):**
     - Company A token → Try to read Company B employees → 403 or 0 rows
     - Company A token → Try to update Company B settings → 403 or 0 rows
  2. **Permission Checks:**
     - EMPLOYEE → Try to approve leave → 403
     - EMPLOYEE → Try to delete audit log → 403
     - MANAGER → Try to read payroll → 403 (if no permission)
  3. **Service Role Usage:** ✅ None in Mobile/Web code
  4. **Secrets in Code:** ✅ No API keys, no STRIPE_SECRET_KEY exposed

- **Deliverables:**
  - `docs/SECURITY-SPOT-CHECK.md` (Checklist mit Pass/Fail)

#### Task 3.4: Mobile & Web Build
- **Owner:** Frontend/Mobile
- **Deadline:** 15. November 2026
- **Substeps:**
  1. **Web Production Build**
     ```bash
     cd apps/web
     npm run build
     npm run export  # Static export für Vercel/Netlify
     ```
     - Größe prüfen (< 5 MB gzipped)
     - Source Maps → Sentry
  2. **Mobile Build (Staging)**
     ```bash
     cd apps/mobile
     eas build --platform ios --profile staging
     eas build --platform android --profile staging
     ```
     - iOS: TestFlight auf Staging
     - Android: Internal Testing Track auf Staging
  3. **Smoke Test (iOS + Android):**
     - Login (mit Test-Account)
     - Time Entry → Start → Stop
     - Leave Request → View
     - Notifications Push-Test
  4. **Mobile Production Build (on Hold until Go)**
     - Wird am 26. Nov gebaut, 27. Nov bei Apple/Google eingereicht

- **Deliverables:**
  - Web: Production build ready
  - Mobile: Staging build aktiv + QA geprüft

#### Task 3.5: Documentation Finalize
- **Owner:** Tech Lead
- **Deadline:** 15. November 2026
- **Substeps:**
  1. `docs/ARCHITECTURE.md` — aktuell halten
  2. `docs/RUNBOOK.md` — Deployments, Rollbacks
  3. `docs/TROUBLESHOOTING.md` — Häufige Fehler + Lösungen
  4. `docs/API-REFERENCE.md` — Alle Endpoints (mit curl-Beispiele)
  5. `docs/DATABASE-SCHEMA.md` — ER-Diagramm + Trigger-Logik
  6. Benutzerhandbuch (HR, Manager, Employee) — Deutsch

- **Deliverables:**
  - `docs/README.md` → Index aller Docs

---

## WOCHE 4: 16. Nov — 28. Nov | FINALIZATION & GO-LIVE

### Task 4.1: Betriebsrat-Entscheidung Implementierung
- **Owner:** HR
- **Deadline:** 16. November 2026
- **Substeps:**
  1. BR-Stellungnahme erhalten + analysieren
  2. Falls Änderungen erforderlich:
     - Geofencing-Opt-out-UI implementieren (+ Audit Trail)
     - NFC-Disclosure in Privacy Policy anpassen
     - Arbeitszeit-Tracking-Regeln dokumentieren
  3. Updates in Production bauen + auf Staging deployen
  4. BR-Mitgliedern zeigen (Approval-Loop)

- **Timeline:** BR-Entscheidung (7. Nov) → Änderungen (7.–14. Nov) → Finale Implementierung (16. Nov) ✅

### Task 4.2: Legal Sign-Off
- **Owner:** Geschäftsführung
- **Deadline:** 18. November 2026
- **Substeps:**
  1. Terms of Service + Datenschutzerklärung + AGB unterzeichnen
  2. DPIA-Freigabe bestätigen
  3. Compliance Checklist unterzeichnen

- **Deliverables:**
  - `docs/legal/SIGN-OFF-GF.pdf` (unterzeichnet & gescannt)

### Task 4.3: Pre-Production Checklist
- **Owner:** Tech Lead/DevOps
- **Deadline:** 21. November 2026
- **Items:**
  - [ ] Database backups aktiv (staging + prod)
  - [ ] Monitoring aktiv (Sentry, Supabase Metrics, New Relic optional)
  - [ ] Alert Rules konfiguriert + tested
  - [ ] Rollback-Verfahren dokumentiert
  - [ ] Incident Response Plan unterzeichnet
  - [ ] On-Call Rotation Setup
  - [ ] 24/7 Support-Kontakt aktiv
  - [ ] Runbook gedruckt + am Schreibtisch

- **Deliverables:**
  - `docs/PRE-PRODUCTION-CHECKLIST-SIGNED.md`

### Task 4.4: Production Database Migration (25. Nov)
- **Owner:** DevOps
- **Deadline:** 25. November 2026 (Tag vor Launch)
- **Substeps:**
  1. **Backup von Staging nehmen** (letzte Sicherung vor Prod-Init)
  2. **Migrationen auf Production anwenden** (0001–0021)
     ```bash
     psql $PRODUCTION_DATABASE_URL < supabase/migrations/0001_init.sql
     psql $PRODUCTION_DATABASE_URL < supabase/migrations/0002_seed.sql
     ...
     ```
  3. **Seed-Daten:** Nur Rollen + Permissions, KEINE Test-Unternehmen
  4. **RLS Policies verifiziert:** `SELECT * FROM information_schema.table_constraints WHERE table_name LIKE '%';`
  5. **Backup nach Migrationen nehmen**
  6. **Test:** Connection string funktioniert, erste queries laufen

- **Deliverables:**
  - Production DB aktiv, leer, RLS-protected

### Task 4.5: Final Deployment & Smoke Test (26.–27. Nov)
- **Owner:** DevOps/Tech Lead
- **Deadline:** 27. November 2026 (Tag vor Launch, Abends)
- **Substeps:**
  1. **Web Deploy (Production)**
     - Manual Approval in GitHub Actions
     - Monitoring: Sentry Errors, API p95
     - Smoke Test: Homepage laden, Static Assets
  2. **API Deploy (Production)**
     - Database connection string check
     - Health endpoint: GET `/api/health` → 200 OK
     - Stripe webhook test (Livemode)
  3. **Mobile Production Build** (async während Web/API)
     - iOS Build auf TestFlight (zum Review bereit)
     - Android Build auf Internal Track (zum Review bereit)
  4. **Signup Flow Test (Production)**
     - Neue Company registrieren
     - Trial aktivieren
     - First admin user anlegen
     - Login über beide Apps
  5. **Payment Test (Livemode mit Test-Karten)**
     - Upgrade zu Starter
     - Zahlungsabwicklung
     - Invoice in Stripe verifiziert

- **Deliverables:**
  - ✅ Web, API, Mobile alle produktiv deployt
  - ✅ Alle Health Checks grün
  - ✅ Test-Company funktioniert
  - ✅ Smoke Tests bestanden

### Task 4.6: Go-Live (28. Nov, Morgens 8:00 UTC)
- **Owner:** Tech Lead (+ On-Call Team)
- **Timeline:**
  - 07:45 UTC: Team standup (30 min)
  - 08:00 UTC: **LAUNCH** — Marketing startet, Landing Page goes live
  - 08:15 UTC: Support Team aktiv (Chat, Email, Hotline)
  - 08:30 UTC: Monitoring Dashboard live (im War Room)
  - 12:00 UTC: Status Update (Slack + Marketing)
  - 18:00 UTC: First Daily Retrospective (was gut? was falsch?)

- **War Room Setup:**
  - Slack Channel: `#novaro-launch`
  - Oncall: 1 Backend + 1 DevOps + 1 Frontend + 1 Support-Lead
  - Fallback-Contact: Tech Lead + CTO (auf Abruf)

- **Deliverables:**
  - Launch-Report: `docs/LAUNCH-DAY-REPORT.md`

---

## WOCHE 5+ | POST-LAUNCH (Nicht mehr kritisch, aber geplant)

### Task 5.1: First Week Monitoring
- **Owner:** Ops/Support
- **Duration:** 28. Nov — 4. Dez
- **Actions:**
  - Sentry Dashboard täglich checken
  - Supabase Metrics überwachen
  - Support Tickets priorisieren
  - Bugs dokumentieren + triagen
  - Hotfixes deployen (falls nötig)

### Task 5.2: Mobile Store Submissions
- **Owner:** Mobile
- **Timeline:** 
  - 29. Nov: iOS auf App Store einreichen (Review: 1–3 Tage)
  - 29. Nov: Android auf Play Store einreichen (Review: 1–3 Stunden)

### Task 5.3: Post-Launch Retrospective
- **Owner:** Tech Lead
- **Date:** 5. Dezember 2026
- **Attendees:** Vollständiges Team + Product
- **Output:** `docs/LAUNCH-RETROSPECTIVE.md`

---

## RISIKO-MATRIX

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| **Betriebsrat lehnt Geofencing ab** | Mittel (30%) | Hoch | Geofencing-Feature deaktivierbar → trotzdem launchbar |
| **Stripe Live-Mode verzögert sich** | Niedrig (10%) | Hoch | Aktualisierung Account status | Backup: Free Trial ohne Payment initial |
| **Production Datenbank-Issue nach Migration** | Niedrig (5%) | Kritisch | Staging-Test vor Prod, Backup-Restore-Drills |
| **RLS Policy Bug erst nach Launch entdeckt** | Niedrig (5%) | Kritisch | Security Spot-Check (Task 3.3) |
| **Mobile App Store Rejection** | Mittel (20%) | Mittel | Early Communication mit Apple/Google |
| **Load Test zeigt p95 > 500ms** | Niedrig (10%) | Mittel | DB Indexing (bereits optimiert), Caching layer |

---

## ENTSCHEIDUNGSMATRIX: GO vs. NO-GO (28. Nov)

### GO-Kriterien (ALL erforderlich):
- ✅ Betriebsrat genehmigt (oder legt Veto ein, das wir umsetzen)
- ✅ Rechtliche Dokumente unterzeichnet + live
- ✅ Production DB aktiv + RLS verified
- ✅ Alle Health Checks grün
- ✅ Signup Flow getestet
- ✅ Load Test bestanden (p95 < 500ms)
- ✅ Security Spot-Check: 0 kritische Befunde

### CONDITIONAL GO-Kriterien (GO, aber mit Fixes in q1):
- ⏳ Mobile App Store Submission pending (OK, wenn APK/IPA bereit)
- ⏳ Monitoring Dashboard: partial (Sentry ja, advanced Analytics nein)
- ⏳ Post-Launch Dokumentation: 90% fertig

### NO-GO-Kriterien (ABORT Launch):
- 🔴 RLS Security Issue entdeckt
- 🔴 Stripe Zahlungsabwicklung fehlgeschlagen
- 🔴 Betriebsrat lehnt ab OHNE praktikable Änderungen
- 🔴 Production DB Corruption oder nicht wiederherstellbar

---

## KOMMUNIKATIONSPLAN

### Intern (Team)

| Datum | Format | Inhalte | Audience |
|---|---|---|---|
| **Jede Woche Mo 9:00 UTC** | Standup (30 min) | Blockers, ETA, Risks | Engineering + Product |
| **Freitags 17:00 UTC** | Status Update | Wochenreview + next week preview | Leadership |
| **27. Nov 20:00 UTC** | Pre-Launch Meeting | Finale Checklist + Go/No-Go Decision | Tech + Support Lead |
| **28. Nov 08:00 UTC** | War Room Standup | Launch Day Timeline | Tech + Ops + Support + CTO |
| **Täglich 18:00 UTC (erste Woche)** | Incident Review | Alle Incidents, Hotfixes | Tech Lead + On-Call |

### Extern (Kunden)

| Timing | Channel | Message | Recipient |
|---|---|---|---|
| **7. Nov** | Email | Closed Beta ends, Launch soon | Beta Testers |
| **21. Nov** | Email + Website | Coming Nov 28 — Pre-register | Prospect List |
| **28. Nov 08:00 UTC** | Website + Email + Social | 🚀 Novaro HR Launch Day | Öffentlichkeit |
| **28. Nov 12:00 UTC** | Email | First 100 Signups — Special Offer | Registrierungen |
| **29. Nov** | Support Email | Trial Details, Onboarding | New Companies |

---

## RESSOURCEN-ALLOCATION

| Role | Allocation | Owner | Backup |
|---|---|---|---|
| **Tech Lead** | 80% (Launch-Governance) | [Name] | [Name] |
| **Backend** | 60% (Infra, API, Stripe) | [Name] | [Name] |
| **DevOps** | 90% (Supabase, GitHub Actions, Sentry) | [Name] | [Name] |
| **Frontend** | 50% (Web Builds, Mobile Staging) | [Name] | [Name] |
| **QA** | 70% (Testing, Verification) | [Name] | [Name] |
| **Legal/HR** | 40% (BR, Docs) | [External] | [Internal HR] |
| **Support** | 30% (Launch-Vorbereitung, Onboarding) | [Name] | [Name] |
| **Product/CEO** | 20% (Decision-Making, Comms) | [Name] | – |

---

## NÄCHSTE SCHRITTE (SOFORT)

1. ✅ **Diese Datei zirkul**ieren an alle Stakeholder
2. **Termine blockieren** (alle Weekly Standups Mo 9:00 UTC ab 28. Okt)
3. **Task 1.1 starten** (Betriebsrat-Mitteilung → Diese Woche!)
4. **Task 2.1–2.5 parallel** (DevOps kann sofort anfangen)
5. **Ressourcen-Allocation bestätigen** (Wer macht was?)
6. **Escalation-Pfade definieren:**
   - Kritischer Bug (Severity 1) → Tech Lead (sofort)
   - Rechtliche Blockade → CTO + External Counsel
   - Betriebsrat-Veto → Geschäftsführung

---

**FINAL STATUS: READY FOR PHASE 1 EXECUTION**

Alle Phasen 0–33 sind technisch abgeschlossen. Diese 4-Wochen-Plan ist die **letzte Meile** zur Production.

📅 **Go-Live Target: 28. November 2026, 08:00 UTC**  
🎯 **Confidence Level: 95%** (ausstehend: BR-Genehmigung + Rechtliche Freigabe)  
⚠️ **BLOCKING: KEINE technischen Blocker, nur externe Genehmigungen**
