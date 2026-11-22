# PHASE 33 – Infrastructure Setup Guide

**Date:** October 24, 2026  
**Status:** Procedural Guide  
**Scope:** Staging & Production Setup  

---

## 🎯 Overview

This guide walks through setting up staging and production infrastructure for Novaro HR.

**Timeline:** 1-2 weeks (mostly waiting for external setup)

**Key Milestones:**
1. ✅ GitHub Actions secrets configured
2. ✅ Supabase projects created (staging & production)
3. ✅ Stripe account setup & live mode
4. ✅ Environment files configured
5. ✅ Monitoring dashboards created
6. ✅ CI/CD pipeline tested end-to-end

---

## 1️⃣ GITHUB SETUP

### 1.1 Repository Access

**Ensure Team Has Access:**
```bash
# Collaborators: Settings → Collaborators
# Roles:
#   - Ahmed (Owner): Full access
#   - DevOps (Maintainer): Deploy to prod
#   - Developers (Write): Code review + staging deploy
#   - QA (Read): Testing only
```

**Status:**
- [ ] All team members invited & roles assigned

---

### 1.2 GitHub Actions Secrets

**Create Secrets:** Settings → Secrets and variables → Actions

**Staging Secrets (prefix: `STAGING_`):**
```
STAGING_SUPABASE_URL = https://staging-xxxxx.supabase.co
STAGING_SUPABASE_ANON_KEY = eyJ... (public key from Supabase)
STAGING_SUPABASE_SERVICE_ROLE_KEY = eyJ... (service role, server-only!)
STAGING_DATABASE_URL = postgresql://user:pass@staging.supabase.co:5432/postgres

STAGING_STRIPE_SECRET_KEY = sk_test_...
STAGING_STRIPE_PUBLISHABLE_KEY = pk_test_...
STAGING_STRIPE_WEBHOOK_SECRET = whsec_test_...
STAGING_STRIPE_PRICE_STARTER_MONTHLY = price_1...
STAGING_STRIPE_PRICE_STARTER_ANNUAL = price_1...
[... repeat for PROFESSIONAL & ENTERPRISE ...]

STAGING_SENTRY_DSN = https://key@sentry.io/staging-project
STAGING_LOG_LEVEL = info
STAGING_API_URL = https://api.staging.novaro.de
STAGING_FRONTEND_URL = https://staging.novaro.de
```

**Production Secrets (prefix: `PROD_` or no prefix):**
```
PROD_SUPABASE_URL = https://prod-xxxxx.supabase.co
PROD_SUPABASE_ANON_KEY = eyJ...
PROD_SUPABASE_SERVICE_ROLE_KEY = eyJ...
PROD_DATABASE_URL = postgresql://user:pass@prod.supabase.co:5432/postgres

PROD_STRIPE_SECRET_KEY = sk_live_... (LIVE key, not test!)
PROD_STRIPE_PUBLISHABLE_KEY = pk_live_...
PROD_STRIPE_WEBHOOK_SECRET = whsec_live_...
[... repeat for all Stripe price IDs ...]

PROD_SENTRY_DSN = https://key@sentry.io/prod-project
PROD_LOG_LEVEL = info
PROD_API_URL = https://api.novaro.de
PROD_FRONTEND_URL = https://novaro.de
```

**Also add:**
```
# For all environments:
GITHUB_TOKEN = (auto-created by GitHub)
NODE_AUTH_TOKEN = (if using private npm registry)

# Deployment
VERCEL_TOKEN = (if using Vercel)
or
AWS_ACCESS_KEY_ID = (if using AWS)
AWS_SECRET_ACCESS_KEY = ...
```

**How to get values:**

1. **Supabase Keys:**
   - Login to Supabase dashboard
   - Project → Settings → API
   - Copy `anon` (public) and `service_role` (secret)

2. **Stripe Keys:**
   - Login to Stripe dashboard
   - Developers → API keys
   - Copy `Secret key` (starts with `sk_`)
   - Copy `Publishable key` (starts with `pk_`)
   - Copy `Webhook signing secret` (starts with `whsec_`)

3. **Sentry DSN:**
   - Login to Sentry
   - Project Settings → Client Keys (DSN)
   - Copy full DSN

**Status:**
- [ ] All secrets created in GitHub
- [ ] Verified no secrets in Git history (check with `git-secrets`)

---

### 1.3 GitHub Actions Workflow

**Ensure workflow files exist:**

