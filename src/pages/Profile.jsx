import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon, 
  MapPinIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { getUserProfile, patchUserProfile, changePassword } from '../api/users';
import {
  getSubscriptionEntitlements,
  getPlanCatalog,
  getPlanChangeQuote,
  schedulePlanChange,
  createPlanPaymentOrder,
  confirmPlanPayment,
  getLatestPaymentStatus,
} from '../api/subscription';
import { getUserRole } from '../utils/auth';

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

const BILLING_CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly', discount: '15% off, 3 months' },
  { value: 'yearly', label: 'Yearly', discount: '30% off' },
];

const CYCLE_MULTIPLIERS = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const CYCLE_DISCOUNTS = {
  monthly: 0,
  quarterly: 0.15,
  yearly: 0.30,
};

const formatINR = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

const cyclePriceForPlan = (plan, cycle) => {
  const rawPrice = Number(plan?.[`${cycle}Price`] || 0);
  if (rawPrice > 0 || cycle === 'monthly') {
    return rawPrice;
  }

  const monthlyPrice = Number(plan?.monthlyPrice || 0);
  return monthlyPrice * (CYCLE_MULTIPLIERS[cycle] || 1) * (1 - (CYCLE_DISCOUNTS[cycle] || 0));
};

const originalCyclePriceForPlan = (plan, cycle) => {
  const rawPrice = Number(plan?.[`original${cycle.charAt(0).toUpperCase()}${cycle.slice(1)}Price`] || 0);
  if (rawPrice > 0 || cycle === 'monthly') {
    return rawPrice;
  }

  const originalMonthly = Number(plan?.originalMonthlyPrice || plan?.monthlyPrice || 0);
  return originalMonthly * (CYCLE_MULTIPLIERS[cycle] || 1);
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
      onClose();
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
    },
    onError: (error) => {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && !errorData.detail && !errorData.message) {
          Object.entries(errorData).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => toast.error(`${field}: ${msg}`));
            } else {
              toast.error(`${field}: ${messages}`);
            }
          });
        } else {
          const errorMessage = errorData.detail || errorData.message || 'Failed to change password';
          toast.error(errorMessage);
        }
      } else {
        toast.error('Network error. Please try again.');
      }
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!passwordData.current_password) {
      toast.error('Current password is required');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_new_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bento-card w-full max-w-md p-8 relative animate-fade-up shadow-2xl shadow-cyan-900/20">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <KeyIcon className="w-6 h-6 mr-2 text-cyan-400" />
          Change Password
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="current_password"
                value={passwordData.current_password}
                onChange={handleInputChange}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all pr-12"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showCurrentPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="new_password"
                value={passwordData.new_password}
                onChange={handleInputChange}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all pr-12"
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_new_password"
                value={passwordData.confirm_new_password}
                onChange={handleInputChange}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all pr-12"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn-primary w-full shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePasswordMutation.isPending ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Profile = ({ onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    current_password: '',
    phone: '',
    business_name: '',
    business_address: '',
    gstin: '',
    gem_id: '',
    dl_number: ''
  });
  const [selectedTargetPlanCode, setSelectedTargetPlanCode] = useState('free');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');
  const [isPlanActionLoading, setIsPlanActionLoading] = useState(false);
  const paymentWatchIntervalRef = useRef(null);
  const paymentWatchTimeoutRef = useRef(null);

  const queryClient = useQueryClient();
  const role = getUserRole();
  const isAdmin = role === 'admin';

  // Fetch user profile
  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-entitlements'],
    queryFn: getSubscriptionEntitlements,
    staleTime: 60_000,
  });

  const { data: planCatalogData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getPlanCatalog,
    staleTime: 60_000,
  });

  const { data: latestPaymentStatusData } = useQuery({
    queryKey: ['subscription-latest-payment-status'],
    queryFn: getLatestPaymentStatus,
    staleTime: 30_000,
  });

  const planRank = (code) => {
    const normalizedCode = String(code || '').toLowerCase();
    if (normalizedCode === 'business') return 2;
    if (normalizedCode === 'pro') return 1;
    return 0;
  };

  // Update form data when user profile is loaded
  useEffect(() => {
    if (userProfile && userProfile.profile) {
      const profile = userProfile.profile;
      setFormData(prev => ({
        ...prev,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        current_password: '',
        phone: profile.phone || '',
        business_name: profile.business_name || '',
        business_address: profile.business_address || '',
          gstin: profile.gstin || '',
          gem_id: profile.gem_id || '',
          dl_number: profile.dl_number || ''
      }));
    }
  }, [userProfile]);

  useEffect(() => {
    const currentCode = String(subscriptionData?.data?.plan?.code || userProfile?.profile?.plan_code || 'free').toLowerCase();
    setSelectedTargetPlanCode(currentCode === 'starter' ? 'free' : currentCode);
    const currentCycle = String(subscriptionData?.data?.plan?.current_billing_cycle || 'monthly').toLowerCase();
    const validCycle = BILLING_CYCLE_OPTIONS.some((cycle) => cycle.value === currentCycle) ? currentCycle : 'monthly';
    setSelectedBillingCycle(currentCode === 'free' || currentCode === 'starter' ? 'monthly' : validCycle);
  }, [subscriptionData?.data?.plan?.code, subscriptionData?.data?.plan?.current_billing_cycle, userProfile?.profile?.plan_code]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: patchUserProfile,
    onSuccess: async (data) => {
      // Refetch the profile data to ensure we have the latest
      await queryClient.invalidateQueries(['userProfile']);
      await queryClient.refetchQueries(['userProfile']);
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    },
    onError: (error) => {
      // Handle different types of errors
      if (error.response?.data) {
        const errorData = error.response.data;
        const fieldErrors = errorData?.errors && typeof errorData.errors === 'object'
          ? errorData.errors
          : (typeof errorData === 'object' && !errorData.detail && !errorData.message ? errorData : null);
        
        // Check for field-specific errors
        if (fieldErrors) {
          // Display field-specific errors
          Object.entries(fieldErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => toast.error(`${field}: ${msg}`));
            } else {
              toast.error(`${field}: ${messages}`);
            }
          });
        } else {
          // Display general error message
          const errorMessage = errorData.detail || 
                              errorData.message || 
                              'Failed to update profile';
          toast.error(errorMessage);
        }
      } else {
        toast.error('Network error. Please check your connection and try again.');
      }
    }
  });

  const { data: planQuoteData, isFetching: quoteLoading } = useQuery({
    queryKey: ['plan-change-quote', selectedTargetPlanCode, selectedBillingCycle],
    queryFn: () => getPlanChangeQuote(selectedTargetPlanCode, selectedBillingCycle),
    enabled: isAdmin && !!selectedTargetPlanCode,
    staleTime: 30_000,
  });

  const clearPaymentWatcher = () => {
    if (paymentWatchIntervalRef.current) {
      clearInterval(paymentWatchIntervalRef.current);
      paymentWatchIntervalRef.current = null;
    }
    if (paymentWatchTimeoutRef.current) {
      clearTimeout(paymentWatchTimeoutRef.current);
      paymentWatchTimeoutRef.current = null;
    }
  };

  const startBackgroundPaymentWatcher = (orderId) => {
    clearPaymentWatcher();

    const poll = async () => {
      try {
        const latest = await getLatestPaymentStatus();
        const latestData = latest?.data;
        if (!latestData || latestData.order_id !== orderId) {
          return;
        }

        const state = String(latestData.status || '').toLowerCase();
        if (state === 'success') {
          clearPaymentWatcher();
          toast.success('Payment confirmed. Refreshing your profile...');
          await queryClient.invalidateQueries(['subscription-entitlements']);
          await queryClient.invalidateQueries(['profile']);
          await queryClient.invalidateQueries(['userProfile']);
          await queryClient.invalidateQueries(['subscription-latest-payment-status']);
          window.location.reload();
          return;
        }

        if (state === 'failed') {
          clearPaymentWatcher();
          toast.error('Payment failed. Please retry.');
        }
      } catch (_err) {
        // Keep polling; transient failures should not break watcher.
      }
    };

    paymentWatchIntervalRef.current = setInterval(poll, 5000);
    paymentWatchTimeoutRef.current = setTimeout(() => {
      clearPaymentWatcher();
    }, 10 * 60 * 1000);

    poll();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    if (!orderId) {
      return undefined;
    }

    startBackgroundPaymentWatcher(orderId);

    // Clean URL to avoid repeated watcher startup on future renders.
    params.delete('order_id');
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);

    return () => {
      clearPaymentWatcher();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format GSTIN to uppercase
    if (name === 'gstin') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting profile update...', formData);
    const originalEmail = String(userProfile?.profile?.email || '').trim().toLowerCase();
    const updatedEmail = String(formData.email || '').trim().toLowerCase();
    const isEmailChanged = !!updatedEmail && updatedEmail !== originalEmail;

    if (isEmailChanged && !String(formData.current_password || '').trim()) {
      toast.error('Current password is required to change email');
      return;
    }

    // Prepare data for submission
    const updateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      business_name: formData.business_name,
      business_address: formData.business_address,
      gstin: formData.gstin,
      gem_id: formData.gem_id,
      dl_number: formData.dl_number
    };

    if (isEmailChanged) {
      updateData.current_password = formData.current_password;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
    if (userProfile && userProfile.profile) {
      const profile = userProfile.profile;
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        current_password: '',
        phone: profile.phone || '',
        business_name: profile.business_name || '',
        business_address: profile.business_address || '',
        gstin: profile.gstin || '',
        gem_id: profile.gem_id || '',
        dl_number: profile.dl_number || ''
      });
    }
  };

  const handlePlanAction = async () => {
    const quote = planQuoteData?.data;
    if (!quote) {
      toast.error('Unable to load plan quote right now.');
      return;
    }

    if (quote.action === 'unsupported_paid_schedule' || quote.action === 'downgrade_not_allowed') {
      toast.info('Downgrades are not available from profile. Renew the current plan or upgrade instead.');
      return;
    }

    try {
      setIsPlanActionLoading(true);

      if (quote.payment_required) {
        const openCashfreeCheckout = async (order, allowRetry = true) => {
          if (!order.payment_session_id || !order.order_id) {
            throw new Error('Missing payment session details from server.');
          }

          const CashfreeConstructor = await loadCashfreeSdk();
          if (!CashfreeConstructor) {
            throw new Error('Cashfree checkout unavailable.');
          }

          const mode = String(order.cashfree_env || import.meta.env.VITE_CASHFREE_ENV || 'sandbox').toLowerCase() === 'production'
            ? 'production'
            : 'sandbox';
          const cashfree = CashfreeConstructor({ mode });

          try {
            await cashfree.checkout({
              paymentSessionId: order.payment_session_id,
              redirectTarget: '_modal',
            });
          } catch (checkoutError) {
            const code = String(checkoutError?.code || '').toLowerCase();
            const message = String(checkoutError?.message || '').toLowerCase();
            const isInvalidSession = code === 'payment_session_id_invalid' || message.includes('payment_session_id');

            if (allowRetry && isInvalidSession) {
              const freshOrderRes = await createPlanPaymentOrder(selectedTargetPlanCode, {
                billingCycle: selectedBillingCycle,
                forceNewOrder: true,
              });
              const freshOrder = freshOrderRes?.data || {};
              return openCashfreeCheckout(freshOrder, false);
            }

            throw checkoutError;
          }

          return order;
        };

        const orderRes = await createPlanPaymentOrder(selectedTargetPlanCode, { billingCycle: selectedBillingCycle });
        const order = orderRes?.data || {};
        const activeOrder = order.skip_checkout ? order : await openCashfreeCheckout(order, true);

        let confirmed = false;
        let lastStatus = '';

        for (let attempt = 0; attempt < 8; attempt += 1) {
          const confirmRes = await confirmPlanPayment(activeOrder.order_id);
          if (confirmRes?.success) {
            confirmed = true;
            break;
          }

          lastStatus = String(confirmRes?.data?.status || '').toLowerCase();
          if (lastStatus === 'failed') {
            throw new Error(confirmRes?.data?.message || 'Payment failed.');
          }

          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        if (!confirmed) {
          toast.info('Payment is still processing. We will auto-refresh this page once it is confirmed.');
          startBackgroundPaymentWatcher(activeOrder.order_id);
          await queryClient.invalidateQueries(['subscription-latest-payment-status']);
        } else {
          toast.success('Plan updated successfully. Refreshing your profile...');
          await queryClient.invalidateQueries(['subscription-entitlements']);
          await queryClient.invalidateQueries(['profile']);
          await queryClient.invalidateQueries(['userProfile']);
          await queryClient.invalidateQueries(['subscription-latest-payment-status']);
          window.location.reload();
          return;
        }
      } else {
        const scheduleRes = await schedulePlanChange(selectedTargetPlanCode, selectedBillingCycle);
        if (!scheduleRes?.success) {
          throw new Error('Unable to schedule plan change.');
        }
        toast.success(scheduleRes?.data?.message || 'Next plan has been scheduled.');
      }

      await queryClient.invalidateQueries(['subscription-entitlements']);
      await queryClient.invalidateQueries(['profile']);
      await queryClient.invalidateQueries(['userProfile']);
      await queryClient.invalidateQueries(['subscription-latest-payment-status']);
    } catch (actionError) {
      const msg = actionError?.response?.data?.error || actionError?.message || 'Plan change failed.';
      toast.error(msg);
    } finally {
      setIsPlanActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="page-bg">
          <div className="container mx-auto px-4 py-8">
            <Loader />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout onLogout={onLogout}>
        <div className="page-bg">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-8 text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Profile</h2>
                <p className="text-white/80">
                  {error.response?.data?.detail || 'Failed to load profile data'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'Your Name';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
  const memberDays = userProfile?.account_stats?.days_since_signup || 0;
  const trialDays = userProfile?.account_stats?.trial_days_remaining ?? '-';
  const totalInvoices = userProfile?.account_stats?.total_invoices ?? 0;
  const entitlementPlan = subscriptionData?.data?.plan || {};
  const entitlementPlanName = entitlementPlan?.name || userProfile?.profile?.plan_name || 'Starter';
  const entitlementPlanCode = String(entitlementPlan?.code || userProfile?.profile?.plan_code || 'starter').toLowerCase();
  const entitlementExpiry = entitlementPlan?.current_period_end ? new Date(entitlementPlan.current_period_end) : null;
  const hasEntitlementExpiry = entitlementExpiry && !Number.isNaN(entitlementExpiry.getTime());
  const isVipAccess = subscriptionData?.data?.is_vip || false;
  const isFreeOrStarter = entitlementPlanCode === 'free' || entitlementPlanCode === 'starter';
  const shouldShowPaidExpiry = hasEntitlementExpiry && !isFreeOrStarter && !isVipAccess;
  const expiryDaysLeft = hasEntitlementExpiry
    ? Math.ceil((entitlementExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;
  const quote = planQuoteData?.data;
  const latestPayment = latestPaymentStatusData?.data || null;
  const planCatalog = planCatalogData?.data || [];
  const currentPlanRank = planRank(entitlementPlanCode);
  const availablePlanOptions = planCatalog
    .map((plan) => ({
      code: String(plan.code || '').toLowerCase(),
      name: plan.name,
      monthlyPrice: plan.monthly_price,
      quarterlyPrice: plan.quarterly_price,
      yearlyPrice: plan.yearly_price,
      originalMonthlyPrice: plan.original_monthly_price,
      originalQuarterlyPrice: plan.original_quarterly_price,
      originalYearlyPrice: plan.original_yearly_price,
    }))
    .filter((plan) => planRank(plan.code) >= currentPlanRank)
    .sort((left, right) => planRank(left.code) - planRank(right.code));
  const selectedPlanOption = availablePlanOptions.find((plan) => plan.code === selectedTargetPlanCode);
  const selectedPlanIsPaid = selectedTargetPlanCode !== 'free' && selectedTargetPlanCode !== 'starter';
  const selectedCyclePrice = selectedPlanOption ? cyclePriceForPlan(selectedPlanOption, selectedBillingCycle) : null;
  const selectedCycleOriginalPrice = selectedPlanOption ? originalCyclePriceForPlan(selectedPlanOption, selectedBillingCycle) : null;
  const selectedCycleHasDiscount = Number(selectedCycleOriginalPrice || 0) > Number(selectedCyclePrice || 0);

  let planActionLabel = 'Apply Plan Change';
  if (quote?.payment_required) {
    planActionLabel = `Pay INR ${formatINR(quote.amount)} and Continue`;
  } else if (quote?.action === 'unsupported_paid_schedule') {
    planActionLabel = 'Downgrade Not Available';
  }

  let expiryLabel = 'Not applicable';
  let expirySubLabel = 'Upgrade to Pro or Business for renewable billing.';
  if (isVipAccess) {
    expiryLabel = 'Lifetime';
    expirySubLabel = 'VIP access does not expire.';
  } else if (shouldShowPaidExpiry) {
    if (expiryDaysLeft < 0) {
      expiryLabel = 'Expired';
      expirySubLabel = `Expired on ${entitlementExpiry.toLocaleDateString()}`;
    } else {
      expiryLabel = `${expiryDaysLeft} day${expiryDaysLeft === 1 ? '' : 's'} left`;
      expirySubLabel = `Renews/expires on ${entitlementExpiry.toLocaleDateString()}`;
    }
  } else if (!isFreeOrStarter) {
    expiryLabel = 'Unavailable';
    expirySubLabel = 'Expiry date will appear once billing cycle is active.';
  }

  let profileExpiryBadge = null;
  if (isVipAccess) {
    profileExpiryBadge = 'Lifetime';
  } else if (shouldShowPaidExpiry) {
    profileExpiryBadge = expiryDaysLeft < 0
      ? 'Expired'
      : `${expiryDaysLeft}d left`;
  }

  const paymentStatusLabel = String(latestPayment?.status || '').toLowerCase();
  const paymentStatusTone = paymentStatusLabel === 'success'
    ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
    : paymentStatusLabel === 'failed'
      ? 'text-rose-300 border-rose-500/40 bg-rose-500/10'
      : 'text-amber-200 border-amber-500/40 bg-amber-500/10';

  const roleLabel = isAdmin
    ? (userProfile?.profile?.business_name || 'Business Owner')
    : (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Team Member');

  const originalEmail = String(userProfile?.profile?.email || '').trim().toLowerCase();
  const updatedEmail = String(formData.email || '').trim().toLowerCase();
  const emailChanged = !!updatedEmail && updatedEmail !== originalEmail;

  return (
    <Layout onLogout={onLogout}>
      <div className="page-bg relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-0 top-52 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-8 lg:py-12">
          <div className="mx-auto max-w-7xl space-y-7">
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-blue-500/20 ring-1 ring-white/20 md:h-20 md:w-20">
                    <span className="text-2xl font-semibold tracking-wide text-white md:text-3xl">{initials}</span>
                    {profileExpiryBadge && (
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-cyan-300/40 bg-slate-900 px-3 py-1 text-xs font-bold text-cyan-100 shadow-lg shadow-black/50">
                        {profileExpiryBadge}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">Profile Workspace</p>
                    <h1 className="mt-1 text-3xl font-semibold text-white md:text-4xl">{fullName}</h1>
                    <p className="mt-2 text-sm text-white/65">{roleLabel}</p>
                    {isAdmin && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85">
                        <ShieldCheckIcon className={`h-4 w-4 ${(userProfile?.profile?.plan_name || '').includes('Starter') ? 'text-amber-300' : 'text-emerald-300'}`} />
                        {userProfile?.profile?.plan_name || 'Plan'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/10"
                  >
                    <KeyIcon className="h-4 w-4 text-cyan-300" />
                    Change Password
                  </button>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-7 xl:grid-cols-12">
              <aside className="space-y-6 xl:col-span-4">
                <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
                  <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-white">
                    <ChartBarIcon className="h-5 w-5 text-cyan-300" />
                    Account Signals
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Member Since</p>
                      <p className="mt-1 text-lg font-semibold text-white">{memberDays} days</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Trial Status</p>
                      <p className="mt-1 text-lg font-semibold text-white">{trialDays} days left</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Plan Expiry</p>
                      <p className="mt-1 text-lg font-semibold text-white">{expiryLabel}</p>
                      <p className="mt-1 text-xs text-white/55">{expirySubLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Invoices Generated</p>
                      <p className="mt-1 text-lg font-semibold text-white">{totalInvoices}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
                  <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                    <CalendarIcon className="h-5 w-5 text-cyan-300" />
                    Plan Management
                  </h3>
                  <div className="space-y-4">
                    {isVipAccess ? (
                      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                        <p className="text-sm font-semibold text-amber-300">✦ VIP Customer</p>
                        <p className="mt-2 text-xs text-white/70">You have VIP access. Plan management is not available for VIP customers. Contact support for any changes.</p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Current Plan</p>
                          <p className="mt-1 text-lg font-semibold text-white">{entitlementPlanName}</p>
                        </div>

                        {isAdmin ? (
                          <>
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/55">Choose Plan</label>
                              <select
                                value={selectedTargetPlanCode}
                                onChange={(e) => {
                                  const nextPlanCode = e.target.value;
                                  setSelectedTargetPlanCode(nextPlanCode);
                                  if (nextPlanCode === 'free' || nextPlanCode === 'starter') {
                                    setSelectedBillingCycle('monthly');
                                  }
                                }}
                                className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white focus:border-cyan-300/60 focus:outline-none"
                                disabled={isPlanActionLoading}
                              >
                                {availablePlanOptions.map((planOption) => (
                                  <option key={planOption.code} value={planOption.code}>
                                    {planOption.name} {planOption.code !== 'free' && planOption.code !== 'starter' ? `(INR ${formatINR(planOption.monthlyPrice)}/month)` : '(INR 0)'}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {selectedPlanIsPaid && (
                              <div>
                                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/55">Billing Cycle</label>
                                <select
                                  value={selectedBillingCycle}
                                  onChange={(e) => setSelectedBillingCycle(e.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white focus:border-cyan-300/60 focus:outline-none"
                                  disabled={isPlanActionLoading}
                                >
                                  {BILLING_CYCLE_OPTIONS.map((cycle) => (
                                    <option key={cycle.value} value={cycle.value}>
                                      {cycle.label}{cycle.discount ? ` (${cycle.discount})` : ''}
                                    </option>
                                  ))}
                                </select>
                                {!!selectedCyclePrice && (
                                  <p className="mt-2 text-xs text-white/60">
                                    INR {formatINR(selectedCyclePrice)}
                                    {selectedCycleHasDiscount && (
                                      <span className="ml-2 line-through">INR {formatINR(selectedCycleOriginalPrice)}</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              {quoteLoading ? (
                                <p className="text-sm text-white/85">Loading quote...</p>
                              ) : quote ? (
                                <div className="space-y-3">
                                  {!!quote.summary && <p className="text-sm font-medium text-white/90">{quote.summary}</p>}
                                  
                                  <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                                    <div className="flex justify-between text-xs text-white/60">
                                      <span>Plan Value ({formatINR(quote.base_price_before_discount / (CYCLE_MULTIPLIERS[selectedBillingCycle] || 1))} × {CYCLE_MULTIPLIERS[selectedBillingCycle] || 1} months)</span>
                                      <span>INR {formatINR(quote.base_price_before_discount)}</span>
                                    </div>
                                    
                                    {Number(quote.base_price_before_discount) > Number(quote.new_plan_full_price) && (
                                      <div className="flex justify-between text-xs text-emerald-400/80">
                                        <span>Plan Discount ({selectedBillingCycle === 'yearly' ? '30%' : '15%'} off)</span>
                                        <span>- INR {formatINR(Number(quote.base_price_before_discount) - Number(quote.new_plan_full_price))}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between text-xs text-white/80 font-medium border-t border-white/5 pt-1">
                                      <span>Discounted Plan Price</span>
                                      <span>INR {formatINR(quote.new_plan_full_price)}</span>
                                    </div>

                                    {Number(quote.credit || 0) > 0 && (
                                      <div className="flex justify-between text-xs text-cyan-400/90 italic">
                                        <span>Credit for unused days</span>
                                        <span>- INR {formatINR(quote.credit)}</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold text-cyan-300">
                                      <span>Total Final Payment</span>
                                      <span>INR {formatINR(quote.amount)}</span>
                                    </div>
                                    
                                    {Number(quote.credit || 0) > 0 && (
                                      <p className="mt-2 text-[10px] italic text-white/40">
                                        Credit based on {quote.days_used} day(s) used at INR {formatINR(quote.current_daily_rate)}/day.
                                      </p>
                                    )}
                                  </div>

                                  {!Number(quote.credit || 0) && !!quote.effective_at && (
                                    <p className="mt-2 text-xs text-white/55">
                                      Effective on {new Date(quote.effective_at).toLocaleDateString()}
                                      {quote.action === 'renewal' && " (appends to current period)"}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-white/85">Choose a plan to see exact billing behavior.</p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={handlePlanAction}
                              disabled={
                                isPlanActionLoading ||
                                quoteLoading ||
                                !quote ||
                                quote?.action === 'downgrade_not_allowed' ||
                                quote?.action === 'unsupported_paid_schedule' ||
                                (selectedTargetPlanCode === entitlementPlanCode && !quote?.payment_required)
                              }
                              className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isPlanActionLoading ? 'Processing...' : planActionLabel}
                            </button>
                          </>
                        ) : (
                          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65">
                            Only tenant admin can change billing plans.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
                  <h3 className="mb-4 text-base font-semibold text-white">Identity Snapshot</h3>
                  <div className="space-y-3 text-sm text-white/75">
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <EnvelopeIcon className="h-4 w-4 text-cyan-300" />
                      <span className="truncate">{formData.email || 'No email added'}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <PhoneIcon className="h-4 w-4 text-cyan-300" />
                      <span>{formData.phone || 'No phone added'}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <BuildingOfficeIcon className="h-4 w-4 text-cyan-300" />
                      <span className="truncate">{formData.business_name || 'No business name'}</span>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <MapPinIcon className="mt-0.5 h-4 w-4 text-cyan-300" />
                      <span className="line-clamp-3">{formData.business_address || 'No address added'}</span>
                    </div>
                  </div>
                </section>

                {latestPayment && (
                  <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
                    <h3 className="mb-4 text-base font-semibold text-white">Last Payment Status</h3>
                    <div className="space-y-3 text-sm text-white/75">
                      <div className={`rounded-xl border px-3 py-2 ${paymentStatusTone}`}>
                        <p className="text-xs uppercase tracking-[0.16em]">Status</p>
                        <p className="mt-1 text-sm font-semibold uppercase">{latestPayment.status}</p>
                      </div>
                      <p><span className="text-white/55">Order:</span> {latestPayment.order_id}</p>
                      <p><span className="text-white/55">Plan:</span> {latestPayment.plan_name}</p>
                      <p><span className="text-white/55">Amount:</span> INR {latestPayment.amount}</p>
                      {!!latestPayment.failure_reason && (
                        <p><span className="text-white/55">Reason:</span> {latestPayment.failure_reason}</p>
                      )}
                      {!!latestPayment.created_at && (
                        <p><span className="text-white/55">Created:</span> {new Date(latestPayment.created_at).toLocaleString()}</p>
                      )}
                      {!!latestPayment.paid_at && (
                        <p><span className="text-white/55">Confirmed:</span> {new Date(latestPayment.paid_at).toLocaleString()}</p>
                      )}
                    </div>
                  </section>
                )}
              </aside>

              <section className="xl:col-span-8">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl md:p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Account Details</h2>
                      <p className="mt-1 text-sm text-white/55">Refined profile controls for daily operations and billing identity.</p>
                    </div>
                  </div>

                  <form id="profile-form" onSubmit={handleSubmit} className="space-y-7">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        <UserIcon className="h-4 w-4" />
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="First name"
                        />
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        <EnvelopeIcon className="h-4 w-4" />
                        Contact Details
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="name@example.com"
                        />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="Phone number"
                        />
                      </div>
                      {isEditing && emailChanged && (
                        <div className="mt-4">
                          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-amber-300/80">
                            Confirm Current Password (required for email change)
                          </label>
                          <input
                            type="password"
                            name="current_password"
                            value={formData.current_password}
                            onChange={handleInputChange}
                            disabled={updateProfileMutation.isPending}
                            className="w-full rounded-xl border border-amber-400/40 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-300/70 focus:outline-none disabled:opacity-60"
                            placeholder="Enter current password"
                          />
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        Business Information
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <input
                          type="text"
                          name="business_name"
                          value={formData.business_name}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="Business name"
                        />
                        <input
                          type="text"
                          name="gstin"
                          value={formData.gstin}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="GSTIN"
                          maxLength={15}
                        />
                        <input
                          type="text"
                          name="gem_id"
                          value={formData.gem_id}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="GEM ID"
                        />
                        <input
                          type="text"
                          name="dl_number"
                          value={formData.dl_number}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                          placeholder="DL Number"
                        />
                      </div>
                      <textarea
                        name="business_address"
                        value={formData.business_address}
                        onChange={handleInputChange}
                        disabled={!isEditing || updateProfileMutation.isPending}
                        rows={4}
                        className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-[#0f1014] px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none disabled:opacity-60"
                        placeholder="Business address"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-6">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </section>
            </div>
          </div>
        </div>
        
        {/* Password Modal */}
        <ChangePasswordModal 
          isOpen={isPasswordModalOpen} 
          onClose={() => setIsPasswordModalOpen(false)} 
        />
      </div>
    </Layout>
  );
};

export default Profile;
