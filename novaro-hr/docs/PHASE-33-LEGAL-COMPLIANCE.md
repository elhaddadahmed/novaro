# PHASE 33 – Legal & Compliance Checklist

**Date:** October 24, 2026  
**Status:** Framework Complete  
**Document:** Legal compliance requirements for production launch  

---

## 🎯 Scope

Ensure Novaro HR complies with:
- ✅ DSGVO (German & EU data protection)
- ✅ ArbZG (German labor law – monitoring)
- ✅ GDPR (EU General Data Protection)
- ✅ Contract law (Terms of Service)
- ✅ Anti-discrimination law
- ✅ Works Council rights (Betriebsrat)

---

## 1️⃣ DSGVO / GDPR COMPLIANCE

### 1.1 Legal Basis for Processing

**Employee Data:**
| Processing | Legal Basis | Reference |
|---|---|---|
| Payroll | Art. 6(1)(c) DSGVO | Legal obligation |
| Time tracking | Art. 6(1)(b) DSGVO | Employment contract |
| Leave management | Art. 6(1)(b) DSGVO | Employment contract |
| Geofencing | Art. 6(1)(b) + Art. 88 DSGVO | Employment contract + special provision |
| NFC scanning | Art. 6(1)(b) DSGVO | Employment contract |
| Payroll documents | Art. 6(1)(c) DSGVO | Legal obligation (tax/social) |
| Audit logs | Art. 6(1)(f) DSGVO | Legitimate interest (security) |
| CV/documents | Art. 6(1)(a) DSGVO | Explicit consent |

**Status:** 
- [ ] Legal basis documented
- [ ] Internal register created (see 1.4)
- [ ] Consent forms prepared (where needed)

---

### 1.2 Data Subject Rights (Art. 12-22 DSGVO)

**Implement & Test:**

| Right | Implementation | Status |
|---|---|---|
| **Right of Access** (Art. 15) | `GET /api/me/data-export` | [ ] Implemented |
| **Rectification** (Art. 16) | Edit employee profile | [ ] Working |
| **Erasure** (Art. 17) | "Right to be forgotten" button | [ ] Implemented |
| **Restrict Processing** (Art. 18) | Mark account as "restricted" | [ ] Planned |
| **Data Portability** (Art. 20) | Export as JSON/CSV | [ ] Implemented |
| **Object** (Art. 21) | Opt-out for marketing emails | [ ] Implemented |
| **Automated Decision-Making** (Art. 22) | N/A (no AI decisions yet) | ✅ N/A |

**Export Format (Art. 20):**
```json
{
  "user": { "id": "...", "name": "...", "email": "..." },
  "employee": { "id": "...", "department": "...", "salary": "..." },
  "time_entries": [ { "date": "...", "hours": "..." } ],
  "leave_requests": [ { "from": "...", "to": "...", "status": "..." } ],
  "documents": [ { "id": "...", "type": "...", "url": "..." } ]
}
```

**Status:**
- [ ] Export endpoint implemented
- [ ] Tested with real data
- [ ] User documentation created

---

### 1.3 Data Protection Impact Assessment (DPIA)

**Already completed in Phase 28** ✅

**File:** `docs/PHASE-00-GDPR.md` (section: DPIA)

**Review Before Launch:**
- [ ] Reread DPIA
- [ ] Verify all recommendations implemented
- [ ] Document any residual risks
- [ ] Get sign-off from stakeholders

**Key Findings (from Phase 28):**
- ✅ Time tracking: LOW risk (standard employee data)
- ⚠️ Geofencing: HIGH risk (continuous location tracking)
  - **Mitigations:** Opt-out, radius-based (not precise), audit logging, Works Council approval
- ✅ Payroll: MEDIUM risk (sensitive data)
  - **Mitigations:** Encryption, access control, retention policy

---

### 1.4 Record of Processing Activities (RRPA / Verarbeitungsverzeichnis)

**Create & Maintain:**

