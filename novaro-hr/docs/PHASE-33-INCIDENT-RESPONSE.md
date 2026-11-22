# PHASE 33 – Incident Response Plan

**Date:** October 24, 2026  
**Status:** Framework Complete  
**Scope:** How to handle production incidents  

---

## 🎯 Overview

This document defines how the team responds to production incidents.

**Goal:** Minimize downtime, prevent data loss, maintain transparency.

**Key Principles:**
1. ✅ Fast detection (automated alerts)
2. ✅ Clear communication (internal + external)
3. ✅ Structured response (severity-based)
4. ✅ Rapid mitigation (rollback or hotfix)
5. ✅ Post-incident review (learning)

---

## 1️⃣ INCIDENT SEVERITY LEVELS

### Severity 1 – CRITICAL (Immediate Rollback)

**Definition:** Service is completely unavailable or data is at risk.

**Examples:**
- API returns 503 (Service Unavailable)
- Payment processing failing (Stripe disconnected)
- RLS bypass (unauthorized data access)
- Database corruption or connection pooling exhausted
- Unencrypted data exposed

**Impact:**
- All users affected
- Revenue impact (payments blocked)
- Potential data breach

**Response Time:** < 15 minutes

**Actions:**
1. [ ] Declare Severity 1 incident
2. [ ] Page on-call engineer (PagerDuty, if available)
3. [ ] **Immediate rollback** to last known good version
4. [ ] Verify service recovered
5. [ ] Notify customers (status page: "Major Outage")
6. [ ] Investigate root cause (after recovery)
7. [ ] Post-incident review (within 24 hours)

**Escalation Path:**
```
On-Call Engineer → Team Lead → CTO → Customers (via status page)
```

**Communication:**
- Slack: #incidents (every 5 minutes)
- Status Page: "Investigating" → "Resolved"
- Email: Optional (only if outage > 30 minutes)

---

### Severity 2 – HIGH (Immediate Hotfix)

**Definition:** Significant feature broken or performance degraded.

**Examples:**
- Time tracking not recording
- Leave approval workflow stuck
- Auth occasionally failing (intermittent)
- Response time p95 > 2000ms (from 287ms baseline)
- Email notifications not sending
- Scheduled jobs failing

**Impact:**
- Most users can't complete critical workflows
- App is usable but with workarounds
- Potential revenue impact if unfixed > 4 hours

**Response Time:** < 1 hour

**Actions:**
1. [ ] Declare Severity 2 incident
2. [ ] Form incident response team (3-5 people)
3. [ ] Investigate root cause (in parallel with workaround)
4. [ ] Implement hotfix (if safe)
5. [ ] Test in staging first
6. [ ] Deploy to production (with monitoring)
7. [ ] Monitor for 30 minutes (no regression)
8. [ ] Communicate status to stakeholders
9. [ ] Post-incident review (within 48 hours)

**Escalation Path:**
```
Senior Developer → Team Lead → Notify stakeholders
```

**Communication:**
- Slack: #incidents (every 15 minutes)
- Status Page: "Degraded" (optional)

---

### Severity 3 – MEDIUM (Plan Next Hotfix)

**Definition:** Minor feature broken or degraded performance.

**Examples:**
- Non-critical UI bug (e.g., button styling)
- Performance degradation (p95 500-2000ms, but acceptable)
- Email sending delayed (but eventually sent)
- Report export timing out (but still available via API)

**Impact:**
- Users can work around the issue
- No immediate business impact

**Response Time:** < 4 hours (business hours)

**Actions:**
1. [ ] Log ticket in project management
2. [ ] Investigate (low priority)
3. [ ] Plan hotfix for next deployment window
4. [ ] No urgent communication needed (unless affects many users)

**Escalation Path:**
```
Developer → Team Lead (if affecting many users)
```

---

### Severity 4 – LOW (Plan for Next Release)

**Definition:** Cosmetic issue or very minor feature gap.

**Examples:**
- Typo in UI
- Inconsistent spacing/styling
- Missing i18n translation

**Impact:** None

**Response Time:** Next release cycle

**Actions:**
1. [ ] Create GitHub issue
2. [ ] Tag as `low-priority`
3. [ ] Plan for next regular release

---

## 2️⃣ INCIDENT RESPONSE TEAM

### Roles & On-Call Rotation

**Define roles (update monthly):**

