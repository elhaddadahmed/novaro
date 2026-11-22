-- PHASE 31 – SaaS Subscriptions & Billing
-- Erweitere Novaro HR zur echten Multi-Tenant SaaS-Plattform

-- ============================================================================
-- 1. SUBSCRIPTION PLANS
-- ============================================================================

CREATE TABLE subscription_plans (
  id BIGSERIAL PRIMARY KEY,
  plan_name TEXT NOT NULL, -- 'Starter', 'Professional', 'Enterprise'
  plan_slug TEXT NOT NULL UNIQUE, -- 'starter', 'professional', 'enterprise'
  description TEXT,
  
  -- Pricing
  monthly_price_cents BIGINT NOT NULL, -- EUR in cents
  annual_price_cents BIGINT, -- 0 = no annual option
  trial_days INTEGER DEFAULT 14,
  
  -- Feature Limits
  max_employees INTEGER, -- null = unlimited
  max_documents_gb BIGINT, -- null = unlimited
  max_api_calls_per_day BIGINT, -- null = unlimited
  
  -- Features (bitmask or separate table)
  features JSONB DEFAULT '{}', -- {geofencing: true, nfc: true, payroll: true, ...}
  
  -- Admin Settings
  enabled BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0, -- Sort order
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_slug ON subscription_plans(plan_slug);
CREATE INDEX idx_subscription_plans_enabled ON subscription_plans(enabled);

COMMENT ON TABLE subscription_plans IS 'Define SaaS pricing tiers and feature limits';

-- ============================================================================
-- 2. COMPANY SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE company_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  plan_id BIGINT NOT NULL REFERENCES subscription_plans(id),
  
  -- Subscription Status
  status TEXT NOT NULL CHECK (status IN (
    'trial',           -- 14-day free trial
    'active',          -- Paying subscription
    'past_due',        -- Payment failed, retrying
    'cancelled',       -- User cancelled
    'paused',          -- Admin paused (e.g., for investigation)
    'expired'          -- Trial expired, no payment
  )) DEFAULT 'trial',
  
  -- Trial Management
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  trial_days_used INTEGER DEFAULT 0,
  
  -- Billing Cycle
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')) DEFAULT 'monthly',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  
  -- Stripe Integration
  stripe_subscription_id TEXT, -- stripe_sub_123...
  stripe_customer_id TEXT NOT NULL UNIQUE, -- stripe_cus_123...
  
  -- Cancelation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Metadata
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL,
  company_website TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_company_subscriptions_company_id ON company_subscriptions(company_id);
CREATE INDEX idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX idx_company_subscriptions_stripe_customer_id ON company_subscriptions(stripe_customer_id);
CREATE INDEX idx_company_subscriptions_current_period_end ON company_subscriptions(current_period_end);

COMMENT ON TABLE company_subscriptions IS 'Track subscription status and billing for each company';

-- ============================================================================
-- 3. BILLING HISTORY / INVOICES
-- ============================================================================

CREATE TABLE billing_invoices (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id BIGINT NOT NULL REFERENCES company_subscriptions(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_number TEXT NOT NULL, -- INV-2026-10-001
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Amount
  amount_cents BIGINT NOT NULL, -- EUR in cents
  currency TEXT DEFAULT 'EUR',
  tax_cents BIGINT DEFAULT 0,
  discount_cents BIGINT DEFAULT 0,
  total_cents BIGINT NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'draft',    -- Not sent
    'sent',     -- Sent to customer
    'viewed',   -- Customer viewed
    'paid',     -- Payment received
    'failed',   -- Payment failed
    'refunded'  -- Refunded
  )) DEFAULT 'draft',
  
  -- Stripe
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Details
  description TEXT, -- 'Professional Plan (Oct 1-31, 2026)'
  items JSONB, -- [{plan: 'Professional', amount: 4900, ...}]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_invoices_company_id ON billing_invoices(company_id);
CREATE INDEX idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX idx_billing_invoices_paid_at ON billing_invoices(paid_at);
CREATE INDEX idx_billing_invoices_invoice_date ON billing_invoices(invoice_date);

COMMENT ON TABLE billing_invoices IS 'Track issued invoices and payment history';

-- ============================================================================
-- 4. USAGE TRACKING
-- ============================================================================

CREATE TABLE usage_metrics (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Billing Period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Tracked Metrics
  employee_count INTEGER DEFAULT 0,
  active_users_count INTEGER DEFAULT 0, -- Users who logged in this month
  documents_count INTEGER DEFAULT 0,
  documents_size_mb BIGINT DEFAULT 0,
  api_calls_count BIGINT DEFAULT 0,
  time_entries_count BIGINT DEFAULT 0,
  
  -- Limits Check (at month end)
  plan_id BIGINT REFERENCES subscription_plans(id),
  exceeded_limits JSONB DEFAULT '[]', -- ['max_employees', 'max_api_calls']
  warning_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_metrics_company_id ON usage_metrics(company_id);
CREATE INDEX idx_usage_metrics_period ON usage_metrics(period_start, period_end);
CREATE UNIQUE INDEX idx_usage_metrics_company_period ON usage_metrics(company_id, period_start);

COMMENT ON TABLE usage_metrics IS 'Track usage for billing and limits enforcement';

-- ============================================================================
-- 5. PAYMENT METHODS
-- ============================================================================

CREATE TABLE payment_methods (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Stripe
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL REFERENCES company_subscriptions(stripe_customer_id),
  
  -- Type
  method_type TEXT NOT NULL CHECK (method_type IN ('card', 'sepa_debit', 'paypal')),
  
  -- Card Details (masked)
  card_last_four TEXT,
  card_brand TEXT, -- 'visa', 'mastercard', 'amex'
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  -- SEPA Details (masked)
  sepa_last_four TEXT,
  sepa_bank_name TEXT,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  billing_address JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_company_id ON payment_methods(company_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);

COMMENT ON TABLE payment_methods IS 'Store payment methods for billing';

-- ============================================================================
-- 6. TRIAL & PROMOTIONAL CODES
-- ============================================================================

CREATE TABLE promotional_codes (
  id BIGSERIAL PRIMARY KEY,
  
  -- Code Details
  code TEXT NOT NULL UNIQUE, -- 'LAUNCH50', 'EARLYBIRD'
  description TEXT,
  
  -- Type
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'amount')),
  discount_value NUMERIC(5, 2), -- 50 for 50%, 4900 for €49
  
  -- Limits
  max_uses INTEGER, -- null = unlimited
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  
  -- Restrictions
  applicable_plans JSONB DEFAULT '[]', -- ['starter', 'professional'] or [] = all
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promotional_codes_code ON promotional_codes(code);
CREATE INDEX idx_promotional_codes_valid ON promotional_codes(valid_from, valid_until);

COMMENT ON TABLE promotional_codes IS 'Promotional and discount codes';

-- ============================================================================
-- 7. STRIPE WEBHOOKS (Event Log)
-- ============================================================================

CREATE TABLE stripe_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  
  -- Event Details
  event_id TEXT NOT NULL UNIQUE, -- evt_1234...
  event_type TEXT NOT NULL, -- 'charge.succeeded', 'customer.subscription.deleted'
  
  -- Related Records
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);
CREATE INDEX idx_stripe_webhook_events_company_id ON stripe_webhook_events(company_id);
CREATE INDEX idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX idx_stripe_webhook_events_created_at ON stripe_webhook_events(created_at);

COMMENT ON TABLE stripe_webhook_events IS 'Log all Stripe webhook events for audit and retry';

-- ============================================================================
-- 8. SUPPORT TICKETS / SUPER_ADMIN ACCESS LOG
-- ============================================================================

CREATE TABLE support_access_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Admin Access
  super_admin_id BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Details
  action TEXT NOT NULL, -- 'view_employees', 'reset_password', 'investigate_issue'
  reason TEXT NOT NULL, -- Why did support access this?
  
  -- Scope & Time
  accessed_resources JSONB, -- {tables: ['employees'], rows: 15, ...}
  access_duration_minutes INTEGER,
  
  -- Audit
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_support_access_log_super_admin_id ON support_access_log(super_admin_id);
CREATE INDEX idx_support_access_log_company_id ON support_access_log(company_id);
CREATE INDEX idx_support_access_log_created_at ON support_access_log(created_at);

COMMENT ON TABLE support_access_log IS 'Audit trail for SUPER_ADMIN support access (ArbZG compliance)';

-- ============================================================================
-- 9. UPDATE COMPANIES TABLE (Add SaaS Fields)
-- ============================================================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  subscription_id BIGINT REFERENCES company_subscriptions(id) ON DELETE SET NULL;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  onboarding_step TEXT DEFAULT 'signup'; -- signup → company_info → payment → complete

ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  is_saas_account BOOLEAN DEFAULT true;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  custom_domain TEXT UNIQUE; -- Optional custom domain (Phase 31+)

ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  logo_url TEXT; -- Company logo URL

ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  support_contact_email TEXT;

-- ============================================================================
-- 10. FUNCTIONS: Check Subscription Status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_company_subscription_status(p_company_id BIGINT)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
  v_trial_ends_at TIMESTAMP WITH TIME ZONE;
  v_current_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT 
    cs.status,
    cs.trial_ends_at,
    cs.current_period_end
  INTO v_status, v_trial_ends_at, v_current_period_end
  FROM company_subscriptions cs
  WHERE cs.company_id = p_company_id;
  
  -- If trial, check if expired
  IF v_status = 'trial' AND v_trial_ends_at < NOW() THEN
    UPDATE company_subscriptions
    SET status = 'expired'
    WHERE company_id = p_company_id;
    RETURN 'expired';
  END IF;
  
  -- If active, check if renewal needed
  IF v_status = 'active' AND v_current_period_end < NOW() THEN
    -- Renewal logic handled by Stripe webhook
    RETURN 'renewal_pending';
  END IF;
  
  RETURN v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. FUNCTIONS: Check Usage Limits
-- ============================================================================

CREATE OR REPLACE FUNCTION check_usage_limits(p_company_id BIGINT, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_id BIGINT;
  v_limit INTEGER;
  v_current_usage INTEGER;
BEGIN
  -- Get company's current plan
  SELECT plan_id INTO v_plan_id
  FROM company_subscriptions
  WHERE company_id = p_company_id
  AND status IN ('trial', 'active');
  
  IF v_plan_id IS NULL THEN
    RETURN false; -- No active subscription
  END IF;
  
  -- Get limit for feature
  IF p_feature = 'employees' THEN
    SELECT max_employees INTO v_limit
    FROM subscription_plans
    WHERE id = v_plan_id;
    
    SELECT COUNT(*) INTO v_current_usage
    FROM employees
    WHERE company_id = p_company_id;
    
    RETURN v_current_usage < v_limit;
  END IF;
  
  -- Add more features as needed
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. FUNCTIONS: Generate Invoice Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_invoice_number TEXT;
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence for this year
  SELECT COUNT(*) + 1 INTO v_sequence
  FROM billing_invoices
  WHERE EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM NOW());
  
  v_invoice_number := 'INV-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. INITIAL DATA: Subscription Plans
-- ============================================================================

INSERT INTO subscription_plans (plan_name, plan_slug, description, monthly_price_cents, annual_price_cents, trial_days, max_employees, max_documents_gb, max_api_calls_per_day, features)
VALUES
  (
    'Starter',
    'starter',
    'For small teams (up to 25 employees)',
    2900,      -- €29/month
    31900,     -- €319/year (10% discount)
    14,
    25,
    5,
    10000,
    '{"geofencing": false, "nfc": false, "payroll": true, "reports": true, "api": true}'::jsonb
  ),
  (
    'Professional',
    'professional',
    'For growing companies (up to 250 employees)',
    4900,      -- €49/month
    53900,     -- €539/year (10% discount)
    14,
    250,
    50,
    100000,
    '{"geofencing": true, "nfc": true, "payroll": true, "reports": true, "api": true, "webhooks": true}'::jsonb
  ),
  (
    'Enterprise',
    'enterprise',
    'For large organizations (unlimited)',
    9900,      -- €99/month (custom pricing available)
    NULL,      -- Annual pricing negotiated separately
    14,
    NULL,      -- Unlimited
    NULL,      -- Unlimited
    NULL,      -- Unlimited
    '{"geofencing": true, "nfc": true, "payroll": true, "reports": true, "api": true, "webhooks": true, "sso": true, "custom_domain": true, "dedicated_support": true}'::jsonb
  );

-- ============================================================================
-- 14. RLS POLICIES (SaaS Tables)
-- ============================================================================

-- company_subscriptions: Only own company can view
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_subscriptions_own_company ON company_subscriptions
FOR SELECT USING (
  company_id = (SELECT company_id FROM auth.current_user_company())
  OR (SELECT role FROM auth.get_user_role()) = 'SUPER_ADMIN'
);

-- billing_invoices: Only own company can view
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_invoices_own_company ON billing_invoices
FOR SELECT USING (
  company_id = (SELECT company_id FROM auth.current_user_company())
  OR (SELECT role FROM auth.get_user_role()) = 'SUPER_ADMIN'
);

-- usage_metrics: Only own company can view
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_metrics_own_company ON usage_metrics
FOR SELECT USING (
  company_id = (SELECT company_id FROM auth.current_user_company())
  OR (SELECT role FROM auth.get_user_role()) = 'SUPER_ADMIN'
);

-- payment_methods: Only own company can view
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_methods_own_company ON payment_methods
FOR SELECT USING (
  company_id = (SELECT company_id FROM auth.current_user_company())
  OR (SELECT role FROM auth.get_user_role()) = 'SUPER_ADMIN'
);

-- subscription_plans: Public read (all can view plans)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_plans_public_read ON subscription_plans
FOR SELECT USING (enabled = true);

-- stripe_webhook_events: Only SUPER_ADMIN
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY stripe_webhook_events_super_admin ON stripe_webhook_events
FOR ALL USING ((SELECT role FROM auth.get_user_role()) = 'SUPER_ADMIN');

-- support_access_log: Only SUPER_ADMIN and auditors
ALTER TABLE support_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_access_log_super_admin ON support_access_log
FOR SELECT USING ((SELECT role FROM auth.get_user_role()) = 'SUPER_ADMIN');

-- ============================================================================
-- 15. AUDIT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_company_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    company_id, actor_user_id, action, entity_type, entity_id,
    previous_state, new_state, metadata
  ) VALUES (
    NEW.company_id,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'CREATE' WHEN TG_OP = 'UPDATE' THEN 'UPDATE' END,
    'company_subscription',
    NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW),
    jsonb_build_object(
      'stripe_subscription_id', NEW.stripe_subscription_id,
      'status', NEW.status,
      'plan_id', NEW.plan_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_company_subscription
AFTER INSERT OR UPDATE ON company_subscriptions
FOR EACH ROW
EXECUTE FUNCTION audit_company_subscription_change();

-- ============================================================================

COMMIT;