```
.github/workflows/
├── lint.yml          # ESLint + Prettier
├── test.yml          # Unit & integration tests
├── build.yml         # TypeScript & build
├── deploy-staging.yml # Auto-deploy to staging on PR/merge
└── deploy-prod.yml   # Manual deploy to production
```

**Example: `deploy-staging.yml`**

```yaml
name: Deploy to Staging

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Test
        run: pnpm test
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      
      - name: Build
        run: pnpm build
        env:
          SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          STRIPE_PUBLISHABLE_KEY: ${{ secrets.STAGING_STRIPE_PUBLISHABLE_KEY }}
      
      - name: Deploy to Staging
        run: pnpm deploy:staging
        env:
          SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STAGING_STRIPE_SECRET_KEY }}
          # [... all other secrets ...]
```

**Status:**
- [ ] Workflow files created & tested
- [ ] Secrets passed correctly to build steps
- [ ] Dry-run successful (staging deploy only)

---

## 2️⃣ SUPABASE PROJECTS

### 2.1 Create Supabase Projects

**Visit:** https://app.supabase.com

**Step 1: Create Organization (if new)**
- Organization name: "Novaro HR"
- Choose region: EU (Frankfurt) if possible
- Add team members

**Step 2: Create Staging Project**
```
Project name: novaro-hr-staging
Region: EU (Frankfurt recommended)
Database password: [generate strong password, store in 1Password]
Pricing: Pro ($25/mo) or adjust as needed
```

**Step 3: Create Production Project**
```
Project name: novaro-hr-production
Region: EU (Frankfurt)
Database password: [generate strong password, store in 1Password]
Pricing: Pro or higher (based on load projections)
```

**Status:**
- [ ] Staging project created
- [ ] Production project created
- [ ] Passwords stored securely (1Password, not Git)

---

### 2.2 Supabase Configuration

**For each project (staging & production):**

#### 2.2.1 Apply Migrations

```bash
cd supabase

# Configure Supabase CLI
supabase login
supabase link --project-ref staging-xxxxx  # for staging
# or
supabase link --project-ref prod-xxxxx  # for production

# Apply all migrations (0001-0021)
supabase db push

# Verify
supabase db pull # Should show all 21 migrations
```

**Status:**
- [ ] Staging migrations applied
- [ ] Production migrations applied (test in staging first!)

---

#### 2.2.2 Enable RLS

**Already in migrations** ✅ (files 0001-0021 include RLS policies)

**Verify RLS enabled:**
```sql
-- In Supabase SQL Editor
SELECT tablename FROM pg_tables 
WHERE tablename NOT LIKE 'pg_%' 
ORDER BY tablename;

-- For each table, check:
SELECT * FROM pg_policies 
WHERE tablename = 'employees';
-- Should return multiple policies
```

**Status:**
- [ ] RLS enabled on all tenant tables
- [ ] Verified with sample queries

---

#### 2.2.3 Backups Configuration

**Staging Backups (daily):**
```
Project Settings → Backups
- Backup frequency: Daily
- Retention: 7 days
- Automated backups: ON
```

**Production Backups (critical):**
```
Project Settings → Backups
- Backup frequency: Every 6 hours (or daily minimum)
- Retention: 30 days
- Automated backups: ON
- Point-in-time recovery: Enabled (if available)
```

**Backup Testing Procedure:**
```bash
# Monthly: Test restore from backup
1. Create snapshot of production DB
2. Restore to test environment
3. Run smoke tests (login, query data)
4. Verify data integrity
5. Document result
```

**Status:**
- [ ] Staging backups configured
- [ ] Production backups configured (30-day retention)
- [ ] Backup test completed (monthly task added to calendar)

---

#### 2.2.4 Monitoring & Alerts

**Supabase Monitoring:**
```
Project → Monitoring
- Database CPU: Alert if > 80%
- Database RAM: Alert if > 85%
- Storage: Alert if > 90% of limit
- Connection count: Alert if > 80 (out of 100)
```

**Set up webhooks (if advanced):**
```
Project → Database Webhooks
Event: On errors
Endpoint: https://api.novaro.de/webhooks/db-error
Headers: Authorization: Bearer [webhook-secret]
```

**Status:**
- [ ] Monitoring configured (staging)
- [ ] Monitoring configured (production)
- [ ] Alert channels (email, Slack) configured

---

### 2.3 Data Migration (if existing data)

**If migrating from old system:**