| Role | Responsible For | Contact |
|---|---|---|
| **On-Call Engineer** | Initial detection, triage, declare severity | Phone + Slack |
| **API/Backend Lead** | Database, API issues, hotfixes | Slack |
| **Frontend Lead** | Web app, mobile app issues | Slack |
| **DevOps/Infrastructure** | Deployments, rollbacks, monitoring | Slack |
| **Product Lead** | Customer communication, business impact | Email |
| **CEO/Executive** | Escalation (Severity 1 only) | Phone |

**On-Call Schedule (Example):**
```
Week 1 (Oct 24-30):  Ahmed (primary), DevOps (backup)
Week 2 (Oct 31-Nov6): Frontend Lead (primary), API Lead (backup)
Week 3 (Nov 7-13):   API Lead (primary), Frontend Lead (backup)
Week 4 (Nov 14-20):  DevOps (primary), Ahmed (backup)
```

**On-Call Tools:**
- [ ] PagerDuty (or similar) configured
- [ ] Phone numbers & Slack handles in on-call rotation
- [ ] Escalation rules configured (Severity 1 → page phone)

---

### Incident Commander Role

**For Severity 1-2 incidents:**

Appoint an **Incident Commander** (IC):
- Not necessarily the person fixing the issue
- Owns communication and status updates
- Coordinates between teams
- Ensures no one is blocked

**IC Responsibilities:**
1. [ ] Update Slack #incidents every 5-15 minutes
2. [ ] Update status page
3. [ ] Track timeline of events
4. [ ] Note key decisions made
5. [ ] Ensure customer communication

**Example Slack Updates:**
```
🔴 SEVERITY 1 – Time Tracking Down (11:45 UTC)

🔍 Status: Investigating database connection pool exhaustion

⏱️ Duration: 8 minutes

🎯 Next: Rolling back to commit abc123 (expected 11:50 UTC)

Customers: Affected ~15% (users in EU region)

🔗 Status page: https://status.novaro.de
```

---

## 3️⃣ INCIDENT DETECTION & ALERT

### Automated Monitoring

**Alerts configured (Sentry, Supabase, custom):**

| Alert | Threshold | Notify | Action |
|---|---|---|---|
| **Error Rate** | > 1% | Slack #alerts | Investigate |
| **Response Time (p95)** | > 1000ms (from 287ms) | Slack #alerts | Scale/investigate |
| **Database Connection Pool** | > 80% utilized | Slack #alerts | Scale connections |
| **Storage** | > 90% of quota | Slack #alerts | Clean up / upgrade |
| **SSL Certificate** | Expires in 60 days | Email | Renew |
| **Failed Deployments** | Any | #incidents | Rollback? |
| **Unhandled Exceptions** | Any | Sentry + Slack | Immediate investigation |
| **Stripe Webhook Failures** | 5+ in 5 min | #incidents | Investigate integration |

**Status Page Integration:**
- Sentry error rate > 1% → Automatically update status page to "Degraded"
- Manual update for maintenance windows

---

### Manual Detection

**If automated monitoring fails:**

1. **User Reports** (email, Slack)
   - Respond within 5 minutes: "We're investigating"
   - Add to #incidents channel

2. **Internal Testing**
   - Deploy smoke tests to production
   - Alert if any test fails

3. **Peer Monitoring**
   - During business hours: Someone watches #incidents
   - Out of hours: On-call engineer reviews logs hourly

---

## 4️⃣ INCIDENT RESPONSE WORKFLOW

### Phase 1: DETECTION (T+0)

```
Alert triggered
    ↓
On-call engineer notified (Slack + phone for Severity 1)
    ↓
Engineer confirms incident (not false alarm)
    ↓
Declare severity (S1, S2, S3, S4)
```

**Checklist:**
- [ ] **Verify it's a real incident** (not monitoring glitch)
  - Check Sentry: Are errors actually increasing?
  - Check status page: Is API actually down?
  - Test manually: Try to reproduce issue
  
- [ ] **Identify scope:**
  - How many users affected? (all, region, feature)
  - What functionality broken? (time tracking, leave, login?)
  - How long has it been down? (1 min, 10 min, 1 hour)

- [ ] **Declare severity** (1-4 based on impact)

**Slack Message:**
```
🔴 INCIDENT DECLARED – Severity [1/2/3]
Affected: [What's broken]
Scope: [How many users affected]
Duration: [How long]
Next: [Investigating / Hotfixing / Rolling back]
```

---

### Phase 2: TRIAGE (T+5 min)

