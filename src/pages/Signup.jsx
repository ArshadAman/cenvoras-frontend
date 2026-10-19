import React, { useState } from 'react';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon, ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { State, City } from 'country-state-city';
import Seo from '../components/Seo';
import AuthPrismCanvas from '../components/3d/AuthPrismCanvas';

const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--bg-primary)',
    borderColor: state.isFocused ? 'var(--accent-primary)' : 'var(--border-subtle)',
    borderRadius: '0.75rem',
    padding: '3px',
    color: 'var(--text-primary)',
    boxShadow: 'none',
    '&:hover': { borderColor: 'var(--accent-primary)' }
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
    fontWeight: state.isSelected ? '600' : 'normal',
    cursor: 'pointer'
  }),
  singleValue: (provided) => ({ ...provided, color: 'var(--text-primary)', fontSize: '0.875rem' }),
  placeholder: (provided) => ({ ...provided, color: 'var(--text-muted)', fontSize: '0.875rem' })
};

const stepSchemas = [
  Yup.object().shape({
    email: Yup.string().email('Enter a valid email').required('Email is required'),
    password: Yup.string().min(8, 'At least 8 characters').required('Password is required'),
    confirm_password: Yup.string().oneOf([Yup.ref('password')], 'Passwords do not match').required('Please confirm password'),
  }),
  Yup.object().shape({
    phone: Yup.string().required('Phone number is required'),
    business_name: Yup.string().nullable(),
    state: Yup.string().required('State is required'),
    city: Yup.string().nullable(),
  }),
  Yup.object().shape({
    gstin: Yup.string().length(15, 'GSTIN must be 15 characters').nullable(),
    termsAccepted: Yup.boolean().oneOf([true], 'You must accept the terms').required('Required'),
  }),
];

const STEP_LABELS = ['Account', 'Business', 'Finish'];

