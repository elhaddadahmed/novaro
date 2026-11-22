/**
 * PHASE 31 – Stripe Integration Service
 * Handle all Stripe operations: customers, subscriptions, invoices, webhooks
 */

import Stripe from 'stripe';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

// ============================================================================
// CUSTOMERS
// ============================================================================

/**
 * Create a Stripe customer for a company
 */
export async function createStripeCustomer(
  company_id: number,
  company_name: string,
  email: string,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      name: company_name,
      email,
      metadata: {
        company_id: company_id.toString(),
        ...metadata,
      },
    });

    logger.info('Stripe customer created', {
      stripe_customer_id: customer.id,
      company_id,
    });

    return customer.id;
  } catch (error) {
    logger.error('Failed to create Stripe customer', {
      error,
      company_id,
    });
    throw error;
  }
}

/**
 * Update Stripe customer metadata
 */
export async function updateStripeCustomer(
  stripe_customer_id: string,
  updates: {
    name?: string;
    email?: string;
    metadata?: Record<string, string>;
  }
): Promise<void> {
  try {
    await stripe.customers.update(stripe_customer_id, {
      name: updates.name,
      email: updates.email,
      metadata: updates.metadata,
    });

    logger.info('Stripe customer updated', { stripe_customer_id });
  } catch (error) {
    logger.error('Failed to update Stripe customer', {
      error,
      stripe_customer_id,
    });
    throw error;
  }
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Create a Stripe subscription for a company
 */
export async function createSubscription(
  stripe_customer_id: string,
  plan_slug: string,
  billing_cycle: 'monthly' | 'annual',
  company_id: number,
  trial_days: number = 14
): Promise<{
  subscription_id: string;
  client_secret?: string;
  status: string;
}> {
  try {
    // Get price ID from environment
    const priceId = getPriceId(plan_slug, billing_cycle);

    const subscription = await stripe.subscriptions.create({
      customer: stripe_customer_id,
      items: [{ price: priceId }],
      trial_period_days: trial_days,
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        company_id: company_id.toString(),
        plan_slug,
        billing_cycle,
      },
    });

    logger.info('Stripe subscription created', {
      stripe_subscription_id: subscription.id,
      company_id,
      plan_slug,
    });

    return {
      subscription_id: subscription.id,
      status: subscription.status,
    };
  } catch (error) {
    logger.error('Failed to create Stripe subscription', {
      error,
      company_id,
      plan_slug,
    });
    throw error;
  }
}

/**
 * Update a subscription (change plan, billing cycle)
 */
export async function updateSubscription(
  stripe_subscription_id: string,
  updates: {
    plan_slug?: string;
    billing_cycle?: 'monthly' | 'annual';
    trial_days?: number;
  }
): Promise<void> {
  try {
    const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);

    if (updates.plan_slug || updates.billing_cycle) {
      const newPriceId = getPriceId(
        updates.plan_slug || subscription.metadata?.plan_slug,
        updates.billing_cycle || subscription.metadata?.billing_cycle
      );

      await stripe.subscriptions.update(stripe_subscription_id, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });
    }

    logger.info('Stripe subscription updated', { stripe_subscription_id });
  } catch (error) {
    logger.error('Failed to update Stripe subscription', {
      error,
      stripe_subscription_id,
    });
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  stripe_subscription_id: string,
  immediate: boolean = false
): Promise<void> {
  try {
    await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: !immediate,
    });

    if (immediate) {
      await stripe.subscriptions.cancel(stripe_subscription_id);
    }

    logger.info('Stripe subscription cancelled', {
      stripe_subscription_id,
      immediate,
    });
  } catch (error) {
    logger.error('Failed to cancel Stripe subscription', {
      error,
      stripe_subscription_id,
    });
    throw error;
  }
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

/**
 * Create a SetupIntent for adding a payment method
 */
export async function createSetupIntent(
  stripe_customer_id: string
): Promise<string> {
  try {
    const intent = await stripe.setupIntents.create({
      customer: stripe_customer_id,
      usage: 'off_session',
    });

    logger.info('SetupIntent created', {
      setup_intent_id: intent.id,
      stripe_customer_id,
    });

    return intent.client_secret!;
  } catch (error) {
    logger.error('Failed to create SetupIntent', {
      error,
      stripe_customer_id,
    });
    throw error;
  }
}

/**
 * Create a PaymentIntent for immediate payment
 */
export async function createPaymentIntent(
  stripe_customer_id: string,
  amount_cents: number,
  description: string
): Promise<string> {
  try {
    const intent = await stripe.paymentIntents.create({
      customer: stripe_customer_id,
      amount: amount_cents,
      currency: 'eur',
      description,
      payment_method_types: ['card', 'sepa_debit'],
      metadata: { description },
    });

    logger.info('PaymentIntent created', {
      payment_intent_id: intent.id,
      stripe_customer_id,
      amount_cents,
    });

    return intent.client_secret!;
  } catch (error) {
    logger.error('Failed to create PaymentIntent', {
      error,
      stripe_customer_id,
      amount_cents,
    });
    throw error;
  }
}

// ============================================================================
// INVOICES
// ============================================================================

/**
 * Create a Stripe invoice (for one-time charges, adjustments, etc.)
 */