```
Incident declared
    ↓
Gather information (logs, metrics, recent changes)
    ↓
Identify probable root cause
    ↓
Decide: Rollback vs Hotfix
```

**Actions:**
1. [ ] **Check recent deployments**
   ```bash
   git log --oneline -10  # What was deployed recently?
   git diff HEAD~1 HEAD   # What changed?
   ```

2. [ ] **Check Sentry for error patterns**
   - Is error new? (probably caused by recent deploy)
   - Is error old? (probably infrastructure issue)

3. [ ] **Check Supabase logs**
   - Connection pool status
   - Slow queries
   - Replication lag

4. [ ] **Check metrics**
   - CPU/RAM usage
   - Network latency
   - Database performance

5. [ ] **Decision tree:**
   ```
   Q: Was incident triggered by recent deployment?
   A: Yes → Rollback (fastest resolution)
   A: No → Hotfix or infrastructure scaling
   
   Q: Is service fully down or partially degraded?
   A: Fully down → Rollback first, investigate later
   A: Degraded → Hotfix is safer
   ```

**Slack Update:**
```
🔍 INVESTIGATING
Probable cause: [DB connection pool / recent deploy / infrastructure]
Checking: [Sentry / deployment history / metrics]
Next step: [Rollback / Hotfix / Scale]
ETA: [5 / 10 / 15 minutes]
```

---

### Phase 3: MITIGATION (T+10-30 min)

#### Option A: Rollback

**When to use:** Service-breaking bug introduced in recent commit

```bash
# 1. Identify the bad commit
git log --oneline -10
# Sample output:
# abc123 (HEAD) Deploy: Add geofencing feature
# def456 Deploy: Stripe webhook fix
# ghi789 Fix: Time tracking bug

# 2. Decide: Roll back to ghi789 or def456?
# General rule: Roll back 1 commit at a time (safer)

# 3. Create rollback commit
git revert abc123  # Creates new commit that undoes abc123
# or
git reset --hard def456  # Hard reset to def456

# 4. Push to production
git push origin main --force  # (with approval if CI enforces)

# 5. Monitor
# Watch Sentry for errors (should drop)
# Watch response time (should improve)
# Wait 2 minutes for confirmation
```

**Status Communication:**
```
🔧 MITIGATING
Action: Rolling back to [previous version]
Timeline: 2-3 minutes to deploy
Monitoring: Errors should drop, response time should improve
```

**Post-Rollback:**
1. [ ] Error rate drops below 1%?
2. [ ] Service restored?
3. [ ] Declare incident RESOLVED
4. [ ] Schedule post-incident review

---

#### Option B: Hotfix

**When to use:** Infrastructure issue or minor bug (safe to fix forward)

```bash
# 1. Create feature branch
git checkout -b hotfix/time-tracking-null-error

# 2. Identify & fix the bug
# (e.g., missing null check causing crash)
vim apps/api/src/routes/time.ts

# 3. Test locally
pnpm test --match "*time*"  # Should pass

# 4. Commit & push
git add .
git commit -m "hotfix: Handle null duration in time tracking"
git push origin hotfix/time-tracking-null-error

# 5. Create pull request (fast-tracked)
# GitHub: Create PR, mark as "hotfix"
# Required reviewers: 1 person (not 2, for speed)

# 6. Merge & deploy (once approved)
git merge hotfix/time-tracking-null-error
git push origin main

# 7. Monitor
# Watch Sentry (errors should drop)
# Watch response time
# Wait 2 minutes for confirmation
```

**Pre-Hotfix Checklist:**
- [ ] Root cause clearly identified
- [ ] Fix is < 50 lines of code (small = safe)
- [ ] Fix tested locally (not just code review)
- [ ] Risk of hotfix < risk of continued outage

**Status Communication:**
```
🔧 MITIGATING
Action: Deploying hotfix to [affected feature]
Risk: Low (small change, thoroughly tested)
Timeline: 3-5 minutes to deploy
Monitoring: Errors should drop within 30 seconds
```

---

#### Option C: Infrastructure Scaling

**When to use:** High load or resource exhaustion

```bash
# Supabase: Increase connection pool
# AWS RDS: Scale up instance size
# Stripe: N/A (they handle scaling)

# 1. In Supabase dashboard:
# Settings → Database → Connection pooling
# Increase pool size from 15 → 25 connections

# 2. Deploy change to code (if using env var)
# Redeploy or restart API servers

# 3. Monitor connection pool utilization
# Should drop from 100% → 50%

# 4. Gradually decrease pool back to normal
# (avoid over-provisioning)
```