```markdown
# Verarbeitungsverzeichnis (Record of Processing Activities)

## Processing Activity 1: Time Tracking
- **Purpose:** Track employee working hours
- **Legal Basis:** Art. 6(1)(b) – Employment contract
- **Personal Data:** Date, time, employee ID, location (optional)
- **Categories of Recipients:** HR, Manager, Payroll system
- **Retention:** 7 years (tax law)
- **Data Subject Rights:** Access, rectification, erasure
- **Security Measures:** Encryption at rest/transit, RLS, audit logging

## Processing Activity 2: Geofencing
- **Purpose:** Verify employee location during work hours
- **Legal Basis:** Art. 6(1)(b) + Art. 88 DSGVO
- **Personal Data:** GPS coordinates, timestamp, employee ID
- **Categories of Recipients:** HR, Manager
- **Retention:** Until end of employment + 30 days
- **Data Subject Rights:** Access, object, erasure
- **Security Measures:** Encrypted storage, radius-based (not precise)
- **Special Requirements:** Works Council approval (ArbZG § 88)

## Processing Activity 3: Payroll
- **Purpose:** Calculate salaries, taxes, social insurance
- **Legal Basis:** Art. 6(1)(c) – Legal obligation
- **Personal Data:** Name, tax ID, bank account, salary, leave, time
- **Categories of Recipients:** Payroll processor, tax authority, social insurance
- **Retention:** 10 years (German tax law)
- **Data Subject Rights:** Access, rectification
- **Security Measures:** Encryption, access control, audit logging

## [Continue for all processing activities...]
```

**Status:**
- [ ] RRPA template created
- [ ] All 15+ processing activities documented
- [ ] Stored in secure location (internal Wiki or Confluence)
- [ ] Accessible to Data Protection Officer (DPO)

---

### 1.5 Data Retention & Deletion Policy

**Document (Datenspeicherungsrichtlinie):**

| Data Type | Retention Period | Reason | Deletion Method |
|---|---|---|---|
| **User Account** | Until deletion request | Contract | Soft delete (7 days grace period) |
| **Time Entries** | 7 years | Tax law (§ 257 HGB) | Hard delete after retention |
| **Leave Requests** | 7 years | Labor law | Hard delete after retention |
| **Payroll Documents** | 10 years | Tax law (§ 147 AO) | Hard delete after retention |
| **Audit Logs** | 12 months | Security & compliance | Hard delete after retention |
| **Deleted Users** | 30 days | GDPR Art. 17 (erasure) | Hard delete after grace |
| **Trial Companies** | 90 days after trial end | Data minimization | Hard delete after retention |
| **Location Data** | Until end of employment | Purpose limitation | Hard delete after retention |
| **Chat/Messages** | Until deletion | No legal requirement | User or admin deletion |
| **Device Tokens (Push)** | Until app uninstall | Functional necessity | Auto-cleanup |

**Implementation in DB:**

```sql
-- Soft delete (user_accounts)
ALTER TABLE user_accounts ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_user_accounts_deleted ON user_accounts(deleted_at);

-- Hard delete trigger (after 30 days)
CREATE OR REPLACE FUNCTION hard_delete_users_after_grace_period()
RETURNS void AS $$
BEGIN
  DELETE FROM user_accounts 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule: pg_cron
SELECT cron.schedule('hard_delete_users', '0 2 * * *', 
  'SELECT hard_delete_users_after_grace_period()');
```

**Status:**
- [ ] Policy documented
- [ ] Database triggers/procedures implemented
- [ ] Automated cleanup scheduled
- [ ] Tested with test data

---

### 1.6 Privacy by Design & Default

**Implement:**

- [ ] **Data Minimization**
  - Only collect necessary data (no "just in case")
  - Remove unused fields (e.g., middle_name if not needed)
  - Geofencing: Radius-based, not precise GPS

- [ ] **Purpose Limitation**
  - Time data used only for payroll/HR
  - Location data used only for verification
  - No cross-selling, marketing, or analytics (without consent)

- [ ] **Storage Limitation**
  - Automatic deletion per retention policy
  - No "backup forever" mentality
  - Encrypted backups with key rotation

- [ ] **Integrity & Confidentiality**
  - HTTPS/TLS everywhere
  - Encryption at rest (passwords, API keys)
  - Role-based access control (RBAC)
  - Audit logging

- [ ] **Accountability**
  - RRPA maintained & accessible
  - DPO assigned (if required)
  - Privacy policy published
  - Incident response plan documented

---

## 2️⃣ ArbZG COMPLIANCE (German Labor Law)

### 2.1 Monitoring & Surveillance (ArbZG § 88)

**Requires Works Council Approval:**
- ✅ Time tracking (Arbeitszeiterfassung)
- ✅ Geofencing (GPS-Standortverfolgung)
- ✅ NFC/QR scanning (Zutritt, Zeiterfassung)
- ❌ Chat monitoring (NOT implemented)
- ❌ Computer activity monitoring (NOT implemented)