export async function createInvoice(
  stripe_customer_id: string,
  items: Array<{
    description: string;
    amount: number; // in cents
  }>,
  metadata: Record<string, string> = {}
): Promise<string> {
  try {
    const invoice = await stripe.invoices.create({
      customer: stripe_customer_id,
      collection_method: 'charge_automatically',
      metadata,
    });

    // Add line items
    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: stripe_customer_id,
        invoice: invoice.id,
        amount: item.amount,
        currency: 'eur',
        description: item.description,
      });
    }

    // Finalize and auto-charge
    await stripe.invoices.finalizeInvoice(invoice.id);

    logger.info('Invoice created and finalized', {
      stripe_invoice_id: invoice.id,
      stripe_customer_id,
    });

    return invoice.id;
  } catch (error) {
    logger.error('Failed to create invoice', {
      error,
      stripe_customer_id,
    });
    throw error;
  }
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    logger.info('Webhook verified', {
      event_id: event.id,
      event_type: event.type,
    });

    return event;
  } catch (error) {
    logger.error('Webhook signature verification failed', { error });
    throw error;
  }
}

/**
 * Handle charge.succeeded event
 */
export async function handleChargeSucceeded(
  stripe_customer_id: string,
  stripe_invoice_id: string | null,
  amount_cents: number
): Promise<void> {
  try {
    // Update company subscription status if past_due
    const { data: subscriptions } = await supabase
      .from('company_subscriptions')
      .select('id')
      .eq('stripe_customer_id', stripe_customer_id)
      .eq('status', 'past_due');

    if (subscriptions && subscriptions.length > 0) {
      await supabase
        .from('company_subscriptions')
        .update({ status: 'active' })
        .eq('stripe_customer_id', stripe_customer_id);

      logger.info('Subscription status updated to active after payment', {
        stripe_customer_id,
      });
    }

    // Update invoice status if exists
    if (stripe_invoice_id) {
      await supabase
        .from('billing_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('stripe_invoice_id', stripe_invoice_id);
    }
  } catch (error) {
    logger.error('Failed to handle charge.succeeded', {
      error,
      stripe_customer_id,
    });
    throw error;
  }
}

/**
 * Handle charge.failed event
 */
export async function handleChargeFailed(
  stripe_customer_id: string,
  reason: string
): Promise<void> {
  try {
    const { data: subscriptions } = await supabase
      .from('company_subscriptions')
      .select('id, company_id')
      .eq('stripe_customer_id', stripe_customer_id)
      .eq('status', 'active');

    if (subscriptions && subscriptions.length > 0) {
      await supabase
        .from('company_subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', stripe_customer_id);

      logger.warn('Subscription marked as past_due', {
        stripe_customer_id,
        reason,
      });

      // TODO: Send email notification to company admin
    }
  } catch (error) {
    logger.error('Failed to handle charge.failed', {
      error,
      stripe_customer_id,
    });
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  stripe_subscription_id: string
): Promise<void> {
  try {
    const { data: subscriptions } = await supabase
      .from('company_subscriptions')
      .select('id, company_id')
      .eq('stripe_subscription_id', stripe_subscription_id);

    if (subscriptions && subscriptions.length > 0) {
      await supabase
        .from('company_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', stripe_subscription_id);

      logger.info('Subscription marked as cancelled', {
        stripe_subscription_id,
      });

      // TODO: Send email notification
    }
  } catch (error) {
    logger.error('Failed to handle customer.subscription.deleted', {
      error,
      stripe_subscription_id,
    });
    throw error;
  }
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  stripe_subscription_id: string
): Promise<void> {
  try {
    const subscription = await stripe.subscriptions.retrieve(
      stripe_subscription_id
    );

    // Update in database
    await supabase
      .from('company_subscriptions')
      .update({
        status: subscription.status as any,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', stripe_subscription_id);

    logger.info('Subscription updated', { stripe_subscription_id });
  } catch (error) {
    logger.error('Failed to handle customer.subscription.updated', {
      error,
      stripe_subscription_id,
    });
    throw error;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get Stripe price ID for a plan and billing cycle
 */
function getPriceId(plan_slug: string, billing_cycle: 'monthly' | 'annual'): string {
  const priceMap: Record<string, Record<string, string>> = {
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
      annual: process.env.STRIPE_PRICE_STARTER_ANNUAL!,
    },
    professional: {
      monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
      annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL!,
    },
    enterprise: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
      annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL!,
    },
  };

  const priceId = priceMap[plan_slug]?.[billing_cycle];
  if (!priceId) {
    throw new Error(`No price ID found for ${plan_slug}/${billing_cycle}`);
  }

  return priceId;
}

/**
 * Format amount in cents to EUR string
 */
export function formatPriceEUR(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

/**
 * Calculate annual discount percentage
 */
export function calculateAnnualDiscount(
  monthly_price_cents: number,
  annual_price_cents: number | null
): number | null {
  if (!annual_price_cents) return null;

  const yearlyFromMonthly = monthly_price_cents * 12;
  const discount = ((yearlyFromMonthly - annual_price_cents) / yearlyFromMonthly) * 100;

  return Math.round(discount);
}

export default {
  createStripeCustomer,
  updateStripeCustomer,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  createSetupIntent,
  createPaymentIntent,
  createInvoice,
  verifyWebhookSignature,
  handleChargeSucceeded,
  handleChargeFailed,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
  formatPriceEUR,
  calculateAnnualDiscount,
};
