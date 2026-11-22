/**
 * PHASE 31 – SaaS Validation Schemas (Zod)
 */

import { z } from 'zod';

// ============================================================================
// SIGNUP & COMPANY CREATION
// ============================================================================

export const signupRequestSchema = z.object({
  email: z.string().email('Invalid email address').min(1),
  password: z.string().min(12, 'Password must be at least 12 characters').regex(
    /[A-Z]/,
    'Password must contain at least one uppercase letter'
  ).regex(
    /[a-z]/,
    'Password must contain at least one lowercase letter'
  ).regex(
    /[0-9]/,
    'Password must contain at least one digit'
  ),
  company_name: z.string().min(2).max(100),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  country: z.string().length(2, 'ISO country code required'), // 'DE', 'AT', etc.
  federal_state: z.string().optional(), // For Germany: 'Bayern', 'Berlin', etc.
  website: z.string().url().optional().or(z.literal('')),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

// ============================================================================
// PLAN SELECTION
// ============================================================================

export const planSelectionSchema = z.object({
  plan_slug: z.enum(['starter', 'professional', 'enterprise']),
  billing_cycle: z.enum(['monthly', 'annual']),
  promotional_code: z.string().optional(),
  company_id: z.number().int().positive(),
});

export type PlanSelection = z.infer<typeof planSelectionSchema>;

// ============================================================================
// PAYMENT METHOD
// ============================================================================

export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'sepa_debit']),
  // For card
  card_token: z.string().optional(), // Stripe token
  // For SEPA
  sepa_mandate: z.string().optional(), // Stripe mandate ID
  is_default: z.boolean().default(false),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export const changePlanSchema = z.object({
  new_plan_slug: z.enum(['starter', 'professional', 'enterprise']),
  billing_cycle: z.enum(['monthly', 'annual']).optional(),
  effective_immediately: z.boolean().default(true),
});

export type ChangePlanRequest = z.infer<typeof changePlanSchema>;

export const cancelSubscriptionSchema = z.object({
  reason: z.string().min(10).max(500).optional(),
  immediate: z.boolean().default(false), // False = end of billing period
});

export type CancelSubscriptionRequest = z.infer<typeof cancelSubscriptionSchema>;

export const pauseSubscriptionSchema = z.object({
  reason: z.string().min(5).max(500),
  pause_until: z.string().datetime().optional(), // ISO 8601, or null for indefinite
});

export type PauseSubscriptionRequest = z.infer<typeof pauseSubscriptionSchema>;

// ============================================================================
// PROMOTIONAL CODES
// ============================================================================

export const validatePromoCodeSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  plan_slug: z.enum(['starter', 'professional', 'enterprise']).optional(),
});

export type ValidatePromoCode = z.infer<typeof validatePromoCodeSchema>;

// ============================================================================
// BILLING & INVOICES
// ============================================================================

export const billingHistoryFilterSchema = z.object({
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'failed', 'refunded']).optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  page: z.number().int().positive().default(1),
  per_page: z.number().int().min(10).max(100).default(25),
});

export type BillingHistoryFilter = z.infer<typeof billingHistoryFilterSchema>;

// ============================================================================
// USAGE LIMITS CHECK
// ============================================================================

export const checkLimitsSchema = z.object({
  feature: z.enum(['employees', 'documents', 'api_calls']),
  projected_usage: z.number().int().nonnegative().optional(),
});

export type CheckLimitsRequest = z.infer<typeof checkLimitsSchema>;

// ============================================================================
// COMPANY SETTINGS (SaaS)
// ============================================================================

export const companySaasSettingsSchema = z.object({
  custom_domain: z.string().hostname().optional(),
  logo_url: z.string().url().optional(),
  support_contact_email: z.string().email().optional(),
  enable_brand_customization: z.boolean().default(false),
});

export type CompanySaasSettings = z.infer<typeof companySaasSettingsSchema>;

// ============================================================================
// STRIPE WEBHOOK VALIDATION
// ============================================================================

export const stripeWebhookSchema = z.object({
  id: z.string(), // evt_1234...
  object: z.literal('event'),
  type: z.string(), // charge.succeeded, customer.subscription.deleted, etc.
  data: z.record(z.unknown()),
  created: z.number(),
});

export type StripeWebhookPayload = z.infer<typeof stripeWebhookSchema>;

// ============================================================================
// USAGE METRICS
// ============================================================================

export const usageMetricsFilterSchema = z.object({
  metric: z.enum(['employee_count', 'api_calls', 'documents_size', 'active_users']).optional(),
  period_start: z.string().date().optional(),
  period_end: z.string().date().optional(),
});

export type UsageMetricsFilter = z.infer<typeof usageMetricsFilterSchema>;

// ============================================================================
// COMPANY ADMIN PROMO CODE MANAGEMENT
// ============================================================================

export const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  description: z.string().max(500).optional(),
  discount_type: z.enum(['percentage', 'amount']),
  discount_value: z.number().positive(),
  max_uses: z.number().int().positive().optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
  applicable_plans: z.array(z.enum(['starter', 'professional', 'enterprise'])).optional(),
});

export type CreatePromoCode = z.infer<typeof createPromoCodeSchema>;

// ============================================================================
// SUPER_ADMIN OPERATIONS
// ============================================================================

export const superAdminAccessSchema = z.object({
  company_id: z.number().int().positive(),
  action: z.string().min(5).max(100),
  reason: z.string().min(10).max(500),
  duration_minutes: z.number().int().positive().max(1440), // Max 24h
});

export type SuperAdminAccess = z.infer<typeof superAdminAccessSchema>;

export const resetCompanyTrialSchema = z.object({
  company_id: z.number().int().positive(),
  reason: z.string().min(10).max(500),
  new_trial_days: z.number().int().positive().max(90).default(14),
});

export type ResetCompanyTrial = z.infer<typeof resetCompanyTrialSchema>;

// ============================================================================
// INVOICE GENERATION (INTERNAL)
// ============================================================================

export const generateInvoiceSchema = z.object({
  subscription_id: z.number().int().positive(),
  amount_cents: z.number().int().positive(),
  description: z.string().max(500),
  items: z.array(z.object({
    plan: z.string().optional(),
    amount: z.number().optional(),
    description: z.string().optional(),
    quantity: z.number().int().positive().optional(),
  })).optional(),
});

export type GenerateInvoice = z.infer<typeof generateInvoiceSchema>;

// ============================================================================
// EXPORT SCHEMAS (API RESPONSE VALIDATION)
// ============================================================================

export const subscriptionResponseSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  plan_id: z.number(),
  status: z.enum(['trial', 'active', 'past_due', 'cancelled', 'paused', 'expired']),
  trial_ends_at: z.string().datetime().nullable(),
  current_period_end: z.string().datetime().nullable(),
  stripe_subscription_id: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;

export const planResponseSchema = z.object({
  id: z.number(),
  plan_name: z.string(),
  plan_slug: z.enum(['starter', 'professional', 'enterprise']),
  monthly_price_cents: z.number(),
  annual_price_cents: z.number().nullable(),
  max_employees: z.number().nullable(),
  features: z.record(z.boolean()),
  enabled: z.boolean(),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;