**Status Communication:**
```
🔧 MITIGATING
Action: Scaling database connections (15 → 25)
Timeline: Immediate
Monitoring: Connection pool utilization should drop to 50%
```

---

### Phase 4: RECOVERY (T+30-60 min)

```
Issue mitigated (rollback/hotfix/scaled)
    ↓
Error rate normal? ✅
Response time normal? ✅
Users can work? ✅
    ↓
DECLARE RESOLVED
    ↓
Status page → "Resolved"
Notify customers (email optional)
```

**Verification Checklist:**
- [ ] Sentry error rate < 0.5% (normal)
- [ ] API response time p95 < 500ms (baseline)
- [ ] Smoke tests passing
- [ ] Can complete critical workflows (login, time tracking, etc.)
- [ ] No new errors introduced by fix

**Slack Final Update:**
```
✅ INCIDENT RESOLVED (T+32 minutes)

Root cause: [Description]
Mitigation: [Rollback / Hotfix / Scale]
Impact: [Number of minutes, affected users]

🔍 Post-incident review: [Tomorrow 10 AM] (link to calendar)
```

**Notify Customers:**
```
Subject: [RESOLVED] Time Tracking Outage

We experienced an outage from 11:45 UTC to 12:17 UTC (32 minutes).

Root cause: [Brief explanation]
What we did: [Rolled back / deployed hotfix]
Impact: ~5% of users in EU region were affected

We apologize for the inconvenience and will improve our monitoring
to catch similar issues faster.

[Link to post-incident review details]
```

---

### Phase 5: POST-INCIDENT REVIEW (T+24 hours)

**Schedule meeting within 24 hours (while memories are fresh)**

**Attendees:**
- On-call engineer
- Incident commander
- Developer(s) who deployed problematic code
- Team lead
- (Optional) Customer success / product

**Agenda:**
1. **Timeline** (5 min)
   - What happened, step by step
   - How long each phase took

2. **Root Cause Analysis** (10 min)
   - Why did the issue occur?
   - What could have prevented it?
   - (Avoid blame – focus on systems)

3. **Impact Assessment** (5 min)
   - How many users affected?
   - How long were they affected?
   - Revenue impact (if any)?

4. **Action Items** (10 min)
   - What will we do differently next time?
   - New monitoring needed?
   - Additional tests?
   - Documentation updates?

**Sample Action Items:**
- [ ] Add unit test for null duration handling
- [ ] Add integration test for time tracking API
- [ ] Set up alert for connection pool > 80%
- [ ] Review recent deployments for similar issues
- [ ] Update runbook with this scenario

**Document & Share:**
- Slack: Post summary in #incidents
- Wiki: Link to post-incident report
- GitHub: Create issues for action items

**Example Report:**

```markdown
# Post-Incident Review – Time Tracking Outage

**Date:** October 24, 2026, 11:45-12:17 UTC (32 minutes)
**Severity:** 2 (High)
**Impact:** 5% of users (EU region) affected

## Timeline
- 11:45 UTC: Error rate spike detected (Sentry alert)
- 11:48 UTC: On-call engineer investigates, identifies recent deploy
- 11:50 UTC: Rollback initiated
- 11:52 UTC: Service recovered (error rate < 0.5%)
- 12:17 UTC: Declared fully resolved

## Root Cause
Commit abc123 added null-pointer dereference in time tracking API.
Code change reviewed but test coverage was insufficient.
No unit test caught the bug before deployment.

## What Worked Well
✅ Alert triggered immediately (within 30 seconds)
✅ Root cause identified quickly (3 min)
✅ Rollback process smooth (2 min)
✅ Communication kept stakeholders informed

## What Needs Improvement
⚠️ Unit tests didn't cover null duration case
⚠️ Staging data didn't match production edge case
⚠️ Code review didn't flag missing null check

## Action Items
1. [ ] Add unit test for `calculateTimeWorked()` with null duration
2. [ ] Add integration test for time tracking API with edge cases
3. [ ] Update code review checklist (null safety section)
4. [ ] Review all recent commits for similar issues
5. [ ] Schedule bug-bash session next week

## Lessons Learned
- Test staging deployments thoroughly before production
- Null safety is critical in HR software (never assume data exists)
- Rollbacks are faster than hotfixes (prepare in advance)
```

---

## 5️⃣ COMMUNICATION TEMPLATES

### Slack #incidents Template

