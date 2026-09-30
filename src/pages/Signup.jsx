import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon, SparklesIcon, ServerStackIcon, KeyIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { State, City } from 'country-state-city';
import Seo from '../components/Seo';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#0c1017',
    borderColor: state.isFocused ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    padding: '3px',
    color: 'white',
    boxShadow: state.isFocused ? '0 0 0 1px #06b6d4' : 'none',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.2)'
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#0c1017',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    zIndex: 50
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#06b6d4' : state.isFocused ? '#131922' : 'transparent',
    color: state.isSelected ? '#000000' : 'white',
    fontWeight: state.isSelected ? 'bold' : 'normal',
    '&:active': {
      backgroundColor: '#06b6d4'
    }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'white',
    fontSize: '0.875rem'
  }),
  input: (provided) => ({
    ...provided,
    color: 'white'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#64748b',
    fontSize: '0.875rem'
  })
};

const SignupSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirm_password: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
  phone: Yup.string().required('Phone number is required'),
  business_name: Yup.string().nullable(),
  country: Yup.string().required('Country is required'),
  gstin: Yup.string().when('country', {
    is: 'IN',
    then: (schema) => schema.length(15, 'GSTIN must be exactly 15 characters').nullable(),
    otherwise: (schema) => schema.nullable(),
  }),
  trn: Yup.string().when('country', {
    is: 'AE',
    then: (schema) => schema.matches(/^\d{15}$/, 'TRN must be exactly 15 digits').nullable(),
    otherwise: (schema) => schema.nullable(),
  }),
  state: Yup.string().required('State is required'),
  city: Yup.string().nullable(),
  termsAccepted: Yup.boolean().oneOf([true], 'You must accept the Terms of Service & Privacy Policy').required('Terms must be accepted'),
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
            theme: "filled_black", 
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
        setGoogleError('Failed to sign up with Google: No token received');
      }
    } catch (err) {
      console.error(err);
      setGoogleError(err?.response?.data?.error || 'Google Sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white font-sans flex overflow-hidden selection:bg-cyan-500/30 selection:text-white">
      <Seo
        title="Start 14-Day Cloud Sandbox | Cenvora ERP"
        description="Experience Cenvora ERP with a full-featured 14-day cloud sandbox before your perpetual deployment. Instant GST billing, batch inventory, and client ledgers."
        canonicalPath="/signup"
        noindex
      />
      {loading && <Loader />}
      
      {/* Left Column: Commercial Proof Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-14 bg-[#0a0d14] border-r border-white/5 overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-cyan-500/10 rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[140px]"></div>
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[170px] h-auto object-contain" />
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            14-Day Full-Access Cloud Sandbox
          </div>
        </div>

        {/* Sandbox Value Points */}
        <div className="relative z-10 max-w-lg my-auto py-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-8">
            Test Drive Your Private ERP Before Perpetual Deployment.
          </h2>

          <ul className="space-y-6 text-sm text-gray-300">
            <li className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-white block font-semibold mb-0.5 text-base">Full Production Features</strong>
                <span className="text-gray-400 leading-relaxed text-xs sm:text-sm">
                  Raise real GST/VAT invoices, test 80mm thermal printing, and explore batch stock valuation without credit cards.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <ServerStackIcon className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-white block font-semibold mb-0.5 text-base">Zero Data Loss on Purchase</strong>
                <span className="text-gray-400 leading-relaxed text-xs sm:text-sm">
                  When you purchase your perpetual license, all catalog items, customer balances, and bills seamlessly carry over.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <KeyIcon className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-white block font-semibold mb-0.5 text-base">Perpetual License Path</strong>
                <span className="text-gray-400 leading-relaxed text-xs sm:text-sm">
                  Ready to own forever? Upgrade to Hosted Standard (₹1L) or White-Label Custom Domain (₹1.5L) with flat ₹12k/yr AMC.
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-gray-500">
          <p>&copy; {new Date().getFullYear()} Cenvora Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Column: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#07080b] relative overflow-y-auto max-h-screen">
        {/* Mobile Header */}
        <nav className="absolute top-0 left-0 w-full p-6 lg:hidden flex justify-between items-center z-20">
          <Link to="/" className="flex items-center">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[130px] h-auto object-contain" />
          </Link>
          <Link to="/login" className="text-xs font-mono text-cyan-400">
            Sign In &rarr;
          </Link>
        </nav>

        <div className="w-full max-w-md space-y-6 my-auto pt-16 lg:pt-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Activate Cloud Sandbox</h2>
            <p className="mt-1.5 text-sm text-gray-400">
              Instant 14-day sandbox access. No payment card required.
            </p>
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
              trn: '',
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
                    country: values.country,
                    gstin: values.gstin,
                    trn: values.trn,
                    state: values.state,
                    city: values.city,
                  };
                  const response = await api.post('/users/signup/', payload);
                  if (response?.data?.otp_required) {
                    setOtpRequested(true);
                    setPendingEmail(values.email);
                    setSignupMessage('Verification code sent to your email. Enter below to activate:');
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
                  setFieldError('email', 'Sandbox activation failed. Please try again.');
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
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 font-mono">
                    {signupMessage}
                  </div>
                )}

                {otpRequested ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                        Verification Code (OTP)
                      </label>
                      <Field
                        type="text"
                        name="otp"
                        className="w-full px-4 py-3 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors text-white placeholder-gray-600 text-sm font-mono tracking-widest text-center"
                        placeholder="123456"
                      />
                      {isSubmitAttempted && errors.otp && (
                        <div className="text-red-400 text-xs mt-1 font-mono">{errors.otp}</div>
                      )}
                      <p className="text-[11px] text-gray-500 mt-2 font-mono">Sent to: {pendingEmail || 'your email'}</p>
                    </div>

                    <button
                      type="submit"
                      onClick={() => setIsSubmitAttempted(true)}
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-xl shadow-lg shadow-cyan-400/20 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify & Launch Sandbox'}
                      {!isSubmitting && <ArrowRightIcon className="w-4 h-4" />}
                    </button>
                  </div>
                ) : showManualForm ? (
                  <div className="space-y-4 animate-fade-in">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        resetForm();
                        setIsSubmitAttempted(false);
                        setShowManualForm(false);
                      }}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      &larr; Back to 1-Click Google Sign-up
                    </button>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                          Email Address <span className="text-cyan-400">*</span>
                        </label>
                        <Field
                          type="email"
                          name="email"
                          className="w-full px-3.5 py-2.5 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white placeholder-gray-600 text-sm"
                          placeholder="name@company.com"
                        />
                        {isSubmitAttempted && errors.email && (
                          <div className="text-red-400 text-xs mt-1 font-mono">{errors.email}</div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                            Password <span className="text-cyan-400">*</span>
                          </label>
                          <Field
                            type="password"
                            name="password"
                            className="w-full px-3.5 py-2.5 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white placeholder-gray-600 text-sm"
                            placeholder="••••••••"
                          />
                          {isSubmitAttempted && errors.password && (
                            <div className="text-red-400 text-xs mt-1 font-mono">{errors.password}</div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                            Confirm <span className="text-cyan-400">*</span>
                          </label>
                          <Field
                            type="password"
                            name="confirm_password"
                            className="w-full px-3.5 py-2.5 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white placeholder-gray-600 text-sm"
                            placeholder="••••••••"
                          />
                          {isSubmitAttempted && errors.confirm_password && (
                            <div className="text-red-400 text-xs mt-1 font-mono">{errors.confirm_password}</div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                            Phone <span className="text-cyan-400">*</span>
                          </label>
                          <Field
                            type="text"
                            name="phone"
                            className="w-full px-3.5 py-2.5 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white placeholder-gray-600 text-sm"
                            placeholder="+91 98765 43210"
                          />
                          {isSubmitAttempted && errors.phone && (
                            <div className="text-red-400 text-xs mt-1 font-mono">{errors.phone}</div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                            Business Name
                          </label>
                          <Field
                            type="text"
                            name="business_name"
                            className="w-full px-3.5 py-2.5 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white placeholder-gray-600 text-sm"
                            placeholder="Mehta Traders"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                          Country <span className="text-cyan-400">*</span>
                        </label>
                        <Select
                          options={[
                            { value: 'IN', label: 'India (GST Engine)' },
                            { value: 'AE', label: 'United Arab Emirates (VAT 5%)' }
                          ]}
                          styles={customSelectStyles}
                          onChange={(option) => {
                            setFieldValue('country', option.value);
                            setFieldValue('state', '');
                            setFieldValue('city', '');
                          }}
                          value={{ 
                            value: values.country, 
                            label: values.country === 'IN' ? 'India (GST Engine)' : 'United Arab Emirates (VAT 5%)' 
                          }}
                        />
                        {isSubmitAttempted && errors.country && (
                          <div className="text-red-400 text-xs mt-1 font-mono">{errors.country}</div>
                        )}
                      </div>

                      {values.country === 'IN' && (
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                            GSTIN (Optional)
                          </label>
                          <Field
                            type="text"
                            name="gstin"
                            className="w-full px-3.5 py-2.5 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white placeholder-gray-600 text-sm font-mono uppercase"
                            placeholder="22AAAAA0000A1Z5"
                          />
                          {isSubmitAttempted && errors.gstin && (
                            <div className="text-red-400 text-xs mt-1 font-mono">{errors.gstin}</div>
                          )}
                        </div>
                      )}

                      {values.country === 'AE' && (
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                            TRN (Optional, 15 digits)
                          </label>
                          <Field
                            type="text"
                            name="trn"
                            className="w-full px-3.5 py-2.5 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white placeholder-gray-600 text-sm font-mono"
                            placeholder="100000000000003"
                          />
                          {isSubmitAttempted && errors.trn && (
                            <div className="text-red-400 text-xs mt-1 font-mono">{errors.trn}</div>
                          )}
                        </div>
                      )}

                      {values.country && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                              State <span className="text-cyan-400">*</span>
                            </label>
                            <Select
                              options={State.getStatesOfCountry(values.country).map(state => ({ value: state.isoCode, label: state.name }))}
                              placeholder="Select State"
                              styles={customSelectStyles}
                              onChange={(option) => {
                                setFieldValue('state', option.value);
                                setFieldValue('city', '');
                              }}
                              value={values.state ? { value: values.state, label: State.getStateByCodeAndCountry(values.state, values.country)?.name || values.state } : null}
                            />
                            {isSubmitAttempted && errors.state && (
                              <div className="text-red-400 text-xs mt-1 font-mono">{errors.state}</div>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                              City
                            </label>
                            <Select
                              options={City.getCitiesOfState(values.country, values.state).map(city => ({ value: city.name, label: city.name }))}
                              placeholder="Select City"
                              styles={customSelectStyles}
                              isDisabled={!values.state}
                              onChange={(option) => setFieldValue('city', option.value)}
                              value={values.city ? { value: values.city, label: values.city } : null}
                            />
                            {isSubmitAttempted && errors.city && (
                              <div className="text-red-400 text-xs mt-1 font-mono">{errors.city}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <Field 
                          type="checkbox" 
                          name="termsAccepted"
                          className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#0c1017] text-cyan-400 focus:ring-0" 
                        />
                        <span className="text-xs text-gray-400 leading-relaxed">
                          I agree to the <Link to="/terms" className="text-cyan-400 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>.
                        </span>
                      </label>
                      {isSubmitAttempted && errors.termsAccepted && (
                        <div className="text-red-400 text-xs mt-1 font-mono">{errors.termsAccepted}</div>
                      )}
                    </div>

                    <button
                      type="submit"
                      onClick={() => setIsSubmitAttempted(true)}
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-xl shadow-lg shadow-cyan-400/20 transition-all flex items-center justify-center gap-2 text-sm mt-3"
                    >
                      {isSubmitting ? 'Sending Code...' : 'Activate Sandbox with Email'}
                      {!isSubmitting && <ArrowRightIcon className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in">
                    {googleError && (
                      <div className="text-red-400 text-xs text-center font-mono">{googleError}</div>
                    )}

                    <div id="googleSignUpDiv" className="w-full flex justify-center min-h-[44px]"></div>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                        <span className="bg-[#07080b] px-3 text-gray-500">Or Register Manually</span>
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
                      className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 rounded-xl font-semibold text-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <span>Enter details manually</span>
                      <ArrowRightIcon className="w-4 h-4 text-cyan-400" />
                    </button>
                  </div>
                )}
              </form>
            )}
          </Formik>

          <p className="text-center text-xs text-gray-400 pt-2 border-t border-white/5">
            Already have an active tenant?{' '}
            <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
              Sign In to Console
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}