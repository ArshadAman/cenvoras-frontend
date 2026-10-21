import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
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
  KeyIcon,
  BuildingLibraryIcon,
  QrCodeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Select from 'react-select';
import { State, City } from 'country-state-city';
import { getGSTStateCode } from '../utils/indiaData';
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
import { hrApi } from '../api/hr';
import OnboardingWizard from '../components/OnboardingWizard';

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

const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: 'var(--bg-surface)',
        borderColor: state.isFocused ? 'var(--accent-primary)' : 'var(--border-subtle)',
        borderRadius: '0.75rem',
        padding: '2px',
        color: 'var(--text-primary)',
        boxShadow: state.isFocused ? '0 0 0 1px var(--accent-primary)' : 'none',
        '&:hover': {
            borderColor: 'var(--accent-primary)'
        }
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.75rem',
        zIndex: 50
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? 'var(--accent-primary)' : state.isFocused ? 'var(--bg-primary)' : 'transparent',
        color: state.isSelected ? 'var(--text-on-accent)' : 'var(--text-primary)',
        '&:active': {
            backgroundColor: 'var(--accent-primary)'
        }
    }),
    singleValue: (provided) => ({
        ...provided,
        color: 'var(--text-primary)'
    }),
    input: (provided) => ({
        ...provided,
        color: 'var(--text-primary)'
    }),
    placeholder: (provided) => ({
        ...provided,
        color: 'var(--text-muted)'
    })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bento-card border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] w-full max-w-md p-8 relative animate-fade-up shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center">
          <KeyIcon className="w-6 h-6 mr-2 text-[var(--accent-primary)]" />
          Change Password
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="current_password"
                value={passwordData.current_password}
                onChange={handleInputChange}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none transition-all pr-12"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showCurrentPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="new_password"
                value={passwordData.new_password}
                onChange={handleInputChange}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none transition-all pr-12"
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_new_password"
                value={passwordData.confirm_new_password}
                onChange={handleInputChange}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none transition-all pr-12"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePasswordMutation.isPending ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const normalizeAccounts = (accounts, p) => {
  if (Array.isArray(accounts) && accounts.length > 0) {
    return accounts.map((acc, idx) => ({
      id: acc.id || `bank_acc_${idx + 1}`,
      account_name: acc.account_name || `Account ${idx + 1}`,
      bank_name: acc.bank_name || '',
      account_number: acc.account_number || '',
      ifsc_code: acc.ifsc_code || '',
      account_holder: acc.account_holder || p?.business_name || '',
      branch: acc.branch || '',
      upi_id: acc.upi_id || '',
      qr_code: acc.qr_code || '',
      is_default: Boolean(acc.is_default),
    }));
  }
  if (p?.bank_name || p?.bank_account_number) {
    return [{
      id: 'bank_acc_1',
      account_name: 'Primary Account',
      bank_name: p.bank_name || '',
      account_number: p.bank_account_number || '',
      ifsc_code: p.bank_ifsc_code || '',
      account_holder: p.business_name || '',
      branch: p.bank_branch || '',
      upi_id: p.bank_upi_id || '',
      qr_code: p.bank_qr_code || '',
      is_default: true,
    }];
  }
  return [{
    id: 'bank_acc_1',
    account_name: 'Primary Account',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder: p?.business_name || '',
    branch: '',
    upi_id: '',
    qr_code: '',
    is_default: true,
  }];
};