```
[INCIDENT DECLARED]
🔴 Severity: [1/2/3]
📍 Affected: [Feature/Service]
👥 Scope: [~X users / ~X% of traffic]
⏱️ Duration: [X minutes since start]
🔍 Status: [Investigating / Hotfixing / Rolling back]
📊 Next update: [In X minutes]
🔗 Status page: https://status.novaro.de

👤 Incident Commander: @[Name]
🛠️ On-Call: @[Name]
```

### Status Page Template

```
[🟡 INVESTIGATING] Time Tracking Service

We're aware of issues with time tracking and are investigating.
Approximately 5% of users in the EU are affected.

Latest update: 11:50 UTC
ETA for resolution: 12:00 UTC

[Status page updates every 5 minutes]
```

### Customer Email (Resolution)

```
Subject: [RESOLVED] Time Tracking Outage – October 24

Dear Valued Customers,

We experienced a brief outage of our time tracking service from 
11:45 UTC to 12:17 UTC today (32 minutes).

WHAT HAPPENED:
A recent code change introduced a bug that caused crashes when 
recording time entries. Our monitoring detected the issue within 
30 seconds and we rolled back the deployment immediately.

WHO WAS AFFECTED:
Approximately 5% of our users in the EU region were unable to 
record time during this window.

HOW WE'LL PREVENT THIS:
- We're adding additional tests to our CI/CD pipeline
- Code review process will be strengthened
- Monitoring will be enhanced

We sincerely apologize for the inconvenience. If you have any 
questions, please don't hesitate to reach out.

Best regards,
Novaro HR Team
```

---

## 6️⃣ ESCALATION PROCEDURES

### Severity 1 Escalation Path

```
Alert fired
    ↓
On-call engineer (Slack + phone page)
    ↓
If not resolved in 5 min: Page Team Lead (phone)
    ↓
If not resolved in 10 min: Page CTO (phone)
    ↓
If not resolved in 15 min: Conference call with all above
    ↓
If not resolved in 30 min: Notify CEO (phone)
```

### Severity 2 Escalation Path

```
Alert fired
    ↓
On-call engineer (Slack)
    ↓
If not resolved in 30 min: Escalate to Team Lead (Slack)
    ↓
If not resolved in 60 min: Notify stakeholders (Slack)
```

---

## 7️⃣ RUNBOOK

### Quick Reference

**Severity 1 – Service Down**
1. [ ] Confirm incident (not false alarm)
2. [ ] Page on-call team
3. [ ] **Rollback** (fastest recovery)
4. [ ] Verify service recovered
5. [ ] Notify customers
6. [ ] Post-incident review (24h later)

**Severity 2 – Feature Broken**
1. [ ] Investigate root cause
2. [ ] Decision: Rollback or hotfix?
3. [ ] If rollback: Follow Severity 1 steps 3-4
4. [ ] If hotfix: Create PR, test, deploy
5. [ ] Monitor for 30 minutes
6. [ ] Communicate status
7. [ ] Post-incident review (48h later)

**Database Issue**
```bash
# Check connection pool
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections (if needed)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < NOW() - INTERVAL '1 hour';

# Increase pool size (Supabase dashboard)
Settings → Database → Connection pooling → Increase limit

# Restart app servers
kubectl rollout restart deployment/api
```

**High Error Rate**
```bash
# Check Sentry
# Identify error pattern

# Option A: Rollback (if caused by recent deploy)
git revert <commit>
git push

# Option B: Hotfix (if safe)
# Create PR, test, merge, deploy

# Option C: Scale (if resource exhaustion)
# Increase database connections / app replicas
```

---

## ✅ PRE-LAUNCH CHECKLIST

- [ ] Incident severity levels understood by team
- [ ] On-call rotation configured (PagerDuty or similar)
- [ ] Phone numbers & Slack handles in on-call setup
- [ ] Automated alerts configured (Sentry, Supabase, custom)
- [ ] Status page integrated with monitoring
- [ ] Rollback procedure tested (in staging)
- [ ] Communication templates prepared
- [ ] Post-incident review process documented
- [ ] Team trained on incident response

---

## Summary

**Incident response process is documented and ready.**

**Critical success factors:**
1. ✅ Fast detection (automated alerts)
2. ✅ Clear severity classification
3. ✅ Structured response (phases)
4. ✅ Communication templates
5. ✅ Post-incident learning (not blame)

---

**Date:** October 24, 2026  
**Version:** 1.0  
**Next Review:** After first incident or monthly (whichever comes first)
