# PHASE 30 – GO-LIVE PLAYBOOK

**Launch Date:** TBD (Late November 2026, pending legal approval)  
**Time:** 09:00 UTC  
**Duration:** 2 hours (monitoring window)  
**Team:** Release Manager, Backend Lead, DevOps, Support Lead

---

## PRE-LAUNCH (1 Week Before)

### Day -7: Final Checks

```
□ Verify DNS records pointing to production
□ Confirm Supabase production project healthy
□ Verify all GitHub Actions secrets configured
□ Test CI/CD pipeline on staging one final time
□ Confirm Sentry production project ready
□ Verify Cloud Logging alerts configured
□ Test backup restore procedure
□ Brief support team on launch day
□ Prepare rollback plan documentation
```

### Day -3: Communication

```
□ Notify all stakeholders: "Launch scheduled for Day 0"
□ Prepare announcement email (ready to send)
□ Prepare social media post (ready to publish)
□ Prepare internal chat announcement (ready to post)
□ Setup support ticket template for post-launch issues
□ Brief leadership on launch timeline
```

### Day -1: Final Staging

```
□ Deploy v1.0.0 to staging
□ Run full smoke test suite on staging
□ Test all critical user journeys:
   - Employee login + time tracking
   - Manager leave approval
   - Document download
   - Geofencing QR scan
□ Verify Sentry staging integration
□ Verify Cloud Logging staging integration
□ Take database backup (test restore one more time)
□ Get sign-off from QA lead
```

---

## LAUNCH DAY (Day 0)

### 08:00 UTC: Pre-Launch Meeting

**Attendees:** Release Manager, Backend Lead, DevOps, Support Lead

```
Agenda (15 min):
□ Confirm all systems healthy
□ Review rollback procedure
□ Assign roles for launch window:
  - Release Manager: Overall coordination
  - DevOps: Monitor Cloud Run, databases
  - Backend Lead: Monitor Sentry for errors
  - Support Lead: Monitor email for issues
□ Confirm communication channels (Slack, incident channel)
□ Final readiness check: GO / NO-GO
```

### 08:30 UTC: Final Health Checks

**Backend Team - 10 minutes:**

```bash
# Verify API is responding
curl -I https://api.staging.novaro-hr.de/health
# Expected: 200 OK

# Verify Supabase connection
curl -I https://xxxxx.supabase.co/rest/v1/health
# Expected: 200 OK

# Verify database
SELECT COUNT(*) FROM audit_logs;
# Expected: >100K rows

# Verify backups
SELECT * FROM backup_log ORDER BY created_at DESC LIMIT 1;
# Expected: Last backup <24 hours ago
```

**Frontend Team - 5 minutes:**

```bash
# Test app can reach API
curl https://api.staging.novaro-hr.de/api/employees?limit=1
# Expected: 200 OK + sample employees

# Verify Sentry DSN
echo $SENTRY_DSN
# Expected: Valid DSN (redacted)
```

### 08:45 UTC: Release Manager Approval

```
Release Manager signs off:
□ All systems healthy
□ All teams ready
□ Rollback plan confirmed
□ Communication channels open

Status: APPROVED FOR LAUNCH
```

### 09:00 UTC: LAUNCH!

**DevOps – Switch Traffic to Production (10 min)**

```bash
# 1. Verify production Cloud Run healthy
gcloud run describe novaro-hr --region europe-west1 --format='value(status.conditions[0].status)'
# Expected: True

# 2. Update load balancer to production backend
gcloud compute backend-services update novaro-hr-lb \
  --global \
  --network-endpoint-group-name novaro-hr-prod-neg

# 3. Monitor health checks
gcloud compute health-checks describe novaro-hr-health \
  --format='value(checkIntervalSec, timeoutSec)'

# 4. Verify DNS resolves to production IP
dig api.novaro-hr.de +short
# Expected: Production IP address
```

**Timeline:**
- 09:00 – DNS updated to production
- 09:05 – First production requests received
- 09:10 – All health checks passing

### 09:10 UTC: Release Announcement

**Release Manager – Send Communications**

```
Email Subject: "Novaro HR now live!"

Email Body:
"Welcome to Novaro HR! The platform is now available at:
- Web: https://app.novaro-hr.de
- Mobile: Available in App Store / Google Play
- Support: support@novaro-hr.de

Getting started:
1. Log in with your email
2. Complete your profile
3. Clock in for the first time

Thank you!"

Post to:
□ Email (all users)
□ Slack #announcements
□ Twitter @novaro_hr
□ Website homepage
```

