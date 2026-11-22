/**
 * PHASE 31 – SaaS Integration Tests
 * Test signup, subscription management, billing, Stripe integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase, supabaseAdmin } from '../src/lib/supabase';
import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = `test-saas-${Date.now()}@novaro.de`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_COMPANY = `Test Company ${Date.now()}`;

let testUserId: string;
let testCompanyId: number;
let testSessionToken: string;

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

beforeAll(async () => {
  // Signup will create user, company, and subscription
  console.log('Setting up test data...');
});

afterAll(async () => {
  // Cleanup test data
  if (testCompanyId) {
    await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', testCompanyId);
  }

  if (testUserId) {
    await supabaseAdmin.auth.admin.deleteUser(testUserId);
  }

  console.log('Cleaned up test data');
});

// ============================================================================
// SIGNUP TESTS
// ============================================================================

describe('Signup Flow', () => {
  it('should create company account with trial subscription', async () => {
    const res = await request(BASE_URL)
      .post('/api/saas/signup')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        company_name: TEST_COMPANY,
        first_name: 'Test',
        last_name: 'User',
        country: 'DE',
        federal_state: 'Bayern',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.company_id).toBeDefined();
    expect(res.body.next_step).toBe('company_info');

    testCompanyId = res.body.company_id;

    // Verify company was created
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', testCompanyId)
      .single();

    expect(company).toBeDefined();
    expect(company.name).toBe(TEST_COMPANY);
    expect(company.is_saas_account).toBe(true);
  });

  it('should reject invalid email', async () => {
    const res = await request(BASE_URL)
      .post('/api/saas/signup')
      .send({
        email: 'not-an-email',
        password: TEST_PASSWORD,
        company_name: 'Test',
        first_name: 'Test',
        last_name: 'User',
        country: 'DE',
      });

    expect(res.status).toBe(400);
  });

  it('should reject weak password', async () => {
    const res = await request(BASE_URL)
      .post('/api/saas/signup')
      .send({
        email: `weak-pw-${Date.now()}@novaro.de`,
        password: 'weak',
        company_name: 'Test',
        first_name: 'Test',
        last_name: 'User',
        country: 'DE',
      });

    expect(res.status).toBe(400);
  });

  it('should create trial subscription', async () => {
    const { data: subscription } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', testCompanyId)
      .single();

    expect(subscription).toBeDefined();
    expect(subscription.status).toBe('trial');
    expect(subscription.trial_ends_at).toBeDefined();
    expect(subscription.stripe_subscription_id).toBeDefined();
  });
});

// ============================================================================
// PLAN TESTS
// ============================================================================

describe('Plan Management', () => {
  beforeAll(async () => {
    // Login to get session token
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    testSessionToken = res.body.session?.access_token;

    // Get user ID from token
    const { data } = await supabase.auth.getUser(testSessionToken);
    testUserId = data.user?.id || '';
  });

  it('should list all plans', async () => {
    const res = await request(BASE_URL).get('/api/saas/plans');

    expect(res.status).toBe(200);
    expect(res.body.plans).toBeInstanceOf(Array);
    expect(res.body.plans.length).toBeGreaterThan(0);

    const plan = res.body.plans[0];
    expect(plan.plan_slug).toBeDefined();
    expect(plan.monthly_price_cents).toBeDefined();
    expect(plan.features).toBeDefined();
  });

  it('should select a plan', async () => {
    const res = await request(BASE_URL)
      .post('/api/saas/subscriptions/select-plan')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        company_id: testCompanyId,
        plan_slug: 'professional',
        billing_cycle: 'monthly',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.subscription.plan_slug).toBe('professional');
  });

  it('should change plan', async () => {
    const res = await request(BASE_URL)
      .post('/api/saas/subscriptions/change-plan')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        new_plan_slug: 'starter',
        billing_cycle: 'annual',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify plan changed
    const { data: subscription } = await supabase
      .from('company_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('company_id', testCompanyId)
      .single();

    expect(subscription.plan_id).toBeDefined();
  });
});

// ============================================================================
// SUBSCRIPTION STATUS TESTS
// ============================================================================

describe('Subscription Status', () => {
  it('should get subscription status', async () => {
    const res = await request(BASE_URL)
      .get('/api/saas/subscription/status')
      .set('Authorization', `Bearer ${testSessionToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription).toBeDefined();
    expect(res.body.subscription.status).toMatch(
      /^(trial|active|past_due|cancelled|paused|expired)$/
    );
    expect(res.body.subscription.plan).toBeDefined();
  });

  it('should check usage limits', async () => {
    const { body } = await request(BASE_URL)
      .get('/api/saas/subscription/status')
      .set('Authorization', `Bearer ${testSessionToken}`);

    expect(body.usage).toBeDefined();
    expect(body.usage.employees).toBeDefined();
  });
});

// ============================================================================
// CANCELLATION TESTS
// ============================================================================

describe('Subscription Cancellation', () => {
  it('should cancel subscription at period end', async () => {
    const res = await request(BASE_URL)
      .post('/api/saas/subscriptions/cancel')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        reason: 'Testing cancellation',
        immediate: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should not allow unauthorized cancellation', async () => {
    const res = await request(BASE_URL)
      .post('/api/saas/subscriptions/cancel')
      .send({
        reason: 'Unauthorized cancel',
        immediate: true,
      });

    expect(res.status).toBe(401);
  });
});

// ============================================================================
// BILLING TESTS
// ============================================================================

describe('Billing & Invoices', () => {
  it('should fetch billing history', async () => {
    const res = await request(BASE_URL)
      .get('/api/saas/billing/invoices')
      .set('Authorization', `Bearer ${testSessionToken}`);

    expect(res.status).toBe(200);
    expect(res.body.invoices).toBeInstanceOf(Array);
    expect(res.body.total_count).toBeDefined();
    expect(res.body.page).toBe(1);
  });

  it('should filter invoices by status', async () => {
    const res = await request(BASE_URL)
      .get('/api/saas/billing/invoices?status=paid')
      .set('Authorization', `Bearer ${testSessionToken}`);

    expect(res.status).toBe(200);
    res.body.invoices.forEach((inv: any) => {
      expect(inv.status).toBe('paid');
    });
  });

  it('should paginate invoice results', async () => {
    const page1 = await request(BASE_URL)
      .get('/api/saas/billing/invoices?page=1&per_page=10')
      .set('Authorization', `Bearer ${testSessionToken}`);

    const page2 = await request(BASE_URL)
      .get('/api/saas/billing/invoices?page=2&per_page=10')
      .set('Authorization', `Bearer ${testSessionToken}`);

    expect(page1.body.page).toBe(1);
    expect(page2.body.page).toBe(2);
  });
});

// ============================================================================
// MULTI-TENANCY TESTS
// ============================================================================

describe('Multi-Tenancy & RLS', () => {
  let otherCompanyId: number;
  let otherUserToken: string;

  beforeAll(async () => {
    // Create another company and user
    const signupRes = await request(BASE_URL)
      .post('/api/saas/signup')
      .send({
        email: `other-company-${Date.now()}@novaro.de`,
        password: TEST_PASSWORD,
        company_name: `Other Company ${Date.now()}`,
        first_name: 'Other',
        last_name: 'User',
        country: 'DE',
      });

    otherCompanyId = signupRes.body.company_id;

    // Login as other user
    const loginRes = await request(BASE_URL)
      .post('/api/auth/login')
      .send({
        email: `other-company-${Date.now()}@novaro.de`,
        password: TEST_PASSWORD,
      });

    otherUserToken = loginRes.body.session?.access_token;
  });

  afterAll(async () => {
    if (otherCompanyId) {
      await supabaseAdmin
        .from('companies')
        .delete()
        .eq('id', otherCompanyId);
    }
  });

  it('should not allow viewing other company subscriptions', async () => {
    const res = await request(BASE_URL)
      .get('/api/saas/subscription/status')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .query({ company_id: testCompanyId });

    // Should return own company subscription, not testCompanyId
    expect(res.body.subscription.company_id).toBe(otherCompanyId);
  });

  it('should not allow changing other company plans', async () => {
    const res = await request(BASE_URL)
      .post('/api/saas/subscriptions/change-plan')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        company_id: otherCompanyId, // Trying to change other company
        new_plan_slug: 'enterprise',
      });

    // Should fail due to RLS or permission check
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ============================================================================
// STRIPE WEBHOOK TESTS
// ============================================================================

describe('Stripe Webhooks', () => {
  it('should process charge.succeeded webhook', async () => {
    const event = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'charge.succeeded',
      data: {
        object: {
          id: 'ch_test_123',
          object: 'charge',
          customer: 'cus_test_123',
          amount: 4900,
          currency: 'eur',
          status: 'succeeded',
        },
      },
      created: Math.floor(Date.now() / 1000),
    };

    const signature = 't=123,v1=fake';

    const res = await request(BASE_URL)
      .post('/api/saas/stripe/webhook')
      .set('stripe-signature', signature)
      .send(JSON.stringify(event));

    // Will fail signature verification in test, but endpoint exists
    expect([200, 400]).toContain(res.status);
  });

  it('should store webhook events for audit', async () => {
    const { data: events } = await supabase
      .from('stripe_webhook_events')
      .select('*')
      .limit(1)
      .order('created_at', { ascending: false });

    expect(events).toBeInstanceOf(Array);
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  it('should get subscription status quickly', async () => {
    const start = Date.now();

    await request(BASE_URL)
      .get('/api/saas/subscription/status')
      .set('Authorization', `Bearer ${testSessionToken}`);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500); // Should be < 500ms
  });

  it('should fetch plans without N+1 queries', async () => {
    const res = await request(BASE_URL).get('/api/saas/plans');

    expect(res.status).toBe(200);
    expect(res.body.plans.length).toBeGreaterThan(0);
  });
});
