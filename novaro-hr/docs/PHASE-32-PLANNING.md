# PHASE 32 – Weiterentwicklung: Feature Planning

**Status:** Planning Only (No Implementation)  
**Date:** October 24, 2026  
**Phase:** 32 / 33

---

## Übersicht

Diese Phase dokumentiert **technische Planung** für 15 potenzielle zukünftige Features. Implementierung erfolgt **nur nach separater Freigabe**.

Für jedes Feature werden bewertet:
- ✅ Architektur & Datenmodell
- ✅ Datenschutz & GDPR
- ✅ Permissions & RLS
- ✅ Security-Überlegungen
- ✅ Implementierungs-Roadmap
- ✅ Geschätzter Aufwand

---

## Feature 1: Advanced Analytics

### Ziel
Dashboard mit HR-Metriken, Trends, Prognosen. KPI-Verfolgung für Entscheidungsträger.

### Datenmodell
```sql
CREATE TABLE analytics_dashboards (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),
  config JSONB, -- widgets, metrics, filters
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE analytics_metrics (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL,
  metric_type TEXT, -- 'headcount', 'turnover', 'absence_rate', 'payroll_cost'
  period_date DATE NOT NULL,
  value NUMERIC(10,2),
  metadata JSONB,
  UNIQUE(company_id, metric_type, period_date)
);
```

### Permissions
- **COMPANY_ADMIN:** Alle Dashboard-Metriken
- **HR_ADMIN:** Alle Metriken ihrer Bereiche
- **MANAGER:** Nur Team/Department Metriken
- **EMPLOYEE:** Personalisierte Statistiken
- **SUPER_ADMIN:** All-Company View

### GDPR / Datenschutz
- ✅ Keine PII in Aggregaten (nur Nummern)
- ✅ Metriken auf Ebene des Unternehmens/der Abteilung
- ✅ Audit Trail für Dashboard-Zugriffe
- ✅ Export als anonymisierte CSV/PDF

### Security
- ✅ RLS: company_id + role-based filtering
- ✅ Keine direkten SQL-Abfragen, nur vordefinierte Metriken
- ✅ Rate Limiting für Dashboard-Updates

### Technologie
- **Backend:** PostgreSQL Aggregationen + Materialized Views
- **Frontend:** React Chart.js / Recharts
- **Caching:** Redis (metrics cache, 1h TTL)

### Aufwand
- Architektur: 8h
- Datenmodell: 6h
- Backend API: 20h
- Frontend UI: 25h
- Tests: 10h
- **Total:** ~70h

### Roadmap
1. Design & Architektur (1 Sprint)
2. Core Metrics (2 Sprints)
3. Dashboard UI (2 Sprints)
4. Advanced Features (1 Sprint)

---

## Feature 2: AI Assistant

### Ziel
HR-Chatbot für FAQs, Dokumentgenerierung, Employee Self-Service.

### Datenmodell
```sql
CREATE TABLE ai_training_data (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  document_type TEXT, -- 'policy', 'contract', 'faq'
  content TEXT,
  embedding VECTOR(1536), -- OpenAI embeddings
  created_at TIMESTAMP
);

CREATE TABLE ai_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company_id BIGINT,
  messages JSONB[], -- conversation history
  context JSONB, -- user_role, department, etc.
  created_at TIMESTAMP
);
```

### Permissions
- **EMPLOYEE:** General FAQs, Personal Questions
- **HR_ADMIN:** Advanced Queries, Training Data Management
- **SUPER_ADMIN:** Model Training, Analytics

### GDPR / Datenschutz
- ✅ Keine PII in Training Data
- ✅ Lokale Embeddings (kein OpenAI für sensitive data)
- ✅ Conversation Retention: 90 Tage max
- ✅ Audit: Alle Anfragen geloggt

### Security
- ✅ API Key Management (OpenAI / local LLM)
- ✅ Context Injection: Immer company_id validieren
- ✅ Prompt Injection Prevention (Input Validation)
- ✅ Rate Limiting: 10 Requests/Min per User

### Technologie
- **LLM Option 1:** OpenAI API (cost: ~€0.002/request)
- **LLM Option 2:** Local LLM (Llama 2, slower but private)
- **Embeddings:** pgvector (PostgreSQL)
- **Frontend:** React Chatbot UI

