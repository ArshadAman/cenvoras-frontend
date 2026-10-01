import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { State, City } from 'country-state-city';
import Seo from '../components/Seo';
import AuthPrismCanvas from '../components/3d/AuthPrismCanvas';

const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#030712', // slate-950
    borderColor: state.isFocused ? '#38bdf8' : '#1e293b',
    borderRadius: '0.75rem',
    padding: '3px',
    color: 'white',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#334155'
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '0.75rem',
    zIndex: 50
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#38bdf8' : state.isFocused ? '#1e293b' : 'transparent',
    color: state.isSelected ? '#030712' : '#f8fafc',
    fontWeight: state.isSelected ? '600' : 'normal',
    cursor: 'pointer'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#ffffff',
    fontSize: '0.875rem'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#64748b',
    fontSize: '0.875rem'
  })
};

const SignupSchema = Yup.object().shape({
  email: Yup.string().email('Please enter a valid email address').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirm_password: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Please confirm password'),
  phone: Yup.string().required('Phone number is required'),
  business_name: Yup.string().nullable(),
  country: Yup.string().default('IN'),
  gstin: Yup.string().length(15, 'GSTIN must be 15 characters').nullable(),
  state: Yup.string().required('State is required'),
  city: Yup.string().nullable(),
  termsAccepted: Yup.boolean().oneOf([true], 'You must accept the terms').required('Required'),
});

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [signupMessage, setSignupMessage] = useState('');
  const [googleError, setGoogleError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phoneParam = searchParams.get('phone') || '';
  const emailParam = searchParams.get('email') || '';
  const [showManualForm, setShowManualForm] = useState(!!(phoneParam || emailParam));
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);

  React.useEffect(() => {
    /* global google */
    const initGoogleSignUp = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignUpDiv"),
          { 
            theme: "outline", 
            size: "large", 
            width: "100%",
            text: "signup_with",
            shape: "rectangular"
          }
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
      const payload = {
        credential: response.credential,
      };
      const res = await api.post('/users/google-login/', payload);
      const token = res.data.token || res.data.access;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh', res.data.refresh);
        
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          localStorage.setItem('role', payload.role || 'admin');
        } catch (e) {
          console.error("Failed to parse token", e);
        }

        window.location.href = '/profile';
      } else {
        setGoogleError('Could not sign up with Google. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setGoogleError(err?.response?.data?.error || 'Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-white font-sans flex flex-col justify-between selection:bg-sky-500/20 selection:text-sky-300">
      <Seo
        title="Start 14-Day Free Trial | Cenvora"
        description="Try Cenvora free for 14 days. Create GST invoices, manage stock, and track customer payments with zero obligation."
        canonicalPath="/signup"
        noindex
      />
      {loading && <Loader />}

      <div className="flex-1 flex w-full">
        {/* Left Side: 50% Visual Showcase Panel (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B0F19] border-r border-slate-800/80 p-12 flex-col justify-between overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Tagline */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora" className="h-8 w-auto" />
            </Link>
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-emerald-400 text-xs font-semibold mb-3">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                No Credit Card Required
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
                Experience effortless billing and real-time inventory management.
              </h2>
            </div>
          </div>

          {/* Center 3D Interactive Canvas */}
          <div className="relative z-10 my-4 flex items-center justify-center">
            <AuthPrismCanvas />
          </div>

          {/* Bottom Trial Features List */}
          <div className="relative z-10 border-t border-slate-800/80 pt-6">
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant GST Invoicing</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live Stock Valuation</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Customer Ledgers</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Device Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-block hover:opacity-90 transition-opacity mb-4">
                <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora" className="h-8 w-auto mx-auto" />
              </Link>
              <h2 className="text-xl font-bold text-white">Start 14-day free trial</h2>
              <p className="text-xs text-slate-400 mt-1">No credit card required</p>
            </div>

            {/* Auth Glass Card */}
            <div className="bg-slate-900/50 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Create your account</h1>
                <p className="text-xs text-slate-400 mt-1.5">Start your 14-day full free trial in less than a minute</p>
              </div>

              <Formik
                initialValues={{ 
                  email: emailParam || '', 
                  password: '', 
                  confirm_password: '', 
                  phone: phoneParam || '', 
                  business_name: '', 
                  country: 'IN',
                  gstin: '',
                  state: '',
                  city: '',
                  otp: '',
                  termsAccepted: false
                }}
                validationSchema={SignupSchema}
                onSubmit={async (values, { setSubmitting, setFieldError }) => {
                  setLoading(true);
                  try {
                    if (!otpRequested) {
                      const payload = {
                        email: values.email,
                        password: values.password,
                        confirm_password: values.confirm_password,
                        phone: values.phone,
                        business_name: values.business_name,
                        country: 'IN',
                        gstin: values.gstin,
                        state: values.state,
                        city: values.city,
                      };
                      const response = await api.post('/users/signup/', payload);
                      if (response?.data?.otp_required) {
                        setOtpRequested(true);
                        setPendingEmail(values.email);
                        setSignupMessage('We sent a verification code to your email. Enter it below to finish setup:');
                      }
                    } else {
                      const response = await api.post('/users/signup/', {
                        email: pendingEmail || values.email,
                        otp: values.otp,
                      });
                      if (response.status === 201) {
                        navigate('/login');
                      }
                    }
                  } catch (error) {
                    const backendErrors = error?.response?.data?.errors;
                    const backendError = error?.response?.data?.error;
                    if (backendErrors) {
                      Object.entries(backendErrors).forEach(([key, val]) => {
                        setFieldError(key, Array.isArray(val) ? val[0] : String(val));
                      });
                    } else if (backendError) {
                      setFieldError(otpRequested ? 'otp' : 'email', backendError);
                    } else {
                      setFieldError('email', 'Could not create account. Please check your details and try again.');
                    }
                  }
                  setLoading(false);
                  setSubmitting(false);
                }}
              >
                {({ isSubmitting, setFieldValue, values, errors, resetForm, handleSubmit }) => (
                  <form 
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (isSubmitAttempted) {
                        handleSubmit(e);
                      }
                    }}
                  >
                    {signupMessage && (
                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                        {signupMessage}
                      </div>
                    )}

                    {otpRequested ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Verification Code (OTP)
                          </label>
                          <Field
                            type="text"
                            name="otp"
                            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm text-center font-mono tracking-widest"
                            placeholder="123456"
                          />
                          {isSubmitAttempted && errors.otp && (
                            <div className="text-rose-400 text-xs mt-1.5">{errors.otp}</div>
                          )}
                          <p className="text-[11px] text-slate-400 mt-2">Sent to {pendingEmail}</p>
                        </div>

                        <button
                          type="submit"
                          onClick={() => setIsSubmitAttempted(true)}
                          disabled={isSubmitting}
                          className="w-full py-3.5 bg-white text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Verifying...' : 'Verify Code & Create Account'}
                          {!isSubmitting && <ArrowRightIcon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : showManualForm ? (
                      <div className="space-y-3.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            resetForm();
                            setIsSubmitAttempted(false);
                            setShowManualForm(false);
                          }}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-1 transition-colors"
                        >
                          &larr; Back to Google sign-up
                        </button>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Email Address <span className="text-slate-500">*</span>
                          </label>
                          <Field
                            type="email"
                            name="email"
                            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm transition-all"
                            placeholder="name@company.com"
                          />
                          {isSubmitAttempted && errors.email && (
                            <div className="text-rose-400 text-xs mt-1">{errors.email}</div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Password <span className="text-slate-500">*</span>
                            </label>
                            <Field
                              type="password"
                              name="password"
                              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm transition-all"
                              placeholder="••••••••"
                            />
                            {isSubmitAttempted && errors.password && (
                              <div className="text-rose-400 text-xs mt-1">{errors.password}</div>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Confirm <span className="text-slate-500">*</span>
                            </label>
                            <Field
                              type="password"
                              name="confirm_password"
                              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm transition-all"
                              placeholder="••••••••"
                            />
                            {isSubmitAttempted && errors.confirm_password && (
                              <div className="text-rose-400 text-xs mt-1">{errors.confirm_password}</div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Mobile Number <span className="text-slate-500">*</span>
                            </label>
                            <Field
                              type="text"
                              name="phone"
                              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm transition-all"
                              placeholder="+91 98765 43210"
                            />
                            {isSubmitAttempted && errors.phone && (
                              <div className="text-rose-400 text-xs mt-1">{errors.phone}</div>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Business Name
                            </label>
                            <Field
                              type="text"
                              name="business_name"
                              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm transition-all"
                              placeholder="My Enterprise"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            GSTIN (Optional)
                          </label>
                          <Field
                            type="text"
                            name="gstin"
                            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm uppercase transition-all"
                            placeholder="22AAAAA0000A1Z5"
                          />
                          {isSubmitAttempted && errors.gstin && (
                            <div className="text-rose-400 text-xs mt-1">{errors.gstin}</div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              State <span className="text-slate-500">*</span>
                            </label>
                            <Select
                              options={State.getStatesOfCountry('IN').map(state => ({ value: state.isoCode, label: state.name }))}
                              placeholder="Select State"
                              styles={selectStyles}
                              onChange={(option) => {
                                setFieldValue('state', option.value);
                                setFieldValue('city', '');
                              }}
                              value={values.state ? { value: values.state, label: State.getStateByCodeAndCountry(values.state, 'IN')?.name || values.state } : null}
                            />
                            {isSubmitAttempted && errors.state && (
                              <div className="text-rose-400 text-xs mt-1">{errors.state}</div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              City
                            </label>
                            <Select
                              options={City.getCitiesOfState('IN', values.state).map(city => ({ value: city.name, label: city.name }))}
                              placeholder="Select City"
                              styles={selectStyles}
                              isDisabled={!values.state}
                              onChange={(option) => setFieldValue('city', option.value)}
                              value={values.city ? { value: values.city, label: values.city } : null}
                            />
                            {isSubmitAttempted && errors.city && (
                              <div className="text-rose-400 text-xs mt-1">{errors.city}</div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2">
                          <label className="flex items-start gap-2 cursor-pointer">
                            <Field 
                              type="checkbox" 
                              name="termsAccepted"
                              className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0" 
                            />
                            <span className="text-xs text-slate-400">
                              I agree to the <Link to="/terms" className="text-white hover:text-sky-300 underline">Terms</Link> and <Link to="/privacy" className="text-white hover:text-sky-300 underline">Privacy Policy</Link>.
                            </span>
                          </label>
                          {isSubmitAttempted && errors.termsAccepted && (
                            <div className="text-rose-400 text-xs mt-1">{errors.termsAccepted}</div>
                          )}
                        </div>

                        <button
                          type="submit"
                          onClick={() => setIsSubmitAttempted(true)}
                          disabled={isSubmitting}
                          className="w-full mt-3 py-3.5 bg-white text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Creating account...' : 'Create Free Account'}
                          {!isSubmitting && <ArrowRightIcon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {googleError && (
                          <div className="text-rose-400 text-xs text-center">{googleError}</div>
                        )}

                        <div id="googleSignUpDiv" className="w-full flex justify-center min-h-[40px]"></div>

                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800"></div>
                          </div>
                          <div className="relative flex justify-center text-[11px] text-slate-500">
                            <span className="bg-slate-900 px-3">or</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            resetForm();
                            setIsSubmitAttempted(false);
                            setShowManualForm(true);
                          }}
                          className="w-full py-3.5 bg-slate-950/80 border border-slate-800 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <span>Sign up with email instead</span>
                          <ArrowRightIcon className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </Formik>

              <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-white font-semibold hover:text-sky-300 transition-colors">
                  Sign in
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-500">
              <Link to="/" className="hover:text-slate-300 transition-colors">
                &larr; Back to Cenvora homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}