function InputField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
        {label}{required && <span className="text-[var(--text-muted)] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[var(--status-danger)] text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otpRequested, setOtpRequested] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [signupMessage, setSignupMessage] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    business_name: '',
    country: 'IN',
    gstin: '',
    state: '',
    city: '',
    otp: '',
    termsAccepted: false,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phoneParam = searchParams.get('phone') || '';
  const emailParam = searchParams.get('email') || '';

  React.useEffect(() => {
    if (phoneParam || emailParam) {
      setFormData(prev => ({ ...prev, phone: phoneParam, email: emailParam }));
      setShowManualForm(true);
    }
  }, []);

  React.useEffect(() => {
    /* global google */
    const initGoogleSignUp = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignUpDiv'),
          { theme: 'outline', size: 'large', width: '100%', text: 'signup_with', shape: 'rectangular' }
        );
      } else {
        setTimeout(initGoogleSignUp, 100);
      }
    };
    initGoogleSignUp();
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setGoogleError('');
    try {
      const res = await api.post('/users/google-login/', { credential: response.credential });
      const token = res.data.token || res.data.access;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh', res.data.refresh);
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          localStorage.setItem('role', payload.role || 'admin');
        } catch (e) { console.error('Failed to parse token', e); }
        window.location.href = '/profile';
      } else {
        setGoogleError('Could not sign up with Google. Please try again.');
      }
    } catch (err) {
      setGoogleError(err?.response?.data?.error || 'Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateStep = async (stepNum) => {
    try {
      await stepSchemas[stepNum - 1].validate(formData, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (err) {
      const errs = {};
      err.inner?.forEach(e => { errs[e.path] = e.message; });
      setFormErrors(errs);
      setTouched(prev => {
        const t = { ...prev };
        Object.keys(errs).forEach(k => { t[k] = true; });
        return t;
      });
      return false;
    }
  };

  const handleNext = async () => {
    const valid = await validateStep(step);
    if (valid) setStep(s => s + 1);
  };

  const handleBack = () => {
    setFormErrors({});
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    const valid = await validateStep(3);
    if (!valid) return;
    setLoading(true);
    try {
      if (!otpRequested) {
        const payload = {
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirm_password,
          phone: formData.phone,
          business_name: formData.business_name,
          country: 'IN',
          gstin: formData.gstin || '',
          state: formData.state,
          city: formData.city,
        };
        const response = await api.post('/users/signup/', payload);
        if (response?.data?.otp_required) {
          setOtpRequested(true);
          setPendingEmail(formData.email);
          setSignupMessage('We sent a verification code to your email. Enter it below to finish setup:');
        }
      } else {
        const response = await api.post('/users/signup/', {
          email: pendingEmail || formData.email,
          otp: formData.otp,
        });
        if (response.status === 201) navigate('/login');
      }
    } catch (error) {
      const backendErrors = error?.response?.data?.errors;
      const backendError = error?.response?.data?.error;
      if (backendErrors) setFormErrors(backendErrors);
      else if (backendError) setFormErrors({ email: backendError });
      else setFormErrors({ email: 'Could not create account. Please check your details and try again.' });
    }
    setLoading(false);
  };

  const fieldClass = "w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm transition-all";
  const fieldErr = (name) => formErrors[name] ? 'border-[var(--status-danger)] focus:border-[var(--status-danger)]' : '';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col justify-between">
      <Seo
        title="Start 14-Day Free Trial | Cenvora"
        description="Try Cenvora free for 14 days. Create GST invoices, manage stock, and track customer payments with zero obligation."
        canonicalPath="/signup"
        noindex
      />
      {loading && <Loader />}

      <div className="flex-1 flex w-full">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] p-12 flex-col justify-between overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora" className="h-8 w-auto" />
            </Link>
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--status-success)] text-xs font-semibold mb-3">
                <CheckCircleIcon className="w-4 h-4 text-[var(--status-success)]" />
                No Credit Card Required
              </span>
              <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-snug">
                Experience effortless billing and real-time inventory management.
              </h2>
            </div>
          </div>

          <div className="relative z-10 my-4 flex items-center justify-center">
            <AuthPrismCanvas />
          </div>

          <div className="relative z-10 border-t border-[var(--border-subtle)] pt-6">
            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-primary)]">
              {['Instant GST Invoicing', 'Live Stock Valuation', 'Customer Ledgers', 'Multi-Device Access'].map(f => (
                <div key={f} className="flex items-center gap-2 bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                  <CheckCircleIcon className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
          <div className="w-full max-w-md">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-block hover:opacity-90 transition-opacity mb-4">
                <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora" className="h-8 w-auto mx-auto" />
              </Link>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Start 14-day free trial</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">No credit card required</p>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">Create your account</h1>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">Start your 14-day full free trial in less than a minute</p>
              </div>

              {/* Google Sign-Up Gate */}
              {!showManualForm && !otpRequested && (
                <div className="space-y-4">
                  {googleError && <div className="text-[var(--status-danger)] text-xs text-center">{googleError}</div>}
                  <div id="googleSignUpDiv" className="w-full flex justify-center min-h-[40px]" />
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--border-subtle)]" />
                    </div>
                    <div className="relative flex justify-center text-[11px] text-[var(--text-muted)] font-medium">
                      <span className="bg-[var(--bg-surface)] px-3">or sign up with email</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualForm(true)}
                    className="btn-secondary w-full py-3.5 text-xs flex items-center justify-center gap-2"
                  >
                    <span>Continue with email</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </button>
                </div>
              )}

              {/* OTP Verification */}
              {otpRequested && (
                <div className="space-y-4">
                  {signupMessage && (
                    <div className="p-3.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-secondary)]">
                      {signupMessage}
                    </div>
                  )}
                  <InputField label="Verification Code" required error={formErrors.otp}>
                    <input
                      type="text"
                      value={formData.otp}
                      onChange={e => setField('otp', e.target.value)}
                      className={`${fieldClass} text-center font-mono tracking-widest`}
                      placeholder="123456"
                    />
                  </InputField>
                  <p className="text-[11px] text-[var(--text-muted)]">Sent to {pendingEmail}</p>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary w-full py-3.5 text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                    {!loading && <ArrowRightIcon className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Multi-Step Form */}
              {showManualForm && !otpRequested && (
                <div>
                  {/* Step Progress */}
                  <div className="flex items-center gap-2 mb-7">
                    {STEP_LABELS.map((label, i) => {
                      const s = i + 1;
                      const isActive = s === step;
                      const isDone = s < step;
                      return (
                        <React.Fragment key={label}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                              isDone ? 'bg-[var(--status-success)] text-white' : isActive ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)]'
                            }`}>
                              {isDone ? '✓' : s}
                            </div>
                            <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-[var(--text-primary)]' : isDone ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'}`}>
                              {label}
                            </span>
                          </div>
                          {i < STEP_LABELS.length - 1 && (
                            <div className={`flex-1 h-px mt-[-14px] transition-all duration-500 ${isDone ? 'bg-[var(--status-success)]' : 'bg-[var(--border-subtle)]'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Step 1: Account credentials */}
                  {step === 1 && (
                    <div className="space-y-4 animate-fadeIn">
                      <InputField label="Email Address" required error={formErrors.email}>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setField('email', e.target.value)}
                          className={`${fieldClass} ${fieldErr('email')}`}
                          placeholder="name@company.com"
                          autoFocus
                        />
                      </InputField>

                      <InputField label="Password" required error={formErrors.password}>
                        <div className="relative">
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={formData.password}
                            onChange={e => setField('password', e.target.value)}
                            className={`${fieldClass} pr-11 ${fieldErr('password')}`}
                            placeholder="At least 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(v => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            {showPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </InputField>

                      <InputField label="Confirm Password" required error={formErrors.confirm_password}>
                        <div className="relative">
                          <input
                            type={showConfirmPw ? 'text' : 'password'}
                            value={formData.confirm_password}
                            onChange={e => setField('confirm_password', e.target.value)}
                            className={`${fieldClass} pr-11 ${fieldErr('confirm_password')}`}
                            placeholder="Same as above"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(v => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            {showConfirmPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </InputField>

                      <button
                        onClick={handleNext}
                        className="btn-primary w-full mt-2 py-3.5 text-xs shadow-md flex items-center justify-center gap-2"
                      >
                        Continue <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => { setShowManualForm(false); setFormErrors({}); }}
                        className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1 transition-colors pt-1"
                      >
                        <ArrowLeftIcon className="w-3 h-3" /> Back to Google sign-up
                      </button>
                    </div>
                  )}

                  {/* Step 2: Business info */}
                  {step === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Mobile Number" required error={formErrors.phone}>
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={e => setField('phone', e.target.value)}
                            className={`${fieldClass} ${fieldErr('phone')}`}
                            placeholder="+91 98765 43210"
                            autoFocus
                          />
                        </InputField>
                        <InputField label="Business Name" error={formErrors.business_name}>
                          <input
                            type="text"
                            value={formData.business_name}
                            onChange={e => setField('business_name', e.target.value)}
                            className={fieldClass}
                            placeholder="My Enterprise"
                          />
                        </InputField>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="State" required error={formErrors.state}>
                          <Select
                            options={State.getStatesOfCountry('IN').map(s => ({ value: s.isoCode, label: s.name }))}
                            placeholder="Select State"
                            styles={selectStyles}
                            onChange={option => { setField('state', option.value); setField('city', ''); }}
                            value={formData.state ? { value: formData.state, label: State.getStateByCodeAndCountry(formData.state, 'IN')?.name || formData.state } : null}
                          />
                        </InputField>
                        <InputField label="City" error={formErrors.city}>
                          <Select
                            options={City.getCitiesOfState('IN', formData.state).map(c => ({ value: c.name, label: c.name }))}
                            placeholder="Select City"
                            styles={selectStyles}
                            isDisabled={!formData.state}
                            onChange={option => setField('city', option.value)}
                            value={formData.city ? { value: formData.city, label: formData.city } : null}
                          />
                        </InputField>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={handleBack}
                          className="btn-secondary flex-1 py-3.5 text-xs flex items-center justify-center gap-1.5"
                        >
                          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                          onClick={handleNext}
                          className="btn-primary flex-[2] py-3.5 text-xs shadow-md flex items-center justify-center gap-2"
                        >
                          Continue <ArrowRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: GSTIN + Terms */}
                  {step === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                      <InputField label="GSTIN (optional)" error={formErrors.gstin}>
                        <input
                          type="text"
                          value={formData.gstin}
                          onChange={e => setField('gstin', e.target.value.toUpperCase())}
                          className={`${fieldClass} uppercase tracking-wider ${fieldErr('gstin')}`}
                          placeholder="22AAAAA0000A1Z5"
                          autoFocus
                          maxLength={15}
                        />
                      </InputField>

                      <p className="text-[11px] text-[var(--text-muted)]">You can add this later from your profile settings.</p>

                      <div className="pt-1">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="relative mt-0.5 shrink-0">
                            <input
                              type="checkbox"
                              checked={formData.termsAccepted}
                              onChange={e => setField('termsAccepted', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-4 h-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] peer-checked:bg-[var(--accent-primary)] peer-checked:border-[var(--accent-primary)] transition-all flex items-center justify-center">
                              {formData.termsAccepted && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                            I agree to the{' '}
                            <Link to="/terms" className="text-[var(--accent-primary)] hover:underline font-medium">Terms of Service</Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="text-[var(--accent-primary)] hover:underline font-medium">Privacy Policy</Link>.
                          </span>
                        </label>
                        {formErrors.termsAccepted && (
                          <p className="text-[var(--status-danger)] text-xs mt-1.5 ml-7">{formErrors.termsAccepted}</p>
                        )}
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={handleBack}
                          className="btn-secondary flex-1 py-3.5 text-xs flex items-center justify-center gap-1.5"
                        >
                          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={loading}
                          className="btn-primary flex-[2] py-3.5 text-xs shadow-md flex items-center justify-center gap-2"
                        >
                          {loading ? 'Creating account...' : 'Create Free Account'}
                          {!loading && <ArrowRightIcon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--accent-primary)] font-semibold hover:underline transition-colors">
                  Sign in
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-[var(--text-muted)]">
              <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">
                ← Back to Cenvora homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}