### Aufwand
- Architektur: 10h
- Training Data Setup: 8h
- Backend API: 15h
- Frontend UI: 12h
- Prompt Engineering: 10h
- Tests: 8h
- **Total:** ~63h

### Roadmap
1. LLM Selection & Setup (1 Sprint)
2. FAQs Knowledgebase (1 Sprint)
3. Chat UI (1 Sprint)
4. Document Generation (2 Sprints)

---

## Feature 3: Vertragsgenerator

### Ziel
Template-basierte automatische Generierung von Arbeitsverträgen (deutsche Rechtskomplexität).

### Datenmodell
```sql
CREATE TABLE contract_templates (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  contract_type TEXT, -- 'full-time', 'part-time', 'probation', 'freelance'
  language TEXT DEFAULT 'de', -- 'de', 'en'
  content TEXT, -- HTML template with {{placeholders}}
  variables JSONB, -- required fields
  created_at TIMESTAMP
);

CREATE TABLE generated_contracts (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  employee_id BIGINT REFERENCES employees(id),
  contract_type TEXT,
  generated_html TEXT,
  generated_pdf_url TEXT,
  signed_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### Permissions
- **HR_ADMIN:** Create & Generate Contracts
- **COMPANY_ADMIN:** Manage Templates
- **EMPLOYEE:** View Own Contracts
- **MANAGER:** View Team Contracts (read-only)

### GDPR / Datenschutz
- ✅ Contracts stored encrypted (AES-256)
- ✅ Signing with eIDAS-compliant signature (optional)
- ✅ Retention: 7 years (legal requirement, Germany)
- ✅ Audit: All generations logged with signer

### Security
- ✅ Template Injection Prevention (no code eval)
- ✅ PDF Generation sanitized (no malicious scripts)
- ✅ Signature Verification (if signed)
- ✅ RLS: company_id + role-based

### Technologie
- **Template Engine:** Handlebars (safe)
- **PDF Generation:** pdfkit or puppeteer
- **Signature:** DocuSign API or local signing
- **Storage:** Supabase Storage (encrypted bucket)

### Aufwand
- Architektur: 8h
- Legal Review (DE templates): 20h
- Template Creation (3-5 standard): 15h
- Backend API: 12h
- Frontend UI: 10h
- PDF Generation: 8h
- Tests: 6h
- **Total:** ~79h

### Roadmap
1. Legal Consultation & Templates (2 Sprints)
2. Generator API (1 Sprint)
3. UI & Storage (1 Sprint)
4. Signature Integration (1 Sprint)

---

## Feature 4: Automatische Dokumente

### Ziel
Auto-generate Arbeitsbestätigungen, Zeugnisse, Bescheinigungen.

### Datenmodell
```sql
CREATE TABLE document_templates (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  document_type TEXT, -- 'confirmation', 'reference', 'certificate', 'deactivation'
  template_content TEXT,
  required_data JSONB,
  language TEXT DEFAULT 'de'
);