**Works Council Process:**

```
1. Information Phase (Woche 1)
   - HR informs Works Council of new monitoring system
   - Provide: Technical details, DPIA summary, consent requirements
   - Send: "Anzeige gemäß ArbZG § 88 Abs. 1"

2. Negotiation Phase (Wochen 2-6, typically)
   - Works Council reviews (10 days min.)
   - Can request explanations, data protection measures
   - Can propose conditions/limits

3. Agreement/Decision Phase
   - Option A: Einigung (agreement reached)
     → Both sign addendum to Gesamtbetriebsvereinbarung (GBV)
     → Monitoring can begin
   - Option B: Keine Einigung (no agreement after 4 weeks)
     → Legally, employer can proceed (but still compliant with DSGVO)
     → Recommended: Still cooperate with Works Council
   - Option C: Works Council veto
     → Rare (only if violates dignity, health, safety)
     → Escalate to Arbeitsgericht if needed

4. Implementation
   - Written policy distributed to all employees
   - Training on new system
   - Regular audits

5. Ongoing
   - Annual review with Works Council
   - Adjust if privacy risks emerge
```

**Action Items:**

- [ ] **Prepare Notice (Anzeige)**
  ```
  Gemäß ArbZG § 88 Abs. 1 informieren wir hiermit den Betriebsrat
  über die Einführung eines elektronischen Überwachungssystems:
  
  System: Novaro HR Time & Geofencing
  Betroffen: Alle Mitarbeiter (Zeiterfassung, optional: Standort)
  Technologie: GPS (radius-based), NFC, QR, Web/App
  Datenspeicherung: 7 Jahre (Arbeitszeit), 30 Tage (Standort)
  Sicherheit: Encryption, RLS, Audit Logs
  Rechtsgrundlage: ArbZG § 88, DSGVO Art. 6(1)(b) + Art. 88
  
  Anlage: DPIA, Technical Specification, Privacy Policy
  ```

- [ ] **Send to Works Council** (formal, registered mail)
  
- [ ] **Schedule negotiation meeting** (within 10 days)

- [ ] **Document outcome** (signed agreement or no veto)

- [ ] **Publish employee notice** (once approved)

**Status:**
- [ ] Notice drafted (in German)
- [ ] DPIA & technical docs prepared
- [ ] Awaiting Works Council decision

---

### 2.2 Employee Rights (ArbZG § 87 Abs. 1 Pt. 6)

**Implement:**
- ✅ Employee **right to object** to geofencing (must be honored)
- ✅ Employee **right to information** (access own data)
- ✅ Employee **right to rectification** (correct errors)
- ✅ Regular **works council meetings** to review monitoring

**UI Component Needed:**

```tsx
// Employee Settings: Geofencing Opt-Out
<Card>
  <h3>Geofencing (Standortverfolgung)</h3>
  <p>Ihr Arbeitgeber nutzt GPS zur Verifizierung Ihrer Arbeitszeit.</p>
  <ToggleSwitch 
    label="Standortverfolgung aktiviert"
    value={geofencingEnabled}
    onChange={handleToggle}
  />
  <p className="text-sm text-gray-500">
    Sie können diese Funktion jederzeit deaktivieren.
    Dies kann Ihre Zeiterfassung beeinflussen.
  </p>
</Card>
```

**Status:**
- [ ] Implemented in employee settings
- [ ] Audit trail for all opt-in/opt-out changes
- [ ] Notification to manager when disabled

---

## 3️⃣ TERMS OF SERVICE (ALLGEMEINE GESCHÄFTSBEDINGUNGEN)

### 3.1 Required Sections (German + English)

**Template Structure:**