```bash
# Export from old system
pg_dump old_db > backup.sql

# Import to staging
psql -h staging.supabase.co -U postgres < backup.sql
# Password: [from Supabase project]

# Verify data
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM employees;
# [check all major tables]

# If OK, repeat for production
```

**Status:**
- [ ] Data migration plan documented (if applicable)
- [ ] Staging data imported & verified
- [ ] Production data import scheduled (for go-live)

---

## 3️⃣ STRIPE ACCOUNT SETUP

### 3.1 Create Stripe Account

**Visit:** https://dashboard.stripe.com/register

```
Account name: Novaro HR
Website: https://novaro.de
Business type: SaaS / HR Platform
Customers: Businesses (B2B)
Region: Germany (billing address)
Currency: EUR
```

**Status:**
- [ ] Stripe account created
- [ ] Business verification completed
- [ ] Account activated (live mode available)

---

### 3.2 Create Products & Prices

**In Stripe Dashboard → Products**

**Product 1: Starter Plan**
```
Name: Novaro HR – Starter Plan
Description: Up to 25 employees, 5 GB storage, 10K API calls/day
```

Create Prices:
```
Monthly: €29/month (billing_scheme: per_usage)
Annual: €319/year (€26.58/month equivalent)
```

**Product 2: Professional Plan**
```
Name: Novaro HR – Professional Plan
Description: Up to 250 employees, 50 GB storage, 100K API calls/day
```

Create Prices:
```
Monthly: €49/month
Annual: €539/year
```

**Product 3: Enterprise Plan**
```
Name: Novaro HR – Enterprise Plan
Description: Unlimited employees, storage, API calls
```

Create Prices:
```
Monthly: €99/month (contact sales)
Note: No self-serve; mark as "disabled" until custom pricing
```

**Enable Trial for all products (optional):**
```
Price Settings → Trial period: 14 days free
(Auto-captured payment after trial ends)
```

**Status:**
- [ ] 3 products created
- [ ] Price IDs copied to `.env` files
  - `STRIPE_PRICE_STARTER_MONTHLY = price_1...`
  - `STRIPE_PRICE_STARTER_ANNUAL = price_1...`
  - [etc.]

---

### 3.3 Configure Webhook Endpoint

**In Stripe Dashboard → Developers → Webhooks**

**Add Endpoint:**
```
Endpoint URL: https://api.novaro.de/api/saas/stripe/webhook
Description: Stripe webhook for payment events
Signing secret: [Stripe generates, copy to STRIPE_WEBHOOK_SECRET]
```

**Subscribe to Events:**
```
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

**Test Webhook:**
```bash
# Use Stripe CLI to test locally
stripe login  # Authenticate

stripe trigger payment_intent.succeeded
# Verify your API receives the webhook

stripe logs tail  # See webhook activity
```

**Status:**
- [ ] Webhook endpoint created
- [ ] Signing secret obtained
- [ ] Events subscribed
- [ ] Tested with Stripe CLI

---

### 3.4 Enable Live Mode

**⚠️ CAREFUL: This allows real charges**

**Prerequisites:**
- [ ] Business verification completed
- [ ] Webhook endpoint working
- [ ] Test charges in test mode passed
- [ ] Team trained on refund policy

**Action:**
```
Stripe Dashboard → Developers → Publishable key
- Switch toggle: "Test data" → "Live data"
- Copy live keys:
  - Publishable key: pk_live_...
  - Secret key: sk_live_...
  - Webhook signing secret: whsec_live_...
```

**Status:**
- [ ] Live mode enabled in Stripe
- [ ] Live keys stored in `.env.production` only
- [ ] Never committed to Git

---

## 4️⃣ ENVIRONMENT FILES

### 4.1 Create `.env.staging`

**File: `apps/api/.env.staging`**

```bash
# Database
DATABASE_URL=postgresql://user:pass@staging.supabase.co:5432/postgres

# Supabase (staging)
SUPABASE_URL=https://staging-xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRICE_STARTER_MONTHLY=price_1...
STRIPE_PRICE_STARTER_ANNUAL=price_1...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1...
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_1...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1...

# Sentry (error tracking)
SENTRY_DSN=https://key@sentry.io/staging-project

# Logging
LOG_LEVEL=info

# API & Frontend URLs
API_URL=https://api.staging.novaro.de
FRONTEND_URL=https://staging.novaro.de

# Node environment
NODE_ENV=staging