### 09:10-11:00 UTC: CRITICAL MONITORING WINDOW

**Every 5 Minutes:**

```
Checklist (Rotate among team):

□ Sentry Dashboard
  - Check crash rate (should be 0-0.5%)
  - Check error rate (should be 0-1%)
  - Look for NEW error types

□ Cloud Logging
  - Check for unusual 5xx errors
  - Check authentication failures
  - Look for rate limit spikes

□ API Metrics
  - Response time (should be <500ms p95)
  - Request volume (should be ramping up)
  - Error rate per endpoint

□ Database Health
  - Active connections (should be <50)
  - Slow queries (should be none)
  - Replication lag (should be <1s)

□ Infrastructure
  - Cloud Run CPU (should be <40%)
  - Cloud Run Memory (should be <50%)
  - Network latency (should be <50ms)

□ User Reports
  - Email: Any issues?
  - Slack: Any complaints?
  - Support tickets: Any recurring issues?

If CRITICAL issue found:
  → Ring alarm (in Slack: @Release-Manager)
  → Assess severity (1=minor, 5=critical)
  → Consider rollback? (YES if severity ≥ 4)
```

**09:20 UTC: First Users Report Success**

```
Expected Slack messages:
"✅ Login works!"
"✅ Time tracking appears in app"
"✅ Dashboard loading"

If NOT received by 09:25:
  → Check if app actually received traffic
  → Check API logs for auth errors
  → Consider rollback
```

**09:30 UTC: 30-Minute Checkpoint**

```
Release Manager decision point:
□ No critical issues → Continue monitoring
□ Minor issues found → Document, continue
□ Critical issue found → Initiate rollback

Decision: GO (continue) / ABORT (rollback)
```

---

## ISSUES & ESCALATION

### Severity 1 (Critical - Immediate Rollback)

**Examples:**
- All login requests failing (5xx)
- All time entries failing to save
- RLS policies rejecting all users
- Database completely down

**Action:**
```
1. Ring alarm: Declare incident in Slack
2. Release Manager calls for rollback
3. DevOps executes rollback (5 min):
   a. Revert DNS to staging
   b. Verify staging healthy
   c. Announce: "Temporary outage, investigating"
4. Postmortem: Same day
5. Fix issue, test thoroughly, relaunch next day
```

### Severity 2 (High - Monitor Closely)

**Examples:**
- Specific endpoint failing (e.g., leave approval)
- 1-5% of users experiencing errors
- Performance degradation (p95 >1 second)
- Database replication lag >10 seconds

**Action:**
```
1. Alert team in Slack
2. Monitor closely (every 2 min)
3. Try to reproduce locally
4. If worsening → escalate to Severity 1
5. If stable → continue with hotfix deployment
6. Deploy hotfix (v1.0.1) within 2-4 hours
```

### Severity 3 (Medium - Note & Continue)

**Examples:**
- Minor UI glitch
- 1 user reported issue (isolated)
- Sentry reports <0.1% of sessions affected
- Non-critical feature not working

**Action:**
```
1. Log in ticket tracking system
2. Continue launch
3. Plan fix for v1.0.1
4. Respond to user: "Thank you, we're fixing this"
```

---

## MONITORING INTERVALS

### First Hour (09:00-10:00)
- Check metrics: Every 5 minutes
- Review logs: Every 10 minutes
- Report status: Every 15 minutes

### Hours 2-4 (10:00-13:00)
- Check metrics: Every 15 minutes
- Review logs: Every 30 minutes
- Report status: Hourly

### Hours 4-24 (13:00-09:00 Day 1)
- Check metrics: Hourly
- Review logs: Every 2 hours
- Report status: Twice daily

### Day 2-7
- Daily review: 09:00 UTC
- Weekly report: Friday 17:00 UTC

---

## ROLLBACK PROCEDURE

**If Severity 1 issue found and rollback approved:**

### Step 1: Stop Traffic (1 min)

```bash
# Pause health checks to stop new requests
gcloud compute health-checks update novaro-hr-health \
  --global \
  --no-enable

# Wait 30 seconds for existing requests to finish
sleep 30
```

### Step 2: Revert to Previous Version (2 min)

