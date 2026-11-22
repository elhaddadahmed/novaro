# PHASE 33 – Operational Runbook

**Date:** October 24, 2026  
**Scope:** Day-to-day operations after launch  
**Audience:** DevOps, Support, Operations team  

---

## 🎯 Overview

This runbook defines routine maintenance tasks, monitoring, and operational procedures.

**Format:** Tasks organized by frequency (Daily, Weekly, Monthly, Quarterly, Annual)

---

## 📅 DAILY TASKS (Done every weekday morning)

### 1. Morning Standup (09:00 UTC)

**Duration:** 10 minutes

**Checklist:**
- [ ] Review overnight incidents (Slack #incidents)
- [ ] Check Sentry dashboard for new errors (Critical + High severity)
- [ ] Check database performance (Supabase monitoring)
- [ ] Check backup completion status
- [ ] Review any customer support tickets (High priority)

**If issues found:**
- [ ] Escalate critical issues to on-call engineer
- [ ] Create GitHub issues for medium/low priority items

**Slack Template:**
```
📊 MORNING STANDUP [Oct 24]

✅ Status: All systems nominal

📈 Metrics (last 24h):
- Error rate: 0.4% (target < 1%)
- API p95: 287ms (target < 500ms)
- Uptime: 99.98%
- Active users: 2,847

🔔 Alerts: None
⚠️ Warnings: None

📋 Backups:
- Daily backup: ✅ Completed at 02:15 UTC
- Last restore test: Oct 18 (14 days ago)

🎯 Next: [List any planned maintenance]
```

---

### 2. Sentry Review (10:00 UTC)

**Duration:** 15 minutes

**Access:** https://sentry.io → novaro-hr-production

**Steps:**
1. [ ] Click "Issues" tab
2. [ ] Filter by "Unresolved" and "Last 24 hours"
3. [ ] Review top 10 issues by event count

**For each issue:**
- [ ] Is it a known bug? (check GitHub)
- [ ] Is it critical? (p0/p1 vs. p2/p3)
- [ ] Can we reproduce it?
- [ ] Has it been seen before?

**Actions:**
- [ ] **Critical bug:** Page on-call engineer, create hotfix
- [ ] **Known bug:** Link to GitHub issue, mark as "Unresolved" (expected)
- [ ] **New bug:** Create GitHub issue, tag as "bug"
- [ ] **Spam/false positive:** Ignore or resolve

**Slack Template (if issues found):**
```
🔴 SENTRY REPORT [Oct 24]

New Critical Issues:
- [Issue 1]: "NullPointerException in time tracking" (15 events)
  Action: Created #1234, assigned to @backend-team

New High Issues:
- [Issue 2]: "404 on /api/leave/balance" (8 events)
  Action: Likely fixed by PR #999, awaiting deploy

All other issues: Known or low priority
```

---

### 3. API Health Check (11:00 UTC)

**Duration:** 5 minutes

**Manual test:**

```bash
# Test API health endpoint
curl -s https://api.novaro.de/health | jq

# Expected response:
{
  "status": "healthy",
  "uptime": 86400,
  "database": "connected",
  "stripe": "connected",
  "cache": "connected"
}

# Test database connectivity
curl -s https://api.novaro.de/api/me \
  -H "Authorization: Bearer $TEST_TOKEN" | jq

# Test Stripe connectivity (safe test)
curl -s https://api.novaro.de/api/saas/plans | jq
# Should return 3 plans without error
```

**If any check fails:**
- [ ] Check Sentry for connection errors
- [ ] Check infrastructure status (Supabase, Stripe)
- [ ] Page on-call engineer

---

### 4. Database Connection Pool (12:00 UTC)

**Duration:** 5 minutes

**Query:**

```sql
-- Check current connections
SELECT 
  datname,
  count(*) as connections,
  max(EXTRACT(EPOCH FROM (NOW() - query_start))) as longest_query_seconds
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY datname;

-- Expected: connections < 15 (if pool size is 20)
-- If connections >= 18: Alert on-call
```

**Via Supabase Dashboard:**
- [ ] Login to Supabase
- [ ] Project → Monitoring → Connections
- [ ] Screenshot graph, save to daily log

**If pool nearly full (> 80%):**
1. [ ] Check for long-running queries
2. [ ] Kill idle connections if needed
3. [ ] Consider scaling pool size
4. [ ] Notify on-call engineer

---

### 5. Backup Verification (13:00 UTC)

**Duration:** 10 minutes

**Check backup logs:**

```bash
# If using Supabase automatic backups:
# Settings → Backups → View latest backup

# Expected: Backup completed within last 24 hours
# Size: Should be > 50 MB (actual data)

# If backup failed:
# 1. Check Supabase status page
# 2. Retry backup manually
# 3. Alert on-call engineer if repeated failures
```

**Monthly backup test:** See "Monthly Tasks" below

---

## 📆 WEEKLY TASKS (Every Monday morning)

### 1. Uptime Report (Monday 09:00 UTC)

**Duration:** 20 minutes

**Gather data:**

```bash
# From Sentry
# Dashboard → [Org] → Stats
# Record: Error rate, session count, affected users

# From Supabase
# Project → Monitoring → Database performance
# Record: Query latency p50/p95, connections

# From status page
# Calculate: Total uptime = 100% - (downtime / total time)
# Expected: > 99.5% (SLA target)
```

**Create report:**

```markdown
# Weekly Uptime Report – Week of Oct 21-27

## Summary
- **Uptime:** 99.97% (target: 99.5%) ✅
- **Downtime:** 21 minutes (2 incidents)
- **Users:** 2,847 active
- **Error rate:** 0.42% (target: < 1%) ✅

## Incidents
1. Time tracking outage (32 min) – Oct 24
   Root cause: Null pointer exception (fixed, PR #1000)
   
2. High response time (10 min) – Oct 25
   Root cause: Database load spike (temporary, autoscaled)

## Metrics
- API p95: 287ms (baseline)
- Database p95: 42ms (baseline)
- Stripe integration: 100% success rate

## Trends
- Error rate improving (0.5% → 0.42%)
- User growth: +150 users this week (+5.6%)
- No customer complaints this week ✅

## Action Items
- [ ] Review null pointer fix (code review)
- [ ] Implement additional null checks
- [ ] Consider read replicas for database

---

**Shared with:**
- Team (Slack #operations)
- Leadership (weekly standup)
- Customers (if major incidents)
```

**Slack Post:**
```
📊 WEEKLY UPTIME REPORT [Week of Oct 21-27]

✅ Uptime: 99.97% (target: 99.5%)
✅ Error rate: 0.42% (target: < 1%)
✅ No customer complaints

📈 Growth: +150 new users (+5.6%)

🔴 Incidents: 2
1. Time tracking outage (32 min) – Root cause found
2. High latency (10 min) – Temporary, autoscaled

👉 Next: Code review for null pointer fix
```

---

### 2. Security Scan (Tuesday 10:00 UTC)

**Duration:** 30 minutes

**Check for vulnerabilities:**

```bash
# 1. Dependency vulnerabilities
cd apps/api && npm audit

cd apps/web && npm audit

cd apps/mobile && npm audit

# Expected: 0 critical or high vulnerabilities
# If found: Create GitHub issue, plan upgrade

# 2. Code secrets (ensure none exposed)
git log --all --oneline -20 | head -20
# (visually inspect commits for secrets)

# Use git-secrets if available:
git secrets --scan

# 3. SSL certificate (check expiry)
openssl s_client -connect api.novaro.de:443 </dev/null 2>/dev/null | openssl x509 -noout -enddate
# Expected: Not Expiring for > 30 days
```

**If vulnerabilities found:**
1. [ ] Assess severity
2. [ ] Create GitHub issue
3. [ ] Plan upgrade (security patches in next release)

---

### 3. Database Maintenance (Wednesday 14:00 UTC)

**Duration:** 20 minutes

**Analyze & optimize:**

```sql
-- Vacuum (cleanup)
VACUUM ANALYZE;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Expected: Largest tables are companies, employees, time_entries, audit_logs
-- Sizes: < 2 GB each (typical for single instance)

-- Check slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 100  -- Queries taking > 100ms
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- If slow queries found: Consider adding index or query optimization
```

**Via Supabase:**
- [ ] Project → SQL Editor
- [ ] Run queries above
- [ ] Document findings

---

### 4. Support Ticket Review (Thursday 15:00 UTC)

**Duration:** 30 minutes

**Process:**

```
Check support email / Slack #support channel
  ↓
For each ticket:
  1. Is it urgent? (High priority customer, SLA < 4h)
  2. Is it a bug? (Create GitHub issue)
  3. Is it a feature request? (Roadmap)
  4. Is it support? (Provide answer)
  5. Is it spam? (Ignore)
  
Track:
  - Response time (target: < 1h for urgent)
  - Resolution time (target: < 24h)
  - Customer satisfaction
```

**Template response:**

```
Hi [Customer],

Thank you for reaching out. We appreciate your feedback.

Your issue: [Summarize]

What we're doing:
- [Short-term workaround, if applicable]
- [Long-term fix, if bug]
- [Timeline]

If you have any questions, feel free to reply.

Best regards,
Novaro HR Support Team
```

---

### 5. Billing Review (Friday 16:00 UTC)

**Duration:** 20 minutes

**Check Stripe activity:**

```
Visit: https://dashboard.stripe.com

1. Recent payments
   - Are all payments successful?
   - Any failed charges? (contact customers)

2. Subscription changes
   - New subscriptions? (welcome customers)
   - Cancellations? (exit survey)

3. Disputes/chargebacks
   - Any disputes? (respond immediately)

4. Refunds issued
   - Any refunds this week?

5. Revenue
   - Recurring revenue: $X,XXX
   - One-time revenue: $XXX
   - Total: $X,XXX (trend: up/down)
```

**Slack Report:**

```
💰 BILLING REPORT [Week of Oct 21-27]

✅ New subscriptions: 12 (Starter: 8, Professional: 3, Enterprise: 1)
✅ Revenue: €2,847
✅ Payment success rate: 99.8%
⚠️ Cancellations: 1 (contacted for feedback)
🔔 Failed charges: 0
🔔 Disputes: 0

📊 Trend: +€120 vs. previous week (+4.4%)
```

---

## 📊 MONTHLY TASKS (1st of every month)

### 1. Backup Restore Test (1st of month, 08:00 UTC)

**Duration:** 1-2 hours

**This is CRITICAL: Ensures backups are usable.**

**Procedure:**

```bash
# 1. Create test environment
# Supabase: Create snapshot/clone of production DB

# 2. Restore backup into test environment
# (Simulating disaster recovery)

# 3. Run smoke tests
curl -s https://test-api.novaro.de/health | jq
# Should return healthy status

# 4. Run integration tests
pnpm test:integration --env=staging
# All tests should pass

# 5. Test critical workflows
# - Create user account
# - Record time entry
# - Request leave
# - Process Stripe payment

# 6. Verify data integrity
SELECT COUNT(*) FROM employees;  -- Should match production count
SELECT COUNT(*) FROM audit_logs;  -- Should be complete

# 7. Clean up test environment
# (Delete snapshot / restore point)
```

**Documentation:**

```markdown
# Backup Restore Test – November 1, 2026

✅ Backup creation: OK (size: 287 MB)
✅ Restore procedure: OK (time: 12 minutes)
✅ Smoke tests: PASS (all 5 tests)
✅ Data integrity: OK (all row counts match)
✅ Critical workflows: OK (tested 4 workflows)

RTO (Recovery Time Objective): 20 minutes
RPO (Recovery Point Objective): 6 hours

Conclusion: Backups are HEALTHY and usable.
```

**If backup restore fails:**
1. [ ] Investigate root cause
2. [ ] Contact Supabase support (critical issue)
3. [ ] Plan alternative backup strategy
4. [ ] Page on-call engineer

---

### 2. Capacity Planning (5th of month, 10:00 UTC)

**Duration:** 30 minutes

**Review growth & scaling needs:**

```
1. User growth
   - Active users: XXX (vs. XXX last month)
   - Growth rate: X% month-over-month
   - Projection (next 6 months): XXX users

2. Data growth
   - Database size: X GB (vs. X GB last month)
   - Growth rate: X% month-over-month
   - Time to quota: X months (at current rate)

3. Traffic growth
   - API requests/day: X (vs. X last month)
   - Peak QPS: X (vs. X last month)
   - p95 latency: X ms (vs. X ms last month)

4. Scaling decisions
   - Database: Need to scale? (If > 80% of current limit)
   - API: Need more replicas? (If p95 > 500ms)
   - Storage: Need to upgrade? (If > 75% of quota)

5. Cost analysis
   - Monthly cost: €X (Supabase, Stripe, Sentry, etc.)
   - Cost per user: €X
   - Cost trend: Up/down/stable
```

**Action:**
- [ ] If scaling needed: Plan for next sprint
- [ ] If cost exceeds budget: Escalate to leadership
- [ ] Document projections for forecasting

---

### 3. Performance Analysis (10th of month, 14:00 UTC)

**Duration:** 45 minutes

**Analyze trends:**

```
From Sentry:
- Error rate trend (last 30 days)
- Response time trend (p50, p95, p99)
- Most common errors

From Supabase:
- Database query performance
- Slow queries (> 100ms)
- Connection pool utilization

From logs:
- Any patterns in errors?
- Any new failure modes?
- Any suspicious activity?

Create report:
- Baselines (from Phase 26 Performance Optimization)
- Current metrics
- Trend (improving / stable / degrading)
- Recommended actions
```

**Report template:**

```markdown
# Performance Analysis – October 2026

## Baselines (from Phase 26)
- API p95: 287ms
- DB p95: 42ms
- Error rate: < 1%

## Current Metrics (Oct 24)
- API p95: 289ms ✅ (within 1% of baseline)
- DB p95: 43ms ✅ (normal)
- Error rate: 0.42% ✅ (excellent)

## Trend
- API latency: Stable
- Error rate: Improving (0.5% → 0.42%)
- User growth: +5.6% (sustainable)

## Recommendations
- Continue monitoring
- No immediate scaling needed
- Consider read replicas in Q1 2027 (optional)
```

---

### 4. Security Audit (15th of month, 11:00 UTC)

**Duration:** 1 hour

**Comprehensive review:**

```
1. Authentication & Authorization
   - RLS policies working? (spot-check 3 policies)
   - Permissions enforced? (test as different roles)
   - Password reset working? (test flow)

2. Data Protection
   - Encryption at rest? (verify in Supabase)
   - Encryption in transit? (TLS 1.3 enforced)
   - API keys rotated? (last rotated: date?)

3. API Security
   - Rate limiting active? (test: send 100 req/s)
   - Input validation working? (test with invalid data)
   - CORS properly configured? (test from different origin)

4. Access Control
   - Service role key NOT in frontend? (grep codebase)
   - Secrets NOT in Git? (git-secrets scan)
   - Admin features behind auth? (verify)

5. Monitoring
   - Failed login attempts logged? (check audit_logs)
   - Admin actions logged? (check audit_logs)
   - Suspicious activity detected? (review Sentry)

6. Compliance
   - Privacy policy current? (reviewed this month)
   - Terms of Service current? (reviewed this month)
   - GDPR data requests handled? (reviewed this month)
```

**Document findings:**

```markdown
# Monthly Security Audit – October 15, 2026

✅ Authentication: Working correctly
✅ Authorization: RLS enforced on all tables
✅ Encryption: AES-256 at rest, TLS 1.3 in transit
✅ API security: Rate limiting active, input validation working
✅ Access control: No secrets exposed, service role protected
✅ Monitoring: 247 failed login attempts logged (normal)
✅ Compliance: Privacy policy current, no GDPR requests pending

🔍 Findings: None
⚠️ Warnings: None

Conclusion: Security posture is HEALTHY.
```

---

### 5. License & Compliance Check (20th of month, 09:00 UTC)

**Duration:** 30 minutes

**Review all third-party services:**

```
1. Supabase
   - Plan: [Pro, Team, etc.]
   - Usage: [Data: X GB, API calls: X, etc.]
   - Invoice: [Amount due, due date]
   - License: [Self-hosted or SaaS - terms OK?]

2. Stripe
   - Plan: [Standard rate: 2.9% + $0.30]
   - Monthly volume: [X transactions, $X revenue]
   - License: [Standard terms OK?]

3. Sentry
   - Plan: [Team, Business, etc.]
   - Events captured: [X events/month]
   - License: [Terms OK?]

4. GitHub / GitLab
   - Plan: [Pro, Team, Enterprise, etc.]
   - Seats: [X team members]
   - License: [Terms OK?]

5. Domains & certificates
   - novaro.de: Expires [Date] (renew 30 days before)
   - novaro-hr.com: Expires [Date]
   - TLS certificate: Expires [Date] (auto-renewal configured)

6. All open-source dependencies
   - Licenses: All compatible with Apache 2.0?
   - No GPL or AGPL (unless OK)?
   - No proprietary (unless purchased)?
```

**Action:**
- [ ] All invoices approved & paid
- [ ] All licenses compliant
- [ ] All renewals scheduled (30+ days out)

---

## 🔄 QUARTERLY TASKS (Every 3 months)

### 1. Disaster Recovery Drill (Q1, Q2, Q3, Q4)

**Duration:** 2-3 hours (scheduled weekend, no customer impact)

**Scenario:** Complete production database corruption

**Steps:**
1. [ ] Create snapshot of production database
2. [ ] Simulate data loss (delete some records)
3. [ ] Restore from backup (test environment)
4. [ ] Verify recovery (all data intact)
5. [ ] Calculate RTO/RPO
6. [ ] Document procedures
7. [ ] Cleanup

**Report:**
```markdown
# Quarterly DR Drill – Q1 2026

Scenario: Production database corruption (3 days old)

Timeline:
- Disaster detected: T+0
- Backup identified: T+5 min
- Restore started: T+10 min
- Restore completed: T+25 min (recovery time)
- Verification passed: T+35 min

RTO: 35 minutes
RPO: 6 hours (last backup was 6h before disaster)

Lessons learned:
1. Restore process is smooth
2. Backups are reliable
3. Consider Point-in-Time Recovery for critical scenarios

Recommendation: Keep current DR strategy
```

---

### 2. Load Test (Q2, Q4)

**Duration:** 3 hours

**Scenario:** 10x normal peak traffic for 30 minutes

```bash
# Use k6 to simulate load
k6 run tests/load/production-load-test.js \
  --vus 5000 \
  --duration 30m \
  --ramp-up 5m \
  --ramp-down 5m

# Monitor during test:
# - API response times (p95, p99)
# - Database connections
# - Error rate
# - Stripe API quota usage
```

**Expected results:**
- API p95 < 1000ms (even under load)
- Error rate < 1%
- Database connections < 20 (out of 30 pool size)
- No failed Stripe requests

**Document findings & scaling recommendations**

---

### 3. Security Penetration Test (Q2 minimum, Q4 recommended)

**Duration:** 1-2 weeks (external firm)

**Scope:**
- API authentication & authorization
- SQL injection, XSS, CSRF
- RLS bypasses (multi-tenancy isolation)
- Business logic flaws
- Data exposure risks

**Deliverable:** Penetration test report with findings & recommendations

---

## 🎯 ANNUAL TASKS

### 1. Compliance Audit (January or Q1)

**Full GDPR / DSGVO review:**
- Data processing
- Retention policies
- Breach notification
- Data subject rights
- Incident response

**Update documentation:**
- Privacy Policy
- Terms of Service
- RRPA (Record of Processing)
- Incident response procedures

---

### 2. Architecture Review (February or Q1)

**Assess current architecture:**
- Is current design still optimal?
- Any technical debt accumulating?
- Any scalability concerns?
- Recommended improvements?

**Plan for next year:**
- Major features
- Technology upgrades
- Infrastructure improvements

---

## 🆘 TROUBLESHOOTING QUICK REFERENCE

### API Returns 503 (Service Unavailable)

```bash
# 1. Check Supabase status
curl https://status.supabase.com  # Should be operational

# 2. Check database connections
SELECT count(*) FROM pg_stat_activity;
# If > 25: Connection pool exhausted

# 3. Check API server logs
kubectl logs deployment/api -f  # View real-time logs

# 4. Restart API servers (if safe)
kubectl rollout restart deployment/api

# 5. If still failing: Rollback last deployment
git revert <last-commit>
git push
```

### High Error Rate (> 5%)

```bash
# 1. Check Sentry for error pattern
# https://sentry.io → novaro-hr-production

# 2. Look for:
# - NullPointerException (missing null checks)
# - ConnectionError (database issue)
# - TimeoutError (slow queries)
# - ValidationError (bad input)

# 3. Check recent deployments
git log --oneline -5

# 4. If error caused by recent deploy: Rollback
git revert <commit>
git push
```

### Database Slow (p95 > 500ms)

```sql
-- Check slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC 
LIMIT 5;

-- Check table sizes
SELECT * FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;

-- Check missing indexes
SELECT * FROM pg_stat_user_indexes 
WHERE idx_scan = 0;  -- Unused indexes
```

### Stripe Webhook Failures

```bash
# 1. Check Stripe webhook logs
# https://dashboard.stripe.com → Developers → Webhooks

# 2. Look for:
# - HTTP 5xx errors (API server down)
# - Timeouts (API slow)
# - Missing signature validation

# 3. Check API logs
kubectl logs deployment/api | grep stripe

# 4. Test webhook manually
curl -X POST https://api.novaro.de/api/saas/stripe/webhook \
  -H "Stripe-Signature: ..." \
  -d '{...}'
```

---

## Summary

**Operational tasks ensure smooth production:**

| Frequency | Tasks | Time |
|---|---|---|
| **Daily** | Standup, Sentry, Health check, Pool check, Backup verify | 1h |
| **Weekly** | Uptime report, Security scan, DB maintenance, Support, Billing | 2h |
| **Monthly** | Backup test, Capacity planning, Performance, Security, Compliance | 4h |
| **Quarterly** | DR drill, Load test, Pen test | 8h |
| **Annual** | Compliance audit, Architecture review | 16h |

**Total monthly burden: ~10-15 hours (reasonable for small team)**

---

**Date:** October 24, 2026  
**Version:** 1.0  
**Next Review:** After first month of production (November 24, 2026)