```markdown
# Terms of Service / Allgemeine Geschäftsbedingungen (AGB)

## 1. Leistungsbeschreibung
- Product overview
- Included features (by subscription plan)
- Service level (99.9% uptime)

## 2. Vertragsbedingungen
- How to sign up (self-service, trial)
- Subscription plans & pricing
- Renewal (auto vs. manual)
- Currency & billing cycles

## 3. Zahlung
- Payment methods accepted (Stripe, SEPA, etc.)
- Invoice schedule
- Late payment consequences
- Refund policy (no refund for delivered services)

## 4. Benutzerverantwortung
- Account security responsibility
- Prohibited uses (illegal data, hacking, spam)
- User-generated content ownership
- Compliance with applicable laws

## 5. Widerrufsrecht (14 Tage)
- Per DSGVO, applicable only to consumer contracts
- If company is B2B: "Widerrufsrecht ausgeschlossen" (exclusion)
- Procedure for withdrawal

## 6. Kündigungsrecht
- Either party can cancel anytime
- Cancel via account settings or email
- Effective end of billing period
- No refund for unused time

## 7. Geistiges Eigentum
- IP ownership (Novaro retains all software IP)
- User data ownership (User retains all their data)
- License grant (limited, non-transferable)

## 8. Datenschutz & Sicherheit
- Reference to Privacy Policy
- Liability for data breaches
- GDPR compliance statement
- Audit rights

## 9. Haftungsbegrenzung (Limitation of Liability)
- No liability for indirect damages (lost profits, data loss)
- Max liability = fees paid in last 3 months (or €100)
- Exceptions: Death, personal injury, fraud, IP infringement

## 10. Verfügbarkeit & Wartung
- Service may be unavailable for maintenance
- Planned maintenance: 48-hour notice
- Emergency maintenance: immediate (best effort to notify)

## 11. Künftige Änderungen
- Novaro can modify terms with 30-day notice
- Material changes require opt-in
- Continued use = acceptance

## 12. Kündigung durch Novaro
- Novaro can terminate for:
  - Non-payment (after 30-day notice)
  - Abuse/violation of terms
  - Legal requirement
- Effect: Immediate or end-of-period

## 13. Datenlöschung nach Kündigung
- User data deleted after 30 days
- Backups retained per retention policy
- Archives for legal/tax purposes kept 10 years

## 14. Streitbeilegung & Gerichtsbarkeit
- German law governs (for German contracts)
- Courts in [City, Germany]
- Arbitration clause (optional, if B2B)

## 15. Salvatorische Klausel
- If any clause invalid, rest of agreement stands
- Invalid clause replaced with valid equivalent

## Appendix A: Data Processing Addendum (DPA)
- For B2B contracts only
- References GDPR Art. 28 obligations
- Subadd: Supabase, Stripe, Sentry as subprocessors
```

**Template:** Use Termly.io or similar (legal template service)

**Status:**
- [ ] Template obtained from legal service
- [ ] German version created
- [ ] English translation completed
- [ ] Legal review by counsel
- [ ] Published on website
- [ ] Acceptance on signup

---

### 3.2 Widerrufsrecht (Right of Withdrawal)

**Applies to:**
- ✅ B2C (Business-to-Consumer) contracts (14-day right)
- ❌ B2B (Business-to-Business) contracts (excluded)

**Implementation:**

```markdown
## Widerrufsrecht (nur für Verbraucher)

Sie haben ein 14-tägiges Widerrufsrecht nach Kaufabschluss.

**Widerrufsbelehrung:**

Sie können von diesem Vertrag ohne Angabe von Gründen 
innerhalb von 14 Tagen ab dem Tag der Bestellung widerrufen.

Die Widerrufsfrist endet um Mitternacht auf den letzten Tag der Frist.

Um Ihr Widerrufsrecht auszuüben, teilen Sie uns 
(Novaro HR, support@novaro.de) formlos mit, dass Sie 
von diesem Vertrag widerrufen.

**Rückzahlung:**
Bei Widerruf erhalten Sie die gezahlte Gegenleistung 
zurück, soweit Sie die Leistung nicht in Anspruch genommen haben.

**Ausnahme:**
Bei vollständiger oder teilweiser Inanspruchnahme 
der Leistung vor Ablauf der 14-Tage-Frist entfällt das Widerrufsrecht.
```

**Status:**
- [ ] Widerrufsrecht documented (if B2C)
- [ ] Clarified as B2B only (if so) with exclusion
- [ ] Refund process automated or documented

---

## 4️⃣ PRIVACY POLICY (DATENSCHUTZERKLÄRUNG)

### 4.1 Required Elements (Art. 13, 14 DSGVO)

**German Privacy Policy Template:**