```bash
# Get previous Cloud Run revision
gcloud run describe novaro-hr --region europe-west1 \
  --format='value(status.latestReadyRevisionName)'

# Route traffic back to staging
gcloud compute backend-services update novaro-hr-lb \
  --global \
  --network-endpoint-group-name novaro-hr-staging-neg

# Re-enable health checks
gcloud compute health-checks update novaro-hr-health \
  --global \
  --enable
```

### Step 3: Verify Rollback (2 min)

```bash
# Test API
curl https://api.novaro-hr.de/api/health
# Expected: 200 OK

# Test login
curl -X POST https://api.novaro-hr.de/auth/login \
  -d '{"email":"test@example.com","password":"test"}'
# Expected: 200 OK or 401 (valid response)
```

### Step 4: Communicate (1 min)

```
Slack announcement:
"🔴 We've temporarily rolled back to our staging environment 
while we investigate an issue. We expect to be back online 
within the hour. Apologies for the inconvenience."

Email to users:
"We're experiencing a technical issue. Our team is 
investigating. We will update you soon."
```

### Step 5: Post-Mortem (Same day)

```
Meeting:
- What happened?
- Why did it happen?
- How do we prevent this in the future?
- When can we re-launch?
```

**Typical timeline to re-launch:** 6-24 hours (after fix verification)

---

## SUCCESS METRICS (First 24 Hours)

**Target:**

| Metric | Target | Threshold |
|--------|--------|-----------|
| Uptime | 99.9% | ≥99% |
| Crash Rate | <0.5% | ≤1% |
| Error Rate | <1% | ≤2% |
| P95 Latency | <500ms | ≤750ms |
| User Signups | >50 | ≥20 |
| Support Tickets | <10 | ≤20 |

**If all targets met:** ✅ LAUNCH SUCCESSFUL

**If targets missed:** ⚠️ Launch successful but needs follow-up

**If Severity 1 issue:** ❌ ROLLBACK

---

## POST-LAUNCH TASKS

### Immediately After (09:00-17:00 Day 0)

- [ ] Monitor Sentry every 15 min
- [ ] Respond to support emails within 1 hour
- [ ] Document any issues found
- [ ] Celebrate with team! 🎉

### Day 1 Follow-Up (10:00 Day 1)

- [ ] Review crash logs
- [ ] Analyze user feedback
- [ ] Plan v1.0.1 hotfixes (if needed)
- [ ] Update documentation based on issues
- [ ] Brief leadership on launch results

### Week 1 Follow-Up

- [ ] Publish launch retrospective
- [ ] Deploy hotfixes (v1.0.1)
- [ ] Gather more user feedback
- [ ] Plan v1.1 features

---

## CONTACT TREE

**In Case of Emergency:**

```
Release Manager (primary)
├─ Alert: Slack #incidents
├─ Contact: +49 xxx-xxxxxx (mobile)
├─ Email: release-manager@novaro-hr.de

Backend Lead (technical)
├─ Slack: @backend-lead
├─ Contact: +49 xxx-xxxxxx (mobile)

DevOps Lead (infrastructure)
├─ Slack: @devops-lead
├─ Contact: +49 xxx-xxxxxx (mobile)

Support Lead (customer)
├─ Slack: @support-lead
├─ Contact: +49 xxx-xxxxxx (mobile)
```

**Escalation Path:**
```
Release Manager
  ↓ (if critical)
Engineering Manager
  ↓ (if still unresolved after 30 min)
CTO
```

---

## COMMUNICATION TEMPLATES

### Success Announcement

```
Subject: Novaro HR is now live! 🎉

Body:
Novaro HR is officially live! 

Employees can now:
✓ Track time (manual, QR, NFC)
✓ Manage leave requests
✓ View shifts and schedules
✓ Access documents
✓ Receive notifications

Get started: https://app.novaro-hr.de

Support: support@novaro-hr.de
```

### Incident Announcement (Critical)

```
Subject: Novaro HR Experiencing Issues - We're Investigating

Body:
We're aware of an issue affecting Novaro HR access. Our team 
is investigating and working on a fix. We expect to have 
more information within 30 minutes.

We apologize for the inconvenience.
```

### Resolution Announcement

```
Subject: Novaro HR is back online ✓

Body:
Novaro HR is now back online and fully operational. The 
issue was [briefly describe what happened]. We've deployed 
a fix to prevent this from happening again.

Thank you for your patience.
```

---

## SIGN-OFF

**Prepared by:** Release Manager  
**Approved by:** CTO  
**Date:** 2026-10-23  
**Status:** READY FOR LAUNCH

---