const Profile = ({ onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeBankIndex, setActiveBankIndex] = useState(0);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    current_password: '',
    phone: '',
    business_name: '',
    business_address: '',
    gstin: '',
    pan_number: '',
    trn: '',
    country: 'IN',
    gem_id: '',
    dl_number: '',
    state: '',
    city: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_branch: '',
    bank_upi_id: '',
    bank_qr_code: '',
    bank_accounts: []
  });
  const [selectedTargetPlanCode, setSelectedTargetPlanCode] = useState('free');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');
  const [isPlanActionLoading, setIsPlanActionLoading] = useState(false);
  const paymentWatchIntervalRef = useRef(null);
  const paymentWatchTimeoutRef = useRef(null);
  const [showWizard, setShowWizard] = useState(false);

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

  const { data: employeeData } = useQuery({
    queryKey: ['employeeProfile'],
    queryFn: () => hrApi.getEmployees().then(res => {
      const emps = res?.data?.results || res?.data || [];
      return emps[0] || null;
    }),
    enabled: role === 'employee'
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
        pan_number: profile.pan_number || '',
        trn: profile.trn || '',
        country: profile.country || 'IN',
        gem_id: profile.gem_id || '',
        dl_number: profile.dl_number || '',
        state: profile.state || '',
        city: profile.city || '',
        bank_name: profile.bank_name || '',
        bank_account_number: profile.bank_account_number || '',
        bank_ifsc_code: profile.bank_ifsc_code || '',
        bank_branch: profile.bank_branch || '',
        bank_upi_id: profile.bank_upi_id || '',
        bank_qr_code: profile.bank_qr_code || '',
        bank_accounts: normalizeAccounts(profile.bank_accounts, profile)
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
    if (name === 'gstin' || name === 'pan_number' || name === 'bank_ifsc_code') {
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

  const profile = userProfile?.profile || {};
  const originalAccounts = normalizeAccounts(profile.bank_accounts, profile);
  const currentAccounts = formData.bank_accounts || [];
  const bankFieldsChanged = JSON.stringify(originalAccounts) !== JSON.stringify(currentAccounts);

  const handleBankAccountChange = (field, value) => {
    setFormData(prev => {
      const accounts = [...(prev.bank_accounts || [])];
      if (!accounts[activeBankIndex]) return prev;
      accounts[activeBankIndex] = {
        ...accounts[activeBankIndex],
        [field]: value
      };
      const defaultAcc = accounts.find(a => a.is_default) || accounts[0] || {};
      return {
        ...prev,
        bank_accounts: accounts,
        bank_name: defaultAcc.bank_name || '',
        bank_account_number: defaultAcc.account_number || '',
        bank_ifsc_code: defaultAcc.ifsc_code || '',
        bank_branch: defaultAcc.branch || '',
        bank_upi_id: defaultAcc.upi_id || '',
        bank_qr_code: defaultAcc.qr_code || '',
      };
    });
  };

  const handleSetDefaultAccount = (index) => {
    setFormData(prev => {
      const accounts = (prev.bank_accounts || []).map((acc, i) => ({
        ...acc,
        is_default: i === index
      }));
      const defaultAcc = accounts[index] || {};
      return {
        ...prev,
        bank_accounts: accounts,
        bank_name: defaultAcc.bank_name || '',
        bank_account_number: defaultAcc.account_number || '',
        bank_ifsc_code: defaultAcc.ifsc_code || '',
        bank_branch: defaultAcc.branch || '',
        bank_upi_id: defaultAcc.upi_id || '',
        bank_qr_code: defaultAcc.qr_code || '',
      };
    });
  };

  const handleAddAccount = () => {
    setFormData(prev => {
      const current = prev.bank_accounts || [];
      if (current.length >= 3) {
        toast.info('Maximum 3 bank accounts allowed');
        return prev;
      }
      const newAcc = {
        id: `bank_acc_${Date.now()}`,
        account_name: `Account ${current.length + 1}`,
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        account_holder: prev.business_name || '',
        branch: '',
        upi_id: '',
        qr_code: '',
        is_default: current.length === 0,
      };
      setActiveBankIndex(current.length);
      return {
        ...prev,
        bank_accounts: [...current, newAcc]
      };
    });
  };

  const handleRemoveAccount = (indexToRemove) => {
    setFormData(prev => {
      const current = prev.bank_accounts || [];
      if (current.length <= 1) {
        toast.error('At least one bank account must remain');
        return prev;
      }
      const filtered = current.filter((_, i) => i !== indexToRemove);
      if (!filtered.some(a => a.is_default)) {
        filtered[0].is_default = true;
      }
      const nextIndex = Math.min(activeBankIndex, filtered.length - 1);
      setActiveBankIndex(nextIndex);
      const defaultAcc = filtered.find(a => a.is_default) || filtered[0] || {};
      return {
        ...prev,
        bank_accounts: filtered,
        bank_name: defaultAcc.bank_name || '',
        bank_account_number: defaultAcc.account_number || '',
        bank_ifsc_code: defaultAcc.ifsc_code || '',
        bank_branch: defaultAcc.branch || '',
        bank_upi_id: defaultAcc.upi_id || '',
        bank_qr_code: defaultAcc.qr_code || '',
      };
    });
  };

  const handleQrUploadForAccount = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('QR code image size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      handleBankAccountChange('qr_code', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrForAccount = () => {
    handleBankAccountChange('qr_code', '');
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    console.log('Submitting profile update...', formData);
    const originalEmail = String(profile.email || '').trim().toLowerCase();
    const updatedEmail = String(formData.email || '').trim().toLowerCase();
    const isEmailChanged = !!updatedEmail && updatedEmail !== originalEmail;

    if (isEmailChanged && !String(formData.current_password || '').trim()) {
      toast.error('Current password is required to change email');
      return;
    }

    if (formData.country === 'IN' && formData.gstin && formData.state) {
      const gstinPrefix = formData.gstin.trim().slice(0, 2);
      const stateCode = getGSTStateCode(formData.state);
      if (/^\d{2}$/.test(gstinPrefix) && stateCode && gstinPrefix !== stateCode) {
        toast.error(`GSTIN state prefix '${gstinPrefix}' does not match selected state '${formData.state}' (code ${stateCode}). Please correct before saving.`);
        return;
      }
    }

    const defaultAcc = (formData.bank_accounts || []).find(a => a.is_default) || (formData.bank_accounts || [])[0] || {};

    // Prepare data for submission
    const updateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      business_name: formData.business_name,
      business_address: formData.business_address,
      country: formData.country,
      gstin: formData.gstin,
      pan_number: formData.pan_number,
      trn: formData.trn,
      gem_id: formData.gem_id,
      dl_number: formData.dl_number,
      state: formData.state,
      city: formData.city,
      bank_accounts: formData.bank_accounts,
      bank_name: defaultAcc.bank_name || '',
      bank_account_number: defaultAcc.account_number || '',
      bank_ifsc_code: defaultAcc.ifsc_code || '',
      bank_branch: defaultAcc.branch || '',
      bank_upi_id: defaultAcc.upi_id || '',
      bank_qr_code: defaultAcc.qr_code || ''
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
      const p = userProfile.profile;
      setActiveBankIndex(0);
      setFormData({
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        email: p.email || '',
        current_password: '',
        phone: p.phone || '',
        business_name: p.business_name || '',
        business_address: p.business_address || '',
        country: p.country || 'IN',
        gstin: p.gstin || '',
        pan_number: p.pan_number || '',
        trn: p.trn || '',
        gem_id: p.gem_id || '',
        dl_number: p.dl_number || '',
        state: p.state || '',
        city: p.city || '',
        bank_name: p.bank_name || '',
        bank_account_number: p.bank_account_number || '',
        bank_ifsc_code: p.bank_ifsc_code || '',
        bank_branch: p.bank_branch || '',
        bank_upi_id: p.bank_upi_id || '',
        bank_qr_code: p.bank_qr_code || '',
        bank_accounts: normalizeAccounts(p.bank_accounts, p)
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
      <>
        <div className="page-bg">
          <div className="container mx-auto px-4 py-8">
            <Loader />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="page-bg">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-8 text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Profile</h2>
                <p className="text-[var(--text-secondary)] text-sm">
                  {error.response?.data?.detail || 'Failed to load profile data'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
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
    <>
      <div className="page-bg relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-[var(--accent-primary)]/10 blur-3xl" />
          <div className="absolute right-0 top-52 h-96 w-96 rounded-full bg-[var(--accent-primary)]/10 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-8 lg:py-12">
          <div className="mx-auto max-w-7xl space-y-7">
            <section className="bento-card p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--border-subtle)] md:h-20 md:w-20">
                    <span className="text-2xl font-semibold tracking-wide text-[var(--accent-primary)] md:text-3xl">{initials}</span>
                    {isAdmin && profileExpiryBadge && (
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-bold text-[var(--text-primary)] shadow-md">
                        {profileExpiryBadge}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-primary)] font-semibold">Profile Workspace</p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">{fullName}</h1>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{roleLabel}</p>
                    {isAdmin && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-primary)]">
                        <ShieldCheckIcon className={`h-4 w-4 ${(userProfile?.profile?.plan_name || '').includes('Starter') ? 'text-amber-500' : 'text-emerald-500'}`} />
                        {userProfile?.profile?.plan_name || 'Plan'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-primary)]"
                  >
                    <KeyIcon className="h-4 w-4 text-[var(--accent-primary)]" />
                    Change Password
                  </button>
                  {!isEditing && role !== 'employee' && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl"
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
                {isAdmin && (
                  <section className="bento-card p-6">
                  <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                    <ChartBarIcon className="h-5 w-5 text-[var(--accent-primary)]" />
                    Account Signals
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Member Since</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{memberDays} days</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Trial Status</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{trialDays} days left</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Plan Expiry</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{expiryLabel}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{expirySubLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Invoices Generated</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{totalInvoices}</p>
                    </div>
                  </div>
                </section>
                )}

                <section className="bento-card p-6">
                  <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Identity Snapshot</h3>
                  <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 px-3 py-2.5">
                      <EnvelopeIcon className="h-4 w-4 text-[var(--accent-primary)]" />
                      <span className="truncate">{formData.email || 'No email added'}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 px-3 py-2.5">
                      <PhoneIcon className="h-4 w-4 text-[var(--accent-primary)]" />
                      <span>{formData.phone || 'No phone added'}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 px-3 py-2.5">
                        <BuildingOfficeIcon className="h-4 w-4 text-[var(--accent-primary)]" />
                        <span className="truncate">{formData.business_name || 'No business name'}</span>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 px-3 py-2.5">
                        <MapPinIcon className="mt-0.5 h-4 w-4 text-[var(--accent-primary)]" />
                        <div>
                          <p className="line-clamp-2">{formData.business_address || 'No address added'}</p>
                          {(formData.city || formData.state) && (
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              {[formData.city, State.getStateByCodeAndCountry(formData.state, formData.country)?.name || formData.state].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {isAdmin && (formData.gstin || formData.pan_number) && (
                      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 px-3 py-2.5">
                        <DocumentTextIcon className="h-4 w-4 text-[var(--accent-primary)]" />
                        <span className="text-xs">
                          {formData.gstin && `GST: ${formData.gstin}`}
                          {formData.gstin && formData.pan_number && ' • '}
                          {formData.pan_number && `PAN: ${formData.pan_number}`}
                        </span>
                      </div>
                    )}
                    {isAdmin && (formData.bank_name || (formData.bank_accounts && formData.bank_accounts.length > 0)) && (
                      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 px-3 py-2.5">
                        <BuildingLibraryIcon className="h-4 w-4 text-[var(--accent-primary)]" />
                        <div className="text-xs">
                          <p className="font-semibold text-[var(--text-primary)]">
                            {formData.bank_name || ((formData.bank_accounts || [])[0]?.bank_name) || 'Bank Configured'}
                          </p>
                          <p className="text-[var(--text-muted)] font-mono">
                            A/C: {formData.bank_account_number || ((formData.bank_accounts || [])[0]?.account_number) || '—'}
                          </p>
                          {(formData.bank_accounts?.length || 0) > 1 && (
                            <span className="text-xs text-[var(--accent-primary)] font-medium">
                              +{formData.bank_accounts.length - 1} more account{formData.bank_accounts.length > 2 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {isAdmin && latestPayment && (
                  <section className="bento-card p-6">
                    <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Last Payment Status</h3>
                    <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                      <div className={`rounded-xl border px-3 py-2 ${paymentStatusTone}`}>
                        <p className="text-xs uppercase tracking-[0.16em]">Status</p>
                        <p className="mt-1 text-sm font-semibold uppercase">{latestPayment.status}</p>
                      </div>
                      <p><span className="text-[var(--text-muted)]">Order:</span> {latestPayment.order_id}</p>
                      <p><span className="text-[var(--text-muted)]">Plan:</span> {latestPayment.plan_name}</p>
                      <p><span className="text-[var(--text-muted)]">Amount:</span> INR {latestPayment.amount}</p>
                      {!!latestPayment.failure_reason && (
                        <p><span className="text-[var(--text-muted)]">Reason:</span> {latestPayment.failure_reason}</p>
                      )}
                      {!!latestPayment.created_at && (
                        <p><span className="text-[var(--text-muted)]">Created:</span> {new Date(latestPayment.created_at).toLocaleString()}</p>
                      )}
                      {!!latestPayment.paid_at && (
                        <p><span className="text-[var(--text-muted)]">Confirmed:</span> {new Date(latestPayment.paid_at).toLocaleString()}</p>
                      )}
                    </div>
                  </section>
                )}
              </aside>

              <section className="xl:col-span-8 space-y-8">
                {isAdmin && userProfile?.setup_progress && (
                  <div className="bento-card p-6 md:p-8 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      {/* Left: Progress info & Percentage */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${userProfile.setup_progress.profile_completed ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'}`} />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Profile Setup Progress</h3>
                        </div>

                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">{userProfile.setup_progress.completion_percentage}%</span>
                            <span className={`text-sm font-semibold ${userProfile.setup_progress.profile_completed ? 'text-emerald-500' : 'text-[var(--accent-primary)]'}`}>
                              {userProfile.setup_progress.profile_completed ? 'Fully Completed' : 'In progress'}
                            </span>
                          </div>
                          
                          {/* Sleek Progress Bar */}
                          <div className="w-full bg-[var(--bg-primary)] h-2.5 rounded-full mt-3 overflow-hidden border border-[var(--border-subtle)]">
                            <div 
                              className={`h-full ${userProfile.setup_progress.profile_completed ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'} rounded-full transition-all duration-1000 ease-out`}
                              style={{ width: `${userProfile.setup_progress.completion_percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Checklist items */}
                        {userProfile.setup_progress.next_steps && userProfile.setup_progress.next_steps.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Remaining Actions:</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {userProfile.setup_progress.next_steps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                                  {step.includes('complete') || step.includes('complete!') ? (
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                    </span>
                                  ) : (
                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--accent-primary)] mt-1.5" />
                                  )}
                                  <span className="leading-tight">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Right: Premium Launch Button */}
                      {!userProfile.setup_progress.profile_completed && (
                        <div className="flex flex-col items-stretch md:items-end justify-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowWizard(true)}
                            className="btn-primary flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <SparklesIcon className="w-4 h-4 text-white" />
                            Launch Setup Wizard
                          </button>
                          <p className="text-xs text-center md:text-right text-[var(--text-muted)]">
                            Configure business details & tax settings in seconds.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bento-card p-6 md:p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Account Details</h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">Refined profile controls for daily operations and billing identity.</p>
                    </div>
                  </div>

                  <form
                    id="profile-form"
                    onSubmit={(e) => {
                      // Only persist when the Save button is clicked — not on Select Enter/change
                      e.preventDefault();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        const isSubmitControl =
                          e.target.type === 'submit' ||
                          e.target.closest?.('button[type="submit"]');
                        if (!isSubmitControl) {
                          e.preventDefault();
                        }
                      }
                    }}
                    className="space-y-7"
                  >
                    {role !== 'employee' ? (
                      <>
                        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-5 md:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-primary)]">
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
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                          placeholder="First name"
                        />
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-5 md:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-primary)]">
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
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                          placeholder="name@example.com"
                        />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                          placeholder="Phone number"
                        />
                      </div>
                      {isEditing && emailChanged && (
                        <div className="mt-4">
                          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-amber-500 font-semibold">
                            Confirm Current Password (required for email change)
                          </label>
                          <input
                            type="password"
                            name="current_password"
                            value={formData.current_password}
                            onChange={handleInputChange}
                            disabled={updateProfileMutation.isPending}
                            className="w-full rounded-xl border border-amber-500/50 bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-500 focus:outline-none disabled:opacity-60"
                            placeholder="Enter current password"
                          />
                        </div>
                      )}
                      </div>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Employee Information</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                            <span className="text-[var(--text-muted)]">Employee Code</span>
                            <span className="text-[var(--text-primary)] font-medium">{employeeData?.employee_code || "—"}</span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                            <span className="text-[var(--text-muted)]">Department</span>
                            <span className="text-[var(--text-primary)] font-medium">{employeeData?.department_name || "—"}</span>
                          </div>
                          <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                            <span className="text-[var(--text-muted)]">Designation</span>
                            <span className="text-[var(--text-primary)] font-medium">{employeeData?.designation_name || "—"}</span>
                          </div>
                          <div className="flex justify-between pb-2">
                            <span className="text-[var(--text-muted)]">Employment Type</span>
                            <span className="text-[var(--text-primary)] font-medium capitalize">{(employeeData?.employment_type || "—").replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-5 md:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-primary)]">
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
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                          placeholder="Business name"
                        />
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1">Country</label>
                          <Select
                            options={[
                              { value: 'IN', label: 'India' },
                              { value: 'AE', label: 'United Arab Emirates' }
                            ]}
                            value={{ value: formData.country, label: formData.country === 'AE' ? 'United Arab Emirates' : 'India' }}
                            onChange={(option) => setFormData(prev => ({ ...prev, country: option.value, state: '', city: '' }))}
                            isDisabled={!isEditing || updateProfileMutation.isPending}
                            styles={customSelectStyles}
                            placeholder="Select Country"
                          />
                        </div>

                        {formData.country === 'IN' && (
                          <>
                            <input
                              type="text"
                              name="gstin"
                              value={formData.gstin}
                              onChange={handleInputChange}
                              disabled={!isEditing || updateProfileMutation.isPending}
                              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                              placeholder="GSTIN (optional)"
                              maxLength={15}
                            />
                            {formData.country === 'IN' && formData.gstin && formData.state && (() => {
                              const gstinPrefix = formData.gstin.trim().slice(0, 2);
                              const stateCode = getGSTStateCode(formData.state);
                              if (/^\d{2}$/.test(gstinPrefix) && stateCode && gstinPrefix !== stateCode) {
                                return (
                                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs flex items-start gap-2">
                                    <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                                    <span>
                                      Warning: GSTIN starts with state code &apos;{gstinPrefix}&apos;, which does not match your selected state &apos;{formData.state}&apos; (code {stateCode}).
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            <input
                              type="text"
                              name="pan_number"
                              value={formData.pan_number}
                              onChange={handleInputChange}
                              disabled={!isEditing || updateProfileMutation.isPending}
                              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60 uppercase"
                              placeholder="Business PAN (e.g. ABCDE1234F)"
                              maxLength={10}
                            />
                          </>
                        )}
                        {formData.country === 'AE' && (
                          <input
                            type="text"
                            name="trn"
                            value={formData.trn}
                            onChange={handleInputChange}
                            disabled={!isEditing || updateProfileMutation.isPending}
                            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                            placeholder="TRN (15-digit)"
                            maxLength={15}
                          />
                        )}

                        <input
                          type="text"
                          name="gem_id"
                          value={formData.gem_id}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                          placeholder="GEM ID"
                        />
                        <input
                          type="text"
                          name="dl_number"
                          value={formData.dl_number}
                          onChange={handleInputChange}
                          disabled={!isEditing || updateProfileMutation.isPending}
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                          placeholder="DL Number"
                        />
                        
                        {formData.country && (
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1">State</label>
                            <Select
                              options={State.getStatesOfCountry(formData.country).map(state => ({ value: state.isoCode, label: state.name }))}
                              value={formData.state ? { value: formData.state, label: State.getStateByCodeAndCountry(formData.state, formData.country)?.name || formData.state } : null}
                              onChange={(option) => {
                                // Local form state only — persisted via Save Changes
                                setFormData(prev => ({ ...prev, state: option?.value || '', city: '' }));
                              }}
                              isDisabled={!isEditing || updateProfileMutation.isPending}
                              styles={customSelectStyles}
                              placeholder="Select State"
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              menuPosition="fixed"
                            />
                          </div>
                        )}
                        {formData.country && (
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1">City</label>
                            <Select
                              options={City.getCitiesOfState(formData.country, formData.state).map(c => ({ value: c.name, label: c.name }))}
                              value={formData.city ? { value: formData.city, label: formData.city } : null}
                              onChange={(option) => setFormData(prev => ({ ...prev, city: option.value }))}
                              isDisabled={!isEditing || !formData.state || updateProfileMutation.isPending}
                              styles={customSelectStyles}
                              placeholder="Select City"
                            />
                          </div>
                        )}
                      </div>
                      <textarea
                        name="business_address"
                        value={formData.business_address}
                        onChange={handleInputChange}
                        disabled={!isEditing || updateProfileMutation.isPending}
                        rows={4}
                        className="mt-4 w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                        placeholder="Business address"
                      />
                    </div>
                    )}

                    {isAdmin && (
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-5 md:p-6">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-primary)]">
                            <BuildingLibraryIcon className="h-4 w-4" />
                            Bank & Payment Details
                          </h4>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Manage up to 3 bank accounts. Choose which account to print per bill in the preview format.
                          </p>
                        </div>
                        {isEditing && (formData.bank_accounts || []).length < 3 && (
                          <button
                            type="button"
                            onClick={handleAddAccount}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 text-xs font-medium transition-colors"
                          >
                            <span>+ Add Bank Account ({(formData.bank_accounts || []).length}/3)</span>
                          </button>
                        )}
                      </div>

                      {/* Bank Account Selection Tabs */}
                      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 border-b border-[var(--border-subtle)]">
                        {(formData.bank_accounts || []).map((acc, idx) => (
                          <button
                            key={acc.id || idx}
                            type="button"
                            onClick={() => setActiveBankIndex(idx)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                              activeBankIndex === idx
                                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/50 shadow-sm font-semibold'
                                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                            }`}
                          >
                            <span>{acc.account_name || `Account ${idx + 1}`}</span>
                            {acc.is_default && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                                Default
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Active Account Details */}
                      {(() => {
                        const currentAcc = (formData.bank_accounts || [])[activeBankIndex] || {};
                        return (
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Account #{activeBankIndex + 1}:</span>
                                <span className="text-sm font-bold text-[var(--text-primary)]">{currentAcc.account_name || `Account ${activeBankIndex + 1}`}</span>
                                {currentAcc.is_default ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                    ✓ Primary Default
                                  </span>
                                ) : (
                                  isEditing && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefaultAccount(activeBankIndex)}
                                      className="text-xs text-[var(--accent-primary)] hover:underline font-medium"
                                    >
                                      Make Default
                                    </button>
                                  )
                                )}
                              </div>
                              {isEditing && (formData.bank_accounts || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAccount(activeBankIndex)}
                                  className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2.5 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                                >
                                  Remove Account
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1 mb-1 block">Account Label / Nickname</label>
                                <input
                                  type="text"
                                  value={currentAcc.account_name || ''}
                                  onChange={(e) => handleBankAccountChange('account_name', e.target.value)}
                                  disabled={!isEditing || updateProfileMutation.isPending}
                                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                                  placeholder="e.g. Primary Account, Current A/C, GST Account"
                                />
                              </div>

                              <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1 mb-1 block">Account Holder Name</label>
                                <input
                                  type="text"
                                  value={currentAcc.account_holder || ''}
                                  onChange={(e) => handleBankAccountChange('account_holder', e.target.value)}
                                  disabled={!isEditing || updateProfileMutation.isPending}
                                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                                  placeholder="e.g. Acme Enterprises Pvt Ltd"
                                />
                              </div>

                              <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1 mb-1 block">Bank Name</label>
                                <input
                                  type="text"
                                  value={currentAcc.bank_name || ''}
                                  onChange={(e) => handleBankAccountChange('bank_name', e.target.value)}
                                  disabled={!isEditing || updateProfileMutation.isPending}
                                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                                  placeholder="e.g. HDFC Bank, State Bank of India"
                                />
                              </div>

                              <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1 mb-1 block">Account Number</label>
                                <input
                                  type="text"
                                  value={currentAcc.account_number || ''}
                                  onChange={(e) => handleBankAccountChange('account_number', e.target.value)}
                                  disabled={!isEditing || updateProfileMutation.isPending}
                                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60 font-mono"
                                  placeholder="e.g. 50100234567890"
                                />
                              </div>

                              <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1 mb-1 block">IFSC Code</label>
                                <input
                                  type="text"
                                  value={currentAcc.ifsc_code || ''}
                                  onChange={(e) => handleBankAccountChange('ifsc_code', e.target.value.toUpperCase())}
                                  disabled={!isEditing || updateProfileMutation.isPending}
                                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60 uppercase font-mono"
                                  placeholder="e.g. HDFC0001234"
                                  maxLength={11}
                                />
                              </div>

                              <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1 mb-1 block">Branch Name</label>
                                <input
                                  type="text"
                                  value={currentAcc.branch || ''}
                                  onChange={(e) => handleBankAccountChange('branch', e.target.value)}
                                  disabled={!isEditing || updateProfileMutation.isPending}
                                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                                  placeholder="e.g. Indiranagar, Bangalore"
                                />
                              </div>

                              <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1 mb-1 block">UPI ID / VPA (Optional)</label>
                                <input
                                  type="text"
                                  value={currentAcc.upi_id || ''}
                                  onChange={(e) => handleBankAccountChange('upi_id', e.target.value)}
                                  disabled={!isEditing || updateProfileMutation.isPending}
                                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
                                  placeholder="e.g. business@okaxis"
                                />
                              </div>

                              {/* Payment QR Code Upload */}
                              <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1 mb-1 block">Payment QR Code (Optional)</label>
                                <div className="flex items-center gap-3">
                                  {currentAcc.qr_code ? (
                                    <div className="relative group flex-shrink-0">
                                      <img
                                        src={currentAcc.qr_code}
                                        alt="Payment QR"
                                        className="w-16 h-16 rounded-xl border border-[var(--border-subtle)] object-contain bg-white p-1 shadow-md"
                                      />
                                      {isEditing && (
                                        <button
                                          type="button"
                                          onClick={handleRemoveQrForAccount}
                                          className="absolute -top-1.5 -right-1.5 bg-[var(--status-danger-fill)] text-[var(--status-danger-on-fill)] rounded-full p-1 hover:brightness-110 shadow-md transition-colors"
                                          title="Remove QR Code"
                                        >
                                          <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ) : null}
                                  {isEditing && (
                                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-xs text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-all">
                                      <QrCodeIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                                      <span>{currentAcc.qr_code ? 'Change QR Image' : 'Upload QR Image (PNG/JPG)'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleQrUploadForAccount}
                                        className="hidden"
                                        disabled={updateProfileMutation.isPending}
                                      />
                                    </label>
                                  )}
                                  {!isEditing && !currentAcc.qr_code && (
                                    <span className="text-xs text-[var(--text-muted)] italic">No QR code uploaded</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                    )}

                    {isEditing && role !== 'employee' && (
                      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border-subtle)] pt-6">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="rounded-xl border border-[var(--border-subtle)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-primary)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={updateProfileMutation.isPending}
                          className="btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* Onboarding Wizard Modal */}
        {showWizard && userProfile?.profile && (
          <OnboardingWizard 
            profile={userProfile.profile} 
            onClose={() => {
              setShowWizard(false);
              queryClient.invalidateQueries(['userProfile']);
            }} 
          />
        )}
      </div>
    </>
  );
};

export default Profile;