CREATE TABLE generated_documents (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  employee_id BIGINT,
  document_type TEXT,
  pdf_url TEXT,
  issued_at TIMESTAMP,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP
);
```

### Permissions
- **HR_ADMIN:** Generate & Issue
- **EMPLOYEE:** Download own documents
- **MANAGER:** Request for team (with approval flow)

### GDPR / Datenschutz
- ✅ Only necessary fields in documents
- ✅ Retention per document type (Arbeitsbestätigung: 3 years, Zeugnis: 7 years)
- ✅ Right to erasure: Delete after retention period

### Security
- ✅ Digital Signature (company stamp + HR signature)
- ✅ QR Code linking to verification endpoint
- ✅ Document Tamper Detection (hash verification)

### Technologie
- **Template Engine:** Handlebars
- **PDF:** pdfkit + image/signature overlays
- **Verification:** QR → API endpoint (check hash)

### Aufwand
- Templates & Legal: 15h
- Backend: 10h
- Frontend: 8h
- Digital Signature: 6h
- Tests: 4h
- **Total:** ~43h

### Roadmap
1. Template Setup (1 Sprint)
2. Generator & Signature (1 Sprint)
3. UI & Distribution (1 Sprint)

---

## Feature 5: Recruiting

### Ziel
Job-Postings, Bewerberverwaltung, ATS (Applicant Tracking).

### Datenmodell
```sql
CREATE TABLE job_postings (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  title TEXT,
  description TEXT,
  department_id BIGINT,
  location_id BIGINT,
  salary_min INTEGER,
  salary_max INTEGER,
  employment_type TEXT, -- full-time, part-time, contract
  status TEXT DEFAULT 'draft', -- draft, published, closed
  published_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE job_applicants (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  job_posting_id BIGINT REFERENCES job_postings(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  resume_url TEXT, -- Supabase Storage
  status TEXT DEFAULT 'new', -- new, screening, interview, offer, hired, rejected
  notes TEXT,
  applied_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE job_interviews (
  id BIGSERIAL PRIMARY KEY,
  applicant_id BIGINT REFERENCES job_applicants(id),
  interviewer_user_id UUID,
  interview_date TIMESTAMP,
  notes TEXT,
  rating INTEGER, -- 1-5
  next_step TEXT,
  created_at TIMESTAMP
);
```

### Permissions
- **HR_ADMIN:** Full ATS access
- **MANAGER:** Can view & interview candidates for own department
- **COMPANY_ADMIN:** Full ATS + settings
- **APPLICANT:** View own application status

### GDPR / Datenschutz
- ✅ Applicant Data Retention: 6 months after decision (then delete)
- ✅ GDPR Article 22: No automated decision without human review
- ✅ Data Subject Rights: Applicants can request data deletion
- ✅ No discriminatory filtering (no AI bias)

### Security
- ✅ Resume File Upload: Malware scan + file type check
- ✅ RLS: company_id + role-based filtering
- ✅ Audit: All decisions logged with timestamp & user

### Technologie
- **Backend:** REST API + Pagination
- **Frontend:** React Kanban Board (drag-drop workflow)
- **Integrations:** Email notifications, Calendar sync
- **Optional:** LinkedIn API integration (data from LinkedIn)

### Aufwand
- Architektur: 8h
- Datenmodell: 6h
- Backend API: 18h
- Frontend UI (Kanban): 20h
- Email Notifications: 8h
- Tests: 8h
- **Total:** ~68h

### Roadmap
1. Datenmodell & Core API (1 Sprint)
2. ATS UI (Kanban) (2 Sprints)
3. Workflow & Notifications (1 Sprint)
4. Reporting & Integrations (1 Sprint)

---

## Feature 6: Training & Development

### Ziel
Schulungsplanung, Zertifikate, Skill-Tracking.

### Datenmodell
```sql
CREATE TABLE training_programs (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  name TEXT,
  description TEXT,
  duration_hours INTEGER,
  internal BOOLEAN DEFAULT false, -- internal or external training
  cost NUMERIC(10,2),
  created_at TIMESTAMP
);

CREATE TABLE training_enrollments (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  training_id BIGINT REFERENCES training_programs(id),
  status TEXT, -- 'enrolled', 'completed', 'cancelled'
  completion_date TIMESTAMP,
  certificate_url TEXT,
  created_at TIMESTAMP
);

CREATE TABLE employee_skills (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  skill_name TEXT,
  proficiency_level TEXT, -- 'beginner', 'intermediate', 'advanced', 'expert'
  acquired_date TIMESTAMP,
  expires_at TIMESTAMP, -- for certifications
  created_at TIMESTAMP
);
```

### Permissions
- **MANAGER:** Recommend trainings for team
- **HR_ADMIN:** Manage programs, track completion
- **EMPLOYEE:** View own trainings & skills
- **COMPANY_ADMIN:** Budget & reporting

### GDPR / Datenschutz
- ✅ Skill data: Only with employee consent
- ✅ Skill expiry alerts (e.g., certification renewal needed)
- ✅ Training records: 7 years (legal requirement)

### Security
- ✅ Certificate Verification (issued by company or provider)
- ✅ No external API calls for sensitive data
- ✅ RLS: company_id + role

### Technologie
- **Backend:** REST API
- **Frontend:** Training Marketplace + Skill Canvas (visual skills matrix)
- **Notifications:** Expiry alerts, completion reminders

### Aufwand
- Datenmodell: 6h
- Backend API: 12h
- Frontend UI: 14h
- Certificate Management: 6h
- Tests: 4h
- **Total:** ~42h

### Roadmap
1. Datenmodell & API (1 Sprint)
2. UI: Training Marketplace (1 Sprint)
3. Skill Matrix & Reporting (1 Sprint)

---

## Feature 7: Performance Reviews

### Ziel
360-Degree Feedback, Goal Tracking, Rating System.

### Datenmodell
```sql
CREATE TABLE review_cycles (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  name TEXT, -- 'Q1 2027', 'Annual 2026'
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning', -- planning, active, closed
  created_at TIMESTAMP
);

CREATE TABLE performance_goals (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  review_cycle_id BIGINT REFERENCES review_cycles(id),
  goal_title TEXT,
  description TEXT,
  target_value NUMERIC(10,2),
  actual_value NUMERIC(10,2),
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
  created_at TIMESTAMP
);

CREATE TABLE performance_reviews (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  review_cycle_id BIGINT,
  reviewer_user_id UUID, -- Can be manager or peer
  rating INTEGER, -- 1-5
  comments TEXT,
  feedback JSONB, -- {category: score}
  is_anonymous BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### Permissions
- **MANAGER:** Create & view own team reviews
- **EMPLOYEE:** View own reviews & goals
- **HR_ADMIN:** Full access + analytics
- **PEER:** Submit anonymous feedback (if cycle allows)

### GDPR / Datenschutz
- ✅ Reviews: 3-year retention (legal requirement)
- ✅ Anonymous feedback: True anonymization (no IP logging)
- ✅ Sensitive data: Only what's necessary for evaluation

### Security
- ✅ Review Access: Only authorized viewers
- ✅ Anonymous Reviews: No user_id correlation
- ✅ Audit: All view/edit actions logged

### Technologie
- **Backend:** REST API + Workflow Engine
- **Frontend:** Form Builder (customizable rating scales)
- **Workflow:** Auto-reminders, approval chains

### Aufwand
- Datenmodell: 6h
- Backend: 15h
- Frontend: 12h
- Workflow Engine: 8h
- Tests: 5h
- **Total:** ~46h

### Roadmap
1. Datenmodell & Core API (1 Sprint)
2. Review UI & Workflow (2 Sprints)
3. Analytics & Reporting (1 Sprint)

---

## Feature 8: Fuhrpark

### Ziel
Fahrzeugverwaltung, Wartungsplan, Tankstellen-Tracking.

### Datenmodell
```sql
CREATE TABLE fleet_vehicles (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  license_plate TEXT UNIQUE,
  model TEXT,
  purchase_date DATE,
  purchase_price NUMERIC(10,2),
  fuel_type TEXT, -- 'petrol', 'diesel', 'electric', 'hybrid'
  status TEXT DEFAULT 'active',
  location_id BIGINT,
  assigned_user_id UUID,
  created_at TIMESTAMP
);

CREATE TABLE fleet_maintenance (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT REFERENCES fleet_vehicles(id),
  maintenance_type TEXT, -- 'oil_change', 'inspection', 'repair'
  scheduled_date DATE,
  completed_date DATE,
  cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP
);

CREATE TABLE fuel_logs (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT,
  driver_user_id UUID,
  date DATE,
  liters NUMERIC(10,2),
  cost NUMERIC(10,2),
  mileage INTEGER,
  location_id BIGINT,
  created_at TIMESTAMP
);
```

### Permissions
- **MANAGER:** View team vehicle assignments
- **DRIVER (Employee):** Log fuel, report issues
- **HR_ADMIN:** Fleet management, maintenance scheduling
- **COMPANY_ADMIN:** Fleet analytics & budgeting

### GDPR / Datenschutz
- ✅ Driver data: Minimal (user_id only, not location tracking)
- ✅ Fuel logs: Aggregate for reporting, individual data retention 3 years

### Security
- ✅ Vehicle Assignment: Only authorized users
- ✅ Fuel Logging: No GPS tracking (location is refueling point only)
- ✅ RLS: company_id

### Technologie
- **Backend:** REST API + Maintenance Scheduler (cron)
- **Frontend:** Fleet Dashboard, Maintenance Calendar
- **Optional:** Telematics API (fuel consumption optimization)

### Aufwand
- Datenmodell: 5h
- Backend: 10h
- Frontend: 10h
- Maintenance Scheduler: 6h
- Tests: 3h
- **Total:** ~34h

### Roadmap
1. Datenmodell & API (1 Sprint)
2. Dashboard & Logging (1 Sprint)
3. Maintenance Scheduler (1 Sprint)

---

## Feature 9: Expenses (Spesenabrechnung)

### Ziel
Speseneingabe, Genehmigung, Abrechnung, Kostenstellenverteilung.

### Datenmodell
```sql
CREATE TABLE expense_reports (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  company_id BIGINT,
  period_start DATE,
  period_end DATE,
  total_amount NUMERIC(10,2),
  status TEXT DEFAULT 'draft', -- draft, submitted, approved, paid
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE expense_items (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT REFERENCES expense_reports(id),
  date DATE,
  category TEXT, -- 'travel', 'meals', 'accommodation', 'other'
  description TEXT,
  amount NUMERIC(10,2),
  cost_center TEXT, -- Internal cost allocation
  receipt_url TEXT, -- Supabase Storage
  created_at TIMESTAMP
);

CREATE TABLE expense_approvals (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT,
  approver_user_id UUID,
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP
);
```

### Permissions
- **EMPLOYEE:** Submit own expenses
- **MANAGER:** Approve own team's expenses
- **FINANCE:** Process payments, cost allocation
- **COMPANY_ADMIN:** Settings, budgets

### GDPR / Datenschutz
- ✅ Receipt Images: Minimal PII (redact sensitive info if needed)
- ✅ Retention: 7 years (tax requirement, Germany)

### Security
- ✅ Receipt Upload: Malware scan, file type check
- ✅ Approval Workflow: Cannot self-approve
- ✅ Audit: All changes logged

### Technologie
- **Backend:** REST API + Workflow
- **Frontend:** Expense Form, Receipt Upload, Dashboard
- **Integration:** Accounting Export (CSV/API)

### Aufwand
- Datenmodell: 5h
- Backend: 12h
- Frontend: 10h
- Approval Workflow: 6h
- Receipt OCR (optional): 8h
- Tests: 3h
- **Total:** ~44h (without OCR: ~36h)

### Roadmap
1. Datenmodell & API (1 Sprint)
2. Frontend UI (1 Sprint)
3. Approval Workflow (1 Sprint)
4. OCR Integration (optional, 1 Sprint)

---

## Feature 10: Home Office

### Ziel
Remote Work Policy, Home Office Requests, Equipment Tracking.

### Datenmodell
```sql
CREATE TABLE home_office_policies (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  max_days_per_week INTEGER,
  max_days_per_month INTEGER,
  approval_required BOOLEAN DEFAULT true,
  equipment_provided BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

CREATE TABLE home_office_requests (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  company_id BIGINT,
  date DATE,
  full_day BOOLEAN,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID,
  approved_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE home_office_equipment (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  equipment_type TEXT, -- 'laptop', 'monitor', 'keyboard', 'chair', 'desk'
  description TEXT,
  issued_date DATE,
  value NUMERIC(10,2),
  status TEXT, -- 'issued', 'returned', 'damaged'
  created_at TIMESTAMP
);
```

### Permissions
- **EMPLOYEE:** Submit Home Office requests
- **MANAGER:** Approve/reject requests
- **HR_ADMIN:** Policy management, equipment tracking
- **COMPANY_ADMIN:** Analytics & compliance

### GDPR / Datenschutz
- ✅ No location tracking (only date-based requests)
- ✅ Home office data: 1 year retention max
- ✅ Equipment tracking: As long as assigned

### Security
- ✅ Request Approval: Manager cannot approve own
- ✅ Equipment Audit: All issues/returns logged
- ✅ RLS: company_id

### Technologie
- **Backend:** REST API
- **Frontend:** Calendar view (Home office days), Equipment dashboard
- **Analytics:** Occupancy planning

### Aufwand
- Datenmodell: 4h
- Backend: 8h
- Frontend: 8h
- Calendar Integration: 4h
- Tests: 2h
- **Total:** ~26h

### Roadmap
1. Datenmodell & API (1 Sprint)
2. Calendar UI & Workflow (1 Sprint)

---

## Feature 11: SSO (Single Sign-On)

### Ziel
Enterprise SSO via SAML/OAuth, AD Integration, Google/Microsoft Workspace.

### Implementierung
- **Option 1:** SAML 2.0 (Enterprise Standard)
  - Supabase SSO (built-in)
  - AD / Azure AD integration
  - **Effort:** 16h

- **Option 2:** OAuth 2.0 (Google, Microsoft)
  - Google Workspace
  - Microsoft 365
  - **Effort:** 12h

- **Option 3:** Both (Full Enterprise)
  - **Effort:** 28h

### Architektur
```
Employee Browser
  → Novaro HR Login
  → Redirect to IdP (e.g., AD)
  → IdP Auth
  → Assertion back to Novaro
  → Supabase validates
  → Session created
```

### Datenmodell (Minimal, mostly in Supabase Auth)
```sql
CREATE TABLE sso_configurations (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT UNIQUE,
  idp_provider TEXT, -- 'azure_ad', 'google', 'saml_custom'
  idp_issuer TEXT,
  idp_entity_id TEXT,
  sso_enabled BOOLEAN DEFAULT false,
  auto_provision_users BOOLEAN DEFAULT false, -- Auto-create users from IdP
  created_at TIMESTAMP
);
```

### Permissions
- **COMPANY_ADMIN:** Configure SSO
- **SUPER_ADMIN:** Global SSO settings

### Security
- ✅ Assertion Signature Verification
- ✅ Audience Validation (prevent SAML injection)
- ✅ Encrypted communication (HTTPS only)
- ✅ No secrets in frontend

### GDPR
- ✅ User provisioning: Transparent, consent-based
- ✅ Assertion data: Not stored (only user ID)

### Aufwand
- SAML 2.0: 16h
- OAuth (Google/MS): 12h
- Both: 28h

### Roadmap
1. SAML Setup with Supabase (1 Sprint)
2. AD/Azure Integration (1 Sprint)
3. Google/Microsoft OAuth (1 Sprint)

---

## Feature 12: 2FA (Two-Factor Authentication)

### Ziel
MFA für erhöhte Sicherheit, besonders für Admin-Accounts.

### Implementation
- **TOTP** (Time-based One-Time Password)
  - Google Authenticator, Authy
  - No external dependency
  - **Effort:** 8h

- **SMS OTP**
  - Twilio/Vonage integration
  - Less secure but familiar
  - **Effort:** 10h

- **WebAuthn** (FIDO2)
  - Security keys, biometrics
  - Most secure
  - **Effort:** 16h

### Datenmodell
```sql
CREATE TABLE user_mfa_methods (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  method_type TEXT, -- 'totp', 'sms', 'webauthn'
  secret_encrypted TEXT, -- For TOTP
  phone_number_masked TEXT, -- For SMS
  webauthn_credential JSONB, -- For FIDO2
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

CREATE TABLE mfa_recovery_codes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  code_hashed TEXT,
  used_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### Permissions
- **EMPLOYEE:** Configure own MFA
- **COMPANY_ADMIN:** Enforce MFA for admins
- **SUPER_ADMIN:** Global MFA policies

### Security
- ✅ Secret Encryption (AES-256)
- ✅ Recovery Codes (backup access)
- ✅ Rate Limiting (prevent brute force)
- ✅ Audit: All MFA events logged

### GDPR
- ✅ Phone numbers encrypted
- ✅ User can remove MFA methods anytime

### Aufwand
- TOTP: 8h
- SMS OTP: 10h
- WebAuthn: 16h
- All three: 34h

### Roadmap
1. TOTP Setup (1 Sprint)
2. WebAuthn (1 Sprint)
3. SMS OTP (1 Sprint)

---

## Feature 13: Mehrsprachigkeit (i18n)

### Ziel
Mehrsprachige UI: Deutsch, Englisch, weitere Sprachen.

### Implementation
- **Frontend:** React i18next
- **Backend:** Locale parameter in API
- **Database:** Translation keys in JSON

### Datenmodell
```sql
CREATE TABLE translations (
  id BIGSERIAL PRIMARY KEY,
  language_code TEXT, -- 'de', 'en', 'fr'
  translation_key TEXT, -- 'label.employees', 'button.save'
  translation_text TEXT,
  UNIQUE(language_code, translation_key)
);
```

### Scope
- **Phase 1:** Deutsch ↔ Englisch (UI only)
- **Phase 2:** Add Français, Español
- **Phase 3:** Documents in multiple languages

### Aufwand
- Setup i18next: 4h
- UI Translations (DE/EN): 16h
- Backend i18n: 6h
- Testing: 3h
- **Total:** ~29h (per language pair: +8h)

### Roadmap
1. i18next Setup (1 Sprint)
2. DE/EN Translation (2 Sprints)
3. Additional Languages (ongoing)

---

## Feature 14: Employee Self-Service Portal

### Ziel
Self-Service für Mitarbeiter: Profil, Dokumente, Anfragen, PTO.

### Scope
- Update personal profile
- Download documents (contracts, payslips, certificates)
- Submit time-off requests
- View payroll information
- Change password / MFA
- View upcoming shifts
- Download vacation certificate

### Architektur
- **Separate React App** oder neue Tab im Admin UI
- **API:** Existing endpoints + new self-service endpoints
- **Permissions:** EMPLOYEE role restrictions

### Aufwand
- Datenmodell: 2h
- Backend API: 8h
- Frontend (React): 12h
- Tests: 3h
- **Total:** ~25h

### Roadmap
1. Backend & Permissions (1 Sprint)
2. UI (1 Sprint)

---

## Feature 15: Weitere HR-Self-Service-Funktionen

- [ ] Benefits Management (Krankenversicherung, Versicherung)
- [ ] Expense Reimbursement Self-Service
- [ ] Equipment Ordering / IT Support
- [ ] Organizational Directory
- [ ] Team Collaboration / Internal Messages
- [ ] Learning & Development Marketplace
- [ ] Internal Job Board
- [ ] Feedback & Suggestions
- [ ] Company News / Announcements
- [ ] Events & Activities

Jede weitere Funktion: 20-40h Aufwand

---

## Implementierungs-Prioritäten

### Phase 32a (Nächste Priorität)
1. **2FA** – Security (8-16h)
2. **Advanced Analytics** – Business Value (70h)
3. **i18n (DE/EN)** – International (29h)

### Phase 32b (Mittlere Priorität)
1. **Vertragsgenerator** – Core HR (79h)
2. **Performance Reviews** – Strategic (46h)
3. **SSO** – Enterprise (16-28h)

### Phase 32c (Optionale Features)
1. **AI Assistant** – Innovation (63h)
2. **Recruiting** – Growth (68h)
3. **Fuhrpark** – Vertical (34h)
4. **Training** – Development (42h)
5. **Expenses** – Finance (44h)
6. **Home Office** – Operational (26h)

---

## Kosten-Nutzen Matrix

| Feature | Aufwand | Business Value | Technical Complexity | Datenschutz |
|---------|---------|-----------------|---------------------|----|
| 2FA | 8-16h | Hoch | Niedrig | ✅ Gering |
| Advanced Analytics | 70h | Sehr Hoch | Mittel | ✅ Gering |
| Vertragsgenerator | 79h | Hoch | Hoch | ⚠️ Sehr Hoch |
| Performance Reviews | 46h | Hoch | Mittel | ✅ Mittel |
| SSO | 16-28h | Sehr Hoch | Mittel | ✅ Gering |
| Recruiting | 68h | Mittel | Mittel | ⚠️ Sehr Hoch |
| AI Assistant | 63h | Mittel | Sehr Hoch | ⚠️ Sehr Hoch |
| Fuhrpark | 34h | Niedrig | Niedrig | ✅ Mittel |
| Expenses | 44h | Mittel | Mittel | ✅ Mittel |
| Home Office | 26h | Niedrig | Niedrig | ✅ Gering |
| i18n | 29h | Mittel | Niedrig | ✅ Gering |

---

## Zusammenfassung

**Phase 32 ist eine reine Planungsphase.**

Insgesamt 15 Features mit:
- ✅ Detailliertes Datenmodell
- ✅ Permissions & RLS-Strategien
- ✅ GDPR/Datenschutz-Bewertung
- ✅ Security-Überlegungen
- ✅ Technologie-Empfehlungen
- ✅ Aufwand-Schätzungen
- ✅ Implementierungs-Roadmap

**Gesamtaufwand (alle Features):** ~800 Stunden

**Nächste Schritte:**
1. Feedback vom Geschäft (welche Features prioritär?)
2. Finanzielle Ressourcen klären
3. Rechtliche Bewertung (besonders Recruiting, Verträge)
4. Technisches Planning für Priorität 1 & 2
5. Iterative Implementierung ab Phase 33+

---

**Date:** October 24, 2026  
**Status:** Planning Complete  
**Next:** Phase 33 – Production Readiness & Launch  
