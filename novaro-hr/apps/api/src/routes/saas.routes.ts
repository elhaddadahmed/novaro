/**
 * PHASE 31 – SaaS API Routes
 * Signup, subscription management, billing, Stripe webhooks
 */

import express, { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import {
  signupRequestSchema,
  planSelectionSchema,
  changePlanSchema,
  cancelSubscriptionSchema,
  billingHistoryFilterSchema,
} from '@novaro-hr/shared-validation/src/saas.schema.js';
import stripeService from '../services/stripe.service.js';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No auth required)
// ============================================================================

/**
 * POST /api/saas/signup
 * Public route: Create company account and admin user
 * Trial subscription created automatically (14 days)
 */
router.post('/signup', validateRequest(signupRequestSchema), async (req, res) => {
  const {
    email,
    password,
    company_name,
    first_name,
    last_name,
    country,
    federal_state,
    website,
  } = req.body;

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification for demo
      user_metadata: {
        first_name,
        last_name,
      },
    });

    if (authError || !authData.user) {
      logger.error('Auth user creation failed', { error: authError, email });
      return res.status(400).json({ error: authError?.message || 'Failed to create user' });
    }

    const userId = authData.user.id;

    // 2. Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: company_name,
        country,
        federal_state: federal_state || null,
        website: website || null,
        logo_url: null,
        is_active: true,
        is_saas_account: true,
        onboarding_step: 'company_info', // Next step: company details
      })
      .select()
      .single();

    if (companyError || !company) {
      logger.error('Company creation failed', { error: companyError, email });
      return res.status(500).json({ error: 'Failed to create company' });
    }

    // 3. Create Stripe customer
    let stripeCustomerId: string;
    try {
      stripeCustomerId = await stripeService.createStripeCustomer(
        company.id,
        company_name,
        email
      );
    } catch (error) {
      logger.error('Stripe customer creation failed', { error, company_id: company.id });
      return res.status(500).json({ error: 'Payment system error' });
    }

    // 4. Create trial subscription
    let subscription;
    try {
      subscription = await stripeService.createSubscription(
        stripeCustomerId,
        'starter', // Default plan
        'monthly',
        company.id,
        14 // 14-day trial
      );
    } catch (error) {
      logger.error('Subscription creation failed', { error, company_id: company.id });
      return res.status(500).json({ error: 'Failed to create subscription' });
    }

    // 5. Create company_subscriptions record
    const { data: compSubscription, error: subError } = await supabase
      .from('company_subscriptions')
      .insert({
        company_id: company.id,
        plan_id: 1, // starter plan ID (from seed)
        status: 'trial',
        stripe_subscription_id: subscription.subscription_id,
        stripe_customer_id: stripeCustomerId,
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        billing_cycle: 'monthly',
        company_name,
        company_email: email,
      })
      .select()
      .single();

    if (subError || !compSubscription) {
      logger.error('Company subscription creation failed', { error: subError });
      return res.status(500).json({ error: 'Failed to create subscription record' });
    }

    // 6. Create user role (COMPANY_ADMIN for first user)
    await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        company_id: company.id,
        role_id: 2, // COMPANY_ADMIN role ID (from seed)
      });

    // 7. Create user profile
    await supabase
      .from('profiles')
      .insert({
        id: userId,
        company_id: company.id,
        email,
        first_name,
        last_name,
        is_active: true,
      });

    // 8. Update company with subscription_id
    await supabase
      .from('companies')
      .update({ subscription_id: compSubscription.id })
      .eq('id', company.id);

    logger.info('Company signup completed', {
      user_id: userId,
      company_id: company.id,
      email,
    });

    // 9. Send response (don't auto-login, user should verify or receive email)
    res.status(201).json({
      success: true,
      company_id: company.id,
      message: 'Account created successfully. Trial begins now!',
      next_step: 'company_info', // Admin UI should guide through onboarding
    });
  } catch (error) {
    logger.error('Signup failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/saas/plans
 * Public route: List all subscription plans
 */
router.get('/plans', async (req, res) => {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('enabled', true)
      .order('position');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Add pricing info
    const plansWithPricing = plans.map((plan) => ({
      ...plan,
      pricing: {
        currency: 'EUR',
        monthly_cents: plan.monthly_price_cents,
        annual_cents: plan.annual_price_cents,
        formatted_monthly: `€${(plan.monthly_price_cents / 100).toFixed(2)}`,
        formatted_annual: plan.annual_price_cents
          ? `€${(plan.annual_price_cents / 100).toFixed(2)}`
          : null,
        annual_discount_percent:
          plan.annual_price_cents && plan.monthly_price_cents
            ? Math.round(
                ((plan.monthly_price_cents * 12 - plan.annual_price_cents) /
                  (plan.monthly_price_cents * 12)) *
                  100
              )
            : null,
      },
    }));

    res.json({ plans: plansWithPricing });
  } catch (error) {
    logger.error('Failed to fetch plans', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

/**
 * POST /api/saas/subscriptions/select-plan
 * Authenticated: Select and confirm plan + billing cycle
 * Creates Payment Intent for payment
 */
router.post(
  '/subscriptions/select-plan',
  authMiddleware,
  validateRequest(planSelectionSchema),
  async (req, res) => {
    const { company_id, plan_slug, billing_cycle, promotional_code } = req.body;
    const user_id = req.user!.id;

    try {
      // 1. Verify user is COMPANY_ADMIN for this company
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user_id)
        .eq('company_id', company_id)
        .single();

      if (!userRole || userRole.role_id !== 2) {
        // 2 = COMPANY_ADMIN
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // 2. Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('plan_slug', plan_slug)
        .eq('enabled', true)
        .single();

      if (planError || !plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      // 3. Get subscription and Stripe customer
      const { data: subscription } = await supabase
        .from('company_subscriptions')
        .select('*')
        .eq('company_id', company_id)
        .single();

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // 4. Apply promotional code discount if provided
      let discountAmount = 0;
      if (promotional_code) {
        const { data: promoData } = await supabase
          .from('promotional_codes')
          .select('*')
          .eq('code', promotional_code.toUpperCase())
          .single();

        if (promoData && promoData.valid_until! > new Date().toISOString()) {
          if (
            promoData.applicable_plans.length === 0 ||
            promoData.applicable_plans.includes(plan_slug)
          ) {
            if (promoData.discount_type === 'percentage') {
              const basePrice =
                billing_cycle === 'monthly'
                  ? plan.monthly_price_cents
                  : plan.annual_price_cents || plan.monthly_price_cents * 12;
              discountAmount = Math.round((basePrice * promoData.discount_value) / 100);
            } else {
              discountAmount = promoData.discount_value;
            }
          }
        }
      }

      // 5. Create Stripe subscription with new plan
      await stripeService.updateSubscription(subscription.stripe_subscription_id!, {
        plan_slug,
        billing_cycle,
      });

      // 6. Update company_subscriptions record
      await supabase
        .from('company_subscriptions')
        .update({
          plan_id: plan.id,
          billing_cycle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      // 7. Log in audit
      await supabase.from('audit_logs').insert({
        company_id,
        actor_user_id: user_id,
        action: 'UPDATE',
        entity_type: 'subscription',
        entity_id: subscription.id,
        new_state: { plan_slug, billing_cycle },
        metadata: { promotional_code: !!promotional_code },
      });

      logger.info('Plan selected', {
        company_id,
        plan_slug,
        billing_cycle,
      });

      res.json({
        success: true,
        subscription: {
          id: subscription.id,
          company_id,
          plan_slug,
          billing_cycle,
          status: subscription.status,
        },
        discount: discountAmount,
        next_step: 'payment', // Redirect to payment in UI
      });
    } catch (error) {
      logger.error('Plan selection failed', { error, company_id, user_id });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/saas/subscriptions/change-plan
 * Authenticated: Change plan (for existing active subscriptions)
 */
router.post(
  '/subscriptions/change-plan',
  authMiddleware,
  validateRequest(changePlanSchema),
  async (req, res) => {
    const { new_plan_slug, billing_cycle, effective_immediately } = req.body;
    const user_id = req.user!.id;

    try {
      // Get user's company
      const { data: userCompany } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user_id)
        .single();

      if (!userCompany) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const company_id = userCompany.company_id;

      // Get subscription
      const { data: subscription } = await supabase
        .from('company_subscriptions')
        .select('*')
        .eq('company_id', company_id)
        .eq('status', 'active')
        .single();

      if (!subscription || !subscription.stripe_subscription_id) {
        return res.status(404).json({ error: 'No active subscription' });
      }

      // Update in Stripe
      await stripeService.updateSubscription(subscription.stripe_subscription_id, {
        plan_slug: new_plan_slug,
        billing_cycle: billing_cycle || (subscription.billing_cycle as any),
      });

      // Update in DB
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('plan_slug', new_plan_slug)
        .single();

      if (plan) {
        await supabase
          .from('company_subscriptions')
          .update({
            plan_id: plan.id,
            billing_cycle: billing_cycle || subscription.billing_cycle,
          })
          .eq('id', subscription.id);
      }

      // Audit
      await supabase.from('audit_logs').insert({
        company_id,
        actor_user_id: user_id,
        action: 'UPDATE',
        entity_type: 'subscription',
        entity_id: subscription.id,
        new_state: { plan_slug: new_plan_slug, billing_cycle },
      });

      logger.info('Plan changed', {
        company_id,
        from_plan: subscription.plan_id,
        to_plan: new_plan_slug,
      });

      res.json({ success: true, message: 'Plan updated successfully' });
    } catch (error) {
      logger.error('Plan change failed', { error, user_id });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/saas/subscriptions/cancel
 * Authenticated: Cancel subscription
 */
router.post(
  '/subscriptions/cancel',
  authMiddleware,
  validateRequest(cancelSubscriptionSchema),
  async (req, res) => {
    const { reason, immediate } = req.body;
    const user_id = req.user!.id;

    try {
      const { data: userCompany } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user_id)
        .single();

      if (!userCompany) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const company_id = userCompany.company_id;

      const { data: subscription } = await supabase
        .from('company_subscriptions')
        .select('*')
        .eq('company_id', company_id)
        .in('status', ['active', 'trial', 'past_due'])
        .single();

      if (!subscription || !subscription.stripe_subscription_id) {
        return res.status(404).json({ error: 'No active subscription' });
      }

      // Cancel in Stripe
      await stripeService.cancelSubscription(subscription.stripe_subscription_id, immediate);

      // Update in DB
      await supabase
        .from('company_subscriptions')
        .update({
          status: immediate ? 'cancelled' : 'cancelled',
          cancelled_at: immediate ? new Date().toISOString() : null,
          cancellation_reason: reason || null,
        })
        .eq('id', subscription.id);

      // Audit
      await supabase.from('audit_logs').insert({
        company_id,
        actor_user_id: user_id,
        action: 'DELETE',
        entity_type: 'subscription',
        entity_id: subscription.id,
        metadata: { reason, immediate },
      });

      logger.info('Subscription cancelled', {
        company_id,
        immediate,
      });

      res.json({
        success: true,
        message: immediate
          ? 'Subscription cancelled immediately'
          : 'Subscription will be cancelled at end of billing period',
      });
    } catch (error) {
      logger.error('Subscription cancellation failed', { error, user_id });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/saas/subscription/status
 * Authenticated: Get current subscription status
 */
router.get('/subscription/status', authMiddleware, async (req, res) => {
  const user_id = req.user!.id;

  try {
    const { data: userCompany } = await supabase
      .from('user_roles')
      .select('company_id')
      .eq('user_id', user_id)
      .single();

    if (!userCompany) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const company_id = userCompany.company_id;

    const { data: subscription } = await supabase
      .from('company_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('company_id', company_id)
      .single();

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Check limits
    const limits = await checkCompanyLimits(company_id);

    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.subscription_plans,
        billing_cycle: subscription.billing_cycle,
        trial_ends_at: subscription.trial_ends_at,
        current_period_end: subscription.current_period_end,
      },
      usage: limits,
    });
  } catch (error) {
    logger.error('Failed to fetch subscription status', { error, user_id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/saas/billing/invoices
 * Authenticated: Get billing history
 */
router.get(
  '/billing/invoices',
  authMiddleware,
  validateRequest(billingHistoryFilterSchema),
  async (req, res) => {
    const user_id = req.user!.id;
    const { status, date_from, date_to, page = 1, per_page = 25 } = req.query;

    try {
      const { data: userCompany } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user_id)
        .single();

      if (!userCompany) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const company_id = userCompany.company_id;

      let query = supabase
        .from('billing_invoices')
        .select('*', { count: 'exact' })
        .eq('company_id', company_id);

      if (status) query = query.eq('status', status);
      if (date_from) query = query.gte('invoice_date', date_from);
      if (date_to) query = query.lte('invoice_date', date_to);

      const { data: invoices, count, error } = await query
        .order('invoice_date', { ascending: false })
        .range((Number(page) - 1) * Number(per_page), Number(page) * Number(per_page) - 1);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({
        invoices,
        total_count: count || 0,
        page: Number(page),
        per_page: Number(per_page),
        total_pages: Math.ceil((count || 0) / Number(per_page)),
      });
    } catch (error) {
      logger.error('Failed to fetch invoices', { error, user_id });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================================
// STRIPE WEBHOOKS (No auth required, but signature verified)
// ============================================================================

/**
 * POST /api/saas/stripe/webhook
 * Stripe webhook handler (public, but Stripe-signature verified)
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    // Store webhook event in DB for audit
    await supabase.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event.data,
      processed: false,
    });

    // Handle specific events
    switch (event.type) {
      case 'charge.succeeded': {
        const charge = event.data.object as any;
        await stripeService.handleChargeSucceeded(
          charge.customer,
          charge.invoice,
          charge.amount
        );
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object as any;
        await stripeService.handleChargeFailed(charge.customer, charge.failure_message);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await stripeService.handleSubscriptionDeleted(subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        await stripeService.handleSubscriptionUpdated(subscription.id);
        break;
      }
    }

    // Mark event as processed
    await supabase
      .from('stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', event.id);

    logger.info('Webhook processed', { event_type: event.type, event_id: event.id });
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', { error });
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================================
// HELPERS
// ============================================================================

async function checkCompanyLimits(company_id: number) {
  const { data: subscription } = await supabase
    .from('company_subscriptions')
    .select('plan_id, subscription_plans(*)')
    .eq('company_id', company_id)
    .single();

  if (!subscription?.subscription_plans) {
    return null;
  }

  const plan = subscription.subscription_plans as any;

  // Count current usage
  const employeeCount = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company_id);

  return {
    employees: {
      current: employeeCount.count || 0,
      limit: plan.max_employees,
      exceeded: plan.max_employees && employeeCount.count! > plan.max_employees,
    },
  };
}

export default router;