```markdown
# Datenschutzerklärung (Privacy Policy)

## 1. Verantwortliche Stelle
**Name:** Novaro HR GmbH  
**Adresse:** [Your address]  
**Email:** [Your email]  
**Datenschutzbeauftragte (DPO):** [DPO name & contact]  

## 2. Verarbeitete Daten
Wir verarbeiten folgende Kategorien personenbezogener Daten:
- Kontaktdaten (Name, Email, Telefon)
- Arbeitsdaten (Abteilung, Titel, Vertrag)
- Zeiterfassungsdaten (Arbeitsstunden, Standort, Pausen)
- Finanzielle Daten (Gehalt, Bank, Steuern)
- Authentifizierungsdaten (Password hash, 2FA)

## 3. Rechtsgrundlagen
| Verarbeitung | Rechtsgrundlage |
|---|---|
| Zeiterfassung | Art. 6(1)(b) DSGVO – Arbeitsvertrag |
| Gehaltsabrechnung | Art. 6(1)(c) DSGVO – Gesetzliche Verpflichtung |
| Geofencing | Art. 6(1)(b) + Art. 88 DSGVO |
| Marketing | Art. 6(1)(a) DSGVO – Einwilligung |

## 4. Empfänger von Daten
Ihre Daten werden weitergegeben an:
- Ihr Arbeitgeber (Novaro HR Kunde)
- Manager/HR-Abteilung
- Lohnverrechnungssysteme (externe Dienstleister)
- Steuerbehörden (gesetzliche Verpflichtung)
- Hosting-Provider: Supabase (EU-US SCC), AWS
- Zahlungsanbieter: Stripe (EU-US SCC)
- Error Tracking: Sentry (EU-US SCC)

## 5. Speicherdauer
- Zeiterfassungsdaten: 7 Jahre (Steuern)
- Lohnabrechnungsdaten: 10 Jahre (Steuern)
- Standortdaten: 30 Tage (nach Verstoß gelöscht)
- Gelöschte Konten: 30 Tage (dann dauerhaft gelöscht)

## 6. Ihre Rechte
Sie haben folgende Rechte:
- **Recht auf Auskunft** (Art. 15) – Daten-Export anfordern
- **Recht auf Berichtigung** (Art. 16) – Fehlerhafte Daten korrigieren
- **Recht auf Löschung** (Art. 17) – "Recht auf Vergessenwerden"
- **Recht auf Einschränkung** (Art. 18) – Verarbeitung einschränken
- **Recht auf Datenportabilität** (Art. 20) – Daten als JSON/CSV exportieren
- **Recht auf Widerspruch** (Art. 21) – Verarbeitung ablehnen
- **Recht auf Beschwerde** (Art. 77) – Bei Bundesdatenschutzbeauftragten (BfDI) einreichen

## 7. Sicherheitsmaßnahmen
- Verschlüsselung: HTTPS (Transit), AES-256 (Speicher)
- Zugriffskontrolle: Rollenbasierte Zugriffe (RBAC)
- Authentifizierung: Sichere Passwörter, 2FA (optional)
- Audit-Logging: Alle sensiblen Aktionen geloggt
- Regelmäßige Sicherheitsaudits und Penetrationstests

## 8. Internationale Datenübertragung
Ihre Daten können in folgende Länder übertragen werden:
- **USA:** Supabase (AWS), Stripe, Sentry
  Rechtsgrundlage: Standardvertragsklauseln (SCC, Art. 46 DSGVO)
- **EU:** Backup-Systeme (auf Anfrage)

## 9. Automatisierte Entscheidungsfindung
Wir treffen KEINE automatisierten Entscheidungen, die Ihre Rechte beeinträchtigen
(z.B. automatische Kündigung, Leistungsbeurteilung ohne Überprüfung).

## 10. Cookies
Wir setzen folgende Cookies:
- **Session-Cookie:** Zur Authentifizierung (erforderlich)
- **Analytics:** Nur mit Einwilligung

[Consent-Banner implementieren]

## 11. Kontakt & Beschwerden
**Datenschutzbeauftragte:**  
Novaro HR GmbH  
DPO@novaro.de  
+49 421 ...

**Bundesdatenschutzbeauftragte:**  
Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)  
Husarenstr. 30, 53117 Bonn  
Tel. +49 228 / 997799 - 0  
```

**Status:**
- [ ] German version (complete)
- [ ] English translation (complete)
- [ ] Published on website
- [ ] Link in footer & login page
- [ ] Legal review completed

---

## 5️⃣ INCIDENT RESPONSE & DATA BREACH NOTIFICATION

