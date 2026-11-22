/**
 * PHASE 31 – SaaS Types
 * Multi-Tenant SaaS subscription, billing, and payment types
 */

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

export type PlanSlug = 'starter' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: number;
  plan_name: string; // 'Starter', 'Professional', 'Enterprise'
  plan_slug: PlanSlug;
  description: string | null;
  
  // Pricing (EUR in cents)
  monthly_price_cents: number;
  annual_price_cents: number | null;
  trial_days: number;
  
  // Feature Limits
  max_employees: number | null; // null = unlimited
  max_documents_gb: number | null;
  max_api_calls_per_day: number | null;
  
  // Features
  features: PlanFeatures;
  
  // Admin
  enabled: boolean;
  position: number;
  
  created_at: string;
  updated_at: string;
}

export interface PlanFeatures {
  geofencing?: boolean;
  nfc?: boolean;
  payroll?: boolean;
  reports?: boolean;
  api?: boolean;
  webhooks?: boolean;
  sso?: boolean;
  custom_domain?: boolean;
  dedicated_support?: boolean;
  [key: string]: boolean | undefined;
}

// ============================================================================
// COMPANY SUBSCRIPTIONS
// ============================================================================

export type SubscriptionStatus = 
  | 'trial'       // 14-day free trial
  | 'active'      // Paying subscription
  | 'past_due'    // Payment failed, retrying
  | 'cancelled'   // User cancelled
  | 'paused'      // Admin paused
  | 'expired';    // Trial expired, no payment

export interface CompanySubscription {
  id: number;
  company_id: number;
  plan_id: number;
  
  // Status
  status: SubscriptionStatus;
  
  // Trial
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_days_used: number;
  
  // Billing
  billing_cycle: BillingCycle;
  current_period_start: string | null;
  current_period_end: string | null;
  
  // Stripe
  stripe_subscription_id: string | null;
  stripe_customer_id: string;
  
  // Cancelation
  cancelled_at: string | null;
  cancellation_reason: string | null;
  
  // Metadata
  company_name: string;
  company_email: string;
  company_website: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface CompanySubscriptionWithPlan extends CompanySubscription {
  plan: SubscriptionPlan;
}

// ============================================================================
// BILLING & INVOICES
// ============================================================================

export type InvoiceStatus = 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface BillingInvoice {
  id: number;
  company_id: number;
  subscription_id: number;
  
  // Details
  invoice_number: string; // INV-2026-10-001
  invoice_date: string;
  due_date: string | null;
  paid_at: string | null;
  
  // Amount (EUR in cents)
  amount_cents: number;
  currency: string;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  
  // Status
  status: InvoiceStatus;
  
  // Stripe
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  
  // Description
  description: string | null;
  items: InvoiceItem[] | null;
  
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  plan?: string;
  amount?: number;
  description?: string;
  quantity?: number;
  [key: string]: unknown;
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

export interface UsageMetrics {
  id: number;
  company_id: number;
  
  period_start: string;
  period_end: string;
  
  // Metrics
  employee_count: number;
  active_users_count: number;
  documents_count: number;
  documents_size_mb: number;
  api_calls_count: number;
  time_entries_count: number;
  
  // Limits
  plan_id: number | null;
  exceeded_limits: string[]; // ['max_employees', 'max_api_calls']
  warning_sent: boolean;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export type PaymentMethodType = 'card' | 'sepa_debit' | 'paypal';

export interface PaymentMethod {
  id: number;
  company_id: number;
  
  // Stripe
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  
  // Type
  method_type: PaymentMethodType;
  
  // Card
  card_last_four: string | null;
  card_brand: string | null; // 'visa', 'mastercard'
  card_exp_month: number | null;
  card_exp_year: number | null;
  
  // SEPA
  sepa_last_four: string | null;
  sepa_bank_name: string | null;
  
  // Status
  is_default: boolean;
  billing_address: Record<string, unknown> | null;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROMOTIONAL CODES
// ============================================================================

export type DiscountType = 'percentage' | 'amount';

export interface PromotionalCode {
  id: number;
  code: string; // 'LAUNCH50'
  description: string | null;
  
  // Type
  discount_type: DiscountType;
  discount_value: number; // 50 for 50%, 4900 for €49
  
  // Limits
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  
  // Restrictions
  applicable_plans: string[]; // ['starter', 'professional']
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// STRIPE WEBHOOKS
// ============================================================================

export interface StripeWebhookEvent {
  id: number;
  event_id: string; // evt_1234...
  event_type: string; // 'charge.succeeded'
  company_id: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

// ============================================================================
// SUPPORT ACCESS
// ============================================================================

export interface SupportAccessLog {
  id: number;
  super_admin_id: string; // UUID
  company_id: number;
  action: string; // 'view_employees', 'reset_password'
  reason: string;
  accessed_resources: Record<string, unknown> | null;
  access_duration_minutes: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  ended_at: string | null;
}

// ============================================================================
// SIGNUP & ONBOARDING
// ============================================================================

export type OnboardingStep = 
  | 'signup'           // Email, password, company name
  | 'company_info'     // Company details, location
  | 'payment'          // Payment method, plan selection
  | 'complete'         // Onboarding done, can use app
  | 'cancelled';       // Signup cancelled

export interface SignupRequest {
  email: string;
  password: string;
  company_name: string;
  first_name: string;
  last_name: string;
  country: string;
  federal_state?: string; // For Germany
  website?: string;
}

export interface CompanyOnboardingStatus {
  company_id: number;
  step: OnboardingStep;
  completed_at: string | null;
  data: {
    email?: string;
    company_name?: string;
    first_name?: string;
    last_name?: string;
    country?: string;
    federal_state?: string;
    website?: string;
    plan_slug?: PlanSlug;
    billing_cycle?: BillingCycle;
  };
  created_at: string;
  updated_at: string;
}

// ============================================================================
// COMPANY (SaaS Extensions)
// ============================================================================

export interface CompanySaasInfo {
  subscription_id: number | null;
  onboarding_step: OnboardingStep;
  is_saas_account: boolean;
  custom_domain: string | null;
  logo_url: string | null;
  support_contact_email: string | null;
}

// ============================================================================
// PRICING DISPLAY
// ============================================================================

export interface PricingInfo {
  currency: string; // 'EUR'
  monthly_cents: number;
  annual_cents: number | null;
  annual_discount_percent?: number; // Calculated from monthly/annual
  formatted_monthly: string; // '€29.00'
  formatted_annual: string | null; // '€319.00'
}

export interface PlanCardData extends SubscriptionPlan {
  pricing: PricingInfo;
  is_current_plan?: boolean;
  cta_text?: string; // 'Upgrade', 'Downgrade', 'Current Plan'
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface CreateSubscriptionResponse {
  subscription: CompanySubscription;
  client_secret?: string; // For Stripe payment
  payment_url?: string;
}

export interface SubscriptionCheckResponse {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  usage: UsageMetrics | null;
  days_remaining?: number; // For trials
  renewal_date?: string;
  is_within_limits: boolean;
  exceeded_limits?: string[];
}

export interface BillingHistoryResponse {
  invoices: BillingInvoice[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}
