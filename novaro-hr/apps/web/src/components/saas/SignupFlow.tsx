/**
 * PHASE 31 – Signup Flow Component
 * Multi-step signup: Email → Company Info → Plan Selection → Payment → Complete
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SignupRequest, PlanSelection } from '@novaro-hr/shared-types/src/saas.types';

type SignupStep = 'email' | 'company' | 'plan' | 'payment' | 'complete';

export function SignupFlow() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<SignupRequest>>({
    country: 'DE',
  });

  const [planData, setPlanData] = useState<Partial<PlanSelection>>({
    billing_cycle: 'monthly',
  });

  const [companyId, setCompanyId] = useState<number | null>(null);

  // ========================================================================
  // STEP 1: Email & Password
  // ========================================================================

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/saas/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          company_name: formData.company_name,
          first_name: formData.first_name,
          last_name: formData.last_name,
          country: formData.country,
          federal_state: formData.federal_state,
          website: formData.website,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Signup failed');
      }

      const data = await response.json();
      setCompanyId(data.company_id);

      // Auto-login user
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email!,
        password: formData.password!,
      });

      if (loginError) throw loginError;

      setStep('plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // STEP 2: Plan Selection
  // ========================================================================

  const handlePlanSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/saas/subscriptions/select-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          company_id: companyId,
          plan_slug: planData.plan_slug,
          billing_cycle: planData.billing_cycle,
          promotional_code: planData.promotional_code,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Plan selection failed');
      }

      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan selection failed');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // STEP 3: Payment
  // ========================================================================

  const handlePaymentComplete = async () => {
    try {
      // After Stripe payment, mark onboarding as complete
      const { data: session } = await supabase.auth.getSession();

      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          onboarding_step: 'complete',
        }),
      });

      if (response.ok) {
        setStep('complete');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
    }
  };

  // ========================================================================
  // RENDERING
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Novaro HR</h1>
            <p className="text-slate-600">
              {step === 'email' && 'Create your account'}
              {step === 'company' && 'Company details'}
              {step === 'plan' && 'Choose your plan'}
              {step === 'payment' && 'Payment method'}
              {step === 'complete' && 'Welcome to Novaro HR!'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Step Indicator */}
          <div className="mb-8 flex justify-between">
            {(['email', 'company', 'plan', 'payment', 'complete'] as SignupStep[]).map(
              (s, i) => (
                <div
                  key={s}
                  className={`h-2 flex-1 mx-1 rounded-full transition-colors ${
                    i === (['email', 'company', 'plan', 'payment', 'complete'].indexOf(step))
                      ? 'bg-blue-600'
                      : i < (['email', 'company', 'plan', 'payment', 'complete'].indexOf(step))
                      ? 'bg-green-600'
                      : 'bg-slate-200'
                  }`}
                />
              )
            )}
          </div>

          {/* Step Content */}
          {step === 'email' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="you@company.de"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Min. 12 characters, uppercase, lowercase, digit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Continue'}
              </button>

              <p className="text-xs text-slate-500 text-center">
                14-day free trial. No credit card required.
              </p>
            </form>
          )}

          {step === 'plan' && (
            <form onSubmit={handlePlanSelection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Plan</label>
                <div className="space-y-2">
                  {['starter', 'professional', 'enterprise'].map((slug) => (
                    <label key={slug} className="flex items-center p-3 border rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="plan"
                        value={slug}
                        checked={planData.plan_slug === slug}
                        onChange={(e) => setPlanData({ ...planData, plan_slug: e.target.value as any })}
                        className="mr-3"
                      />
                      <span className="font-medium text-slate-900 capitalize">{slug}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Billing
                </label>
                <div className="flex gap-2">
                  {['monthly', 'annual'].map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setPlanData({ ...planData, billing_cycle: cycle as any })}
                      className={`flex-1 py-2 rounded-lg font-medium capitalize transition-colors ${
                        planData.billing_cycle === cycle
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-900'
                      }`}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex-1 bg-slate-200 text-slate-900 py-2 rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !planData.plan_slug}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-slate-600">
                  Your 14-day trial is active. Add a payment method to continue after trial.
                </p>
              </div>

              {/* Stripe Payment Element would go here */}
              <div className="p-4 border border-slate-300 rounded-lg bg-slate-50">
                <p className="text-sm text-slate-600 text-center">
                  Stripe Payment Element will appear here
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('plan')}
                  className="flex-1 bg-slate-200 text-slate-900 py-2 rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePaymentComplete}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Account created!</h2>
                <p className="text-slate-600">
                  Your 14-day trial is now active. Let's set up your company.
                </p>
              </div>

              <button
                onClick={() => router.push('/admin')}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Go to Dashboard
              </button>

              <p className="text-xs text-slate-500">
                Need help? <a href="mailto:support@novaro.de" className="text-blue-600 hover:underline">Contact support</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignupFlow;