### 5.1 Data Breach Notification (Art. 33, 34 DSGVO)

**Timeline:**
- **T+0:** Breach discovered
- **T+0-1h:** Incident response team activated
- **T+1-12h:** Initial investigation, severity assessment
- **T+12-72h:** Notify supervisory authority (if risk > threshold)
- **T+72h+:** Notify affected individuals (without undue delay)

**Notification Template (Art. 34):**

```markdown
# Data Breach Notification

Dear [Individual Name],

We must inform you of a data breach affecting your personal data.

**What happened:**
On [Date], we discovered that [Description of breach].

**What data was affected:**
- [List affected personal data: name, email, time entries, etc.]

**What we did:**
- [Immediate action: e.g., disconnected system, reset passwords]
- [Investigation: e.g., forensics completed, root cause identified]

**What we're doing now:**
- [Remediation: e.g., security patch deployed, access revoked]
- [Prevention: e.g., 2FA now required, audit logging expanded]

**Your rights:**
- Free credit monitoring for [12 months]
- File complaint with BfDI (German Data Protection Authority)
- Request data access (Art. 15)

**Contact:**
DPO@novaro.de or +49 421 ...
```

**Status:**
- [ ] Incident response plan documented
- [ ] Notification template prepared
- [ ] Team trained on procedures
- [ ] DPO designated

---

## 6️⃣ SUPERVISORY AUTHORITY NOTIFICATION

**German Supervisory Authority:**
**Landesbehörde für Datenschutz & Informationsfreiheit (LDI)** [for Bremen/your state]

**Required notifications (Art. 33 DSGVO):**
- Breaches with high risk to individuals
- Within 72 hours of discovery
- Form: https://www.datenschutz.de

**Status:**
- [ ] LDI contact info documented
- [ ] Notification procedure clarified
- [ ] Team familiar with reporting requirements

---

## ✅ COMPLIANCE CHECKLIST

### Before Launch

- [ ] **GDPR/DSGVO**
  - [ ] Legal bases documented (Art. 6)
  - [ ] RRPA maintained (Art. 30)
  - [ ] DPIA completed (Art. 35)
  - [ ] DPO designation (if applicable, Art. 37)
  - [ ] Data subject rights implemented (Art. 12-22)
  - [ ] Retention policies automated (Art. 5(1)(e))
  - [ ] Breach notification plan ready (Art. 33-34)

- [ ] **ArbZG § 88**
  - [ ] Works Council notification sent
  - [ ] Negotiation completed
  - [ ] Agreement signed or no veto confirmed
  - [ ] Monitoring policy published to employees

- [ ] **Terms of Service**
  - [ ] German + English versions
  - [ ] Legal review completed
  - [ ] Acceptance checkbox on signup
  - [ ] Stored & versioned (git or legal platform)

- [ ] **Privacy Policy**
  - [ ] Comprehensive (Art. 13, 14 DSGVO)
  - [ ] German + English
  - [ ] Accessible from website footer
  - [ ] Legal review completed

- [ ] **Data Processing**
  - [ ] Encryption at rest & transit
  - [ ] Access control (RBAC) implemented
  - [ ] Audit logging functional
  - [ ] Backup & recovery tested

- [ ] **International Transfers**
  - [ ] SCC in place for US services (Supabase, Stripe, Sentry)
  - [ ] Transfer Impact Assessment (TIA) completed
  - [ ] Supplementary measures documented

---

## 📅 Timeline

| Week | Milestone | Status |
|---|---|---|
| W1 | Works Council notice sent | ⏳ |
| W2-4 | Works Council negotiation | ⏳ |
| W4 | Legal review of Terms & Privacy | ⏳ |
| W5 | Final compliance review | ⏳ |
| W6 | Launch (if all approved) | ⏳ |

---

## Summary

**Legal status: 70% complete**

**Critical path:**
1. ✅ Works Council approval (in progress)
2. ✅ Terms of Service & Privacy Policy (legal review)
3. ✅ Incident response plan (framework ready)
4. ✅ Technical compliance (encryption, audit logs, RLS)

**Next steps:**
- [ ] Send Works Council notice
- [ ] Engage external legal counsel for Terms & Privacy
- [ ] Finalize retention policies & cleanup jobs
- [ ] Publish compliance documentation

---

**Date:** October 24, 2026  
**Document Version:** 1.0  
**Next Review:** Before launch (November 2026)