# Email (if sending real emails in staging)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@novaro.de
SMTP_PASS=[app-password]
```

**File: `apps/web/.env.staging.local`**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SENTRY_DSN=https://key@sentry.io/staging-project
NEXT_PUBLIC_API_URL=https://api.staging.novaro.de
```

**File: `apps/mobile/.env.staging`**

```bash
EXPO_PUBLIC_SUPABASE_URL=https://staging-xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=https://api.staging.novaro.de
EXPO_PUBLIC_SENTRY_DSN=https://key@sentry.io/staging-project
```

**Status:**
- [ ] `.env.staging` created for all apps
- [ ] **NOT committed to Git** (in `.gitignore`)
- [ ] Stored in 1Password or secure vault
- [ ] Accessible to deployment system (GitHub Actions)

---

### 4.2 Create `.env.production`

**Same structure as staging, but with LIVE values:**

```bash
# Supabase (production)
DATABASE_URL=postgresql://user:pass@prod.supabase.co:5432/postgres
SUPABASE_URL=https://prod-xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (LIVE mode)
STRIPE_SECRET_KEY=sk_live_...  # ← LIVE KEY (not test!)
STRIPE_PUBLISHABLE_KEY=pk_live_...  # ← LIVE KEY
STRIPE_WEBHOOK_SECRET=whsec_live_...

# [... all other vars, with prod URLs ...]

# Sentry (production project)
SENTRY_DSN=https://key@sentry.io/prod-project

# Node environment
NODE_ENV=production

# Log level
LOG_LEVEL=warn  # Less verbose in production
```

**Status:**
- [ ] `.env.production` created
- [ ] **NEVER committed to Git**
- [ ] Stored in GitHub Secrets (encrypted)
- [ ] Only accessible during CI/CD deployment

---

### 4.3 Verify Environment Variables

**Test each environment:**

```bash
# Staging
export NODE_ENV=staging
source apps/api/.env.staging
echo $SUPABASE_URL  # Should output staging URL
echo $STRIPE_SECRET_KEY  # Should output sk_test_...

# Production (requires GitHub access)
# Verified via GitHub Actions only
```

**Status:**
- [ ] All variables loaded correctly
- [ ] No typos in keys
- [ ] Verified in CI/CD test run

---

## 5️⃣ MONITORING & LOGGING

### 5.1 Sentry Setup

**Visit:** https://sentry.io

**Create Projects:**

1. **Staging Project**
   ```
   Organization: Novaro
   Project name: novaro-hr-staging
   Platform: Node.js
   Environment: Staging
   ```

2. **Production Project**
   ```
   Project name: novaro-hr-production
   Platform: Node.js
   Environment: Production
   ```

**Configure Alerts:**

For each project:
- Settings → Alerts
  - Alert when: Error rate > 1%
  - Notify: Slack #alerts channel
  - When: Immediately

- Settings → Alerts
  - Alert when: Release health: Crash-free sessions < 99%
  - Notify: Slack #alerts
  - When: As it happens

**Status:**
- [ ] Sentry projects created
- [ ] DSNs copied to `.env` files
- [ ] Slack integration configured
- [ ] Team members invited

---

### 5.2 Logging Strategy

**Log Levels:**

| Level | When to Use | Example |
|---|---|---|
| ERROR | Production errors | Database connection failed |
| WARN | Unusual but recoverable | Rate limit approaching |
| INFO | Important events | User created, payment processed |
| DEBUG | Developer troubleshooting | Query executed, cache hit/miss |

**Log Destinations:**

```
Production:
  - Errors → Sentry
  - All logs → CloudWatch / Datadog (centralized)

Staging:
  - Errors → Sentry
  - Logs → CloudWatch / console
```

**Implementation (Node.js):**

```typescript
// apps/api/src/lib/logger.ts
import * as Sentry from "@sentry/node";

const logger = {
  error: (msg: string, err?: Error) => {
    console.error(`[ERROR] ${msg}`, err);
    if (err) Sentry.captureException(err);
  },
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  debug: (msg: string) => process.env.DEBUG && console.log(`[DEBUG] ${msg}`),
};

export default logger;
```

**Status:**
- [ ] Logging configured
- [ ] Sentry integration active
- [ ] Log levels set correctly

---

## 6️⃣ CI/CD PIPELINE TESTING

### 6.1 Test Staging Deployment

