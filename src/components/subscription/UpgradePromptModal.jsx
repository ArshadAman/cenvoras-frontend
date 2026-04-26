import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createPlanPaymentOrder, confirmPlanPayment, getPlanCatalog } from '../../api/subscription';

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly', discount: '15% off' },
  { value: 'yearly', label: 'Yearly', discount: '30% off' },
];

const normalizePlanCode = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'business' || normalized === 'enterprise') return 'business';
  if (normalized === 'pro' || normalized === 'growth') return 'pro';
  return 'pro';
};

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

const loadCashfreeSdk = () => {
  if (window.Cashfree) {
    return Promise.resolve(window.Cashfree);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-cashfree-sdk="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Cashfree));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.dataset.cashfreeSdk = 'true';
    script.onload = () => resolve(window.Cashfree);
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.body.appendChild(script);
  });
};

export default function UpgradePromptModal({
  isOpen,
  onClose,
  title = 'Upgrade required',
  featureName = 'this feature',
  currentPlanName = 'Free',
  targetPlanName = 'Pro',
  targetPlanCode = '',
  description = '',
  ctaLabel = '',
  subtitle = '',
}) {
  const [isPaying, setIsPaying] = React.useState(false);
  const [billingCycle, setBillingCycle] = React.useState('monthly');
  const resolvedTargetPlanCode = React.useMemo(
    () => normalizePlanCode(targetPlanCode || targetPlanName),
    [targetPlanCode, targetPlanName]
  );

  const { data: planCatalogData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getPlanCatalog,
    staleTime: 60_000,
    enabled: isOpen,
  });

  const targetPlan = (planCatalogData?.data || []).find(
    (plan) => String(plan.code || '').toLowerCase() === resolvedTargetPlanCode
  );
  const cyclePrice = targetPlan?.[`${billingCycle}_price`];
  const originalCyclePrice = targetPlan?.[`original_${billingCycle}_price`];
  const hasOriginalPrice = Number(originalCyclePrice || 0) > Number(cyclePrice || 0);

  React.useEffect(() => {
    if (isOpen) {
      setBillingCycle('monthly');
    }
  }, [isOpen, resolvedTargetPlanCode]);

  const handlePayAndUpgrade = async () => {
    try {
      setIsPaying(true);

      const orderRes = await createPlanPaymentOrder(resolvedTargetPlanCode, { billingCycle });
      const order = orderRes?.data || {};

      if (!order.order_id) {
        throw new Error('Missing order details from server.');
      }

      if (order.skip_checkout) {
        const confirmRes = await confirmPlanPayment(order.order_id);
        if (!confirmRes?.success) {
          throw new Error('Payment not confirmed yet. Please wait a moment and retry.');
        }

        toast.success(`Plan upgraded to ${targetPlanName}.`);
        onClose();
        window.location.reload();
        return;
      }

      if (!order.payment_session_id) {
        throw new Error('Missing payment session details from server.');
      }

      const CashfreeConstructor = await loadCashfreeSdk();
      if (!CashfreeConstructor) {
        throw new Error('Cashfree checkout unavailable.');
      }

      const mode = (import.meta.env.VITE_CASHFREE_ENV || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox';
      const cashfree = CashfreeConstructor({ mode });

      await cashfree.checkout({
        paymentSessionId: order.payment_session_id,
        redirectTarget: '_modal',
      });

      const confirmRes = await confirmPlanPayment(order.order_id);
      if (!confirmRes?.success) {
        throw new Error('Payment not confirmed yet. Please wait a moment and retry.');
      }

      toast.success(`Plan upgraded to ${targetPlanName}.`);
      onClose();
      window.location.reload();
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Upgrade payment failed.';
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f0f12] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
              <LockClosedIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="mt-1 text-sm text-gray-400">
                {subtitle || `${featureName} is not included in your current ${currentPlanName} plan.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm leading-6 text-gray-300">
            {description || `Upgrade to ${targetPlanName} to unlock ${featureName}. This keeps the feature visible while making the restriction obvious.`}
          </p>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-gray-500">Billing cycle</label>
            <select
              value={billingCycle}
              onChange={(event) => setBillingCycle(event.target.value)}
              disabled={isPaying}
              className="w-full rounded-xl border border-white/10 bg-[#14151a] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 disabled:opacity-60"
            >
              {BILLING_CYCLES.map((cycle) => (
                <option key={cycle.value} value={cycle.value}>
                  {cycle.label}{cycle.discount ? ` (${cycle.discount})` : ''}
                </option>
              ))}
            </select>
            {!!cyclePrice && (
              <p className="mt-2 text-sm text-gray-300">
                INR {formatAmount(cyclePrice)}
                {hasOriginalPrice && (
                  <span className="ml-2 text-xs text-gray-500 line-through">INR {formatAmount(originalCyclePrice)}</span>
                )}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">What happens next</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>• Your current data stays intact.</div>
              <div>• You can upgrade without losing invoices, customers, or reports.</div>
              <div>• Complete one-time payment to activate {targetPlanName}.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPaying}
              onClick={handlePayAndUpgrade}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPaying ? 'Processing...' : (ctaLabel || `Pay & Upgrade to ${targetPlanName}`)}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