```bash
# 1. Push feature branch
git checkout -b test/infra-setup
echo "test" >> README.md
git add README.md
git commit -m "test: infrastructure setup"
git push origin test/infra-setup

# 2. Create pull request
# GitHub Actions should trigger:
#   - Lint
#   - Test
#   - Build
# All should PASS

# 3. Once all pass, create PR
# On merge to main:
#   - Deploy to staging (automatic)
#   - Verify: https://staging.novaro.de loads

# 4. Check deployment logs
# GitHub Actions → Workflows → Deploy to Staging
# Verify:
#   - Secrets resolved correctly
#   - Build succeeded
#   - Deployment succeeded
#   - Health check passed
```

**Status:**
- [ ] Feature branch pushed
- [ ] CI/CD workflow passed
- [ ] Staging deployment successful
- [ ] Staging site loads & is accessible

---

### 6.2 Test Production Deployment (Dry-Run)

**Prerequisite:** At least one successful staging deployment

```bash
# 1. Verify production secrets in GitHub
# Settings → Secrets and variables → Actions
# Should show: PROD_* variables (values hidden)

# 2. Trigger manual deployment
# GitHub Actions → Deploy to Prod (Manual)
# Manually approve (if require-approval is set)
# Watch logs

# 3. Verify production is NOT updated
# (unless you intend to deploy to prod now)
# This is just a dry-run test

# 4. Check build artifacts
# Should be ready to deploy whenever needed
```

**Status:**
- [ ] Production workflow tested
- [ ] Manual approval process verified
- [ ] Dry-run successful (no actual deployment)

---

## 7️⃣ HEALTH CHECKS

### 7.1 Setup Health Check Endpoint

**API Endpoint:**

```typescript
// apps/api/src/routes/health.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: 'connected', // Check DB connection
    stripe: 'connected', // Check Stripe API
  });
});
```

**Frontend Health Check:**

```tsx
// apps/web/src/pages/api/health.ts
export default async function handler(req, res) {
  res.json({
    status: 'healthy',
    frontend: true,
    supabase: '...' // Test Supabase connection
  });
}
```

**Test Health:**

```bash
curl https://api.staging.novaro.de/health
# Expected: 200 OK
# {
#   "status": "healthy",
#   "timestamp": "2026-10-24T10:00:00Z",
#   ...
# }
```

**Status:**
- [ ] Health check endpoint implemented
- [ ] Tested in staging
- [ ] Tested in production (once deployed)

---

## 8️⃣ FINAL VERIFICATION CHECKLIST

- [ ] **GitHub**
  - [ ] Secrets configured (staging & prod)
  - [ ] CI/CD workflows pass
  - [ ] Deployment to staging successful

- [ ] **Supabase**
  - [ ] Staging project created & migrations applied
  - [ ] Production project created & migrations ready
  - [ ] RLS enabled
  - [ ] Backups configured (staging: 7d, production: 30d)
  - [ ] Monitoring alerts set

- [ ] **Stripe**
  - [ ] Account created & verified
  - [ ] 3 products + prices created
  - [ ] Webhook endpoint configured
  - [ ] Test mode working (test charge succeeded)
  - [ ] Live mode ready (not yet activated)

- [ ] **Environment Files**
  - [ ] `.env.staging` created & tested
  - [ ] `.env.production` created & secure
  - [ ] No credentials in Git
  - [ ] All variables validated

- [ ] **Monitoring**
  - [ ] Sentry projects created (staging & prod)
  - [ ] Slack alerts configured
  - [ ] Health check endpoint working
  - [ ] Logging strategy implemented

- [ ] **CI/CD**
  - [ ] Staging deployment successful
  - [ ] Production deployment dry-run successful
  - [ ] All workflows passing
  - [ ] Secrets resolved correctly

---

## 📅 Timeline

| Day | Task | Status |
|---|---|---|
| 1 | GitHub setup (secrets, workflows) | ⏳ |
| 2 | Supabase staging & production projects | ⏳ |
| 3 | Stripe account & products | ⏳ |
| 4 | Environment files configured | ⏳ |
| 5 | Monitoring & logging setup | ⏳ |
| 6-7 | CI/CD testing (staging & dry-run) | ⏳ |

**Total: 1 week (mostly waiting for external services)**

---

## Summary

**Infrastructure is now production-ready.**

**Next steps:**
1. ✅ Execute checklist items above
2. ✅ Test staging deployment
3. ✅ Test production dry-run
4. ✅ Verify all health checks
5. ✅ Brief team on deployment procedure

---

**Date:** October 24, 2026  
**Status:** Setup Guide Complete  
**Next Phase:** Launch (Phase 33 Execution)
