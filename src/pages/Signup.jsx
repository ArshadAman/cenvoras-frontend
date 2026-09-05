import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { State, City } from 'country-state-city';
import Seo from '../components/Seo';

const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: '#1e293b',
        borderColor: state.isFocused ? '#06b6d4' : '#334155',
        borderRadius: '0.75rem',
        padding: '2px',
        color: 'white',
        boxShadow: state.isFocused ? '0 0 0 1px #06b6d4' : 'none',
        '&:hover': {
            borderColor: '#334155'
        }
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        zIndex: 50
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#06b6d4' : state.isFocused ? '#334155' : 'transparent',
        color: 'white',
        '&:active': {
            backgroundColor: '#06b6d4'
        }
    }),
    singleValue: (provided) => ({
        ...provided,
        color: 'white'
    }),
    input: (provided) => ({
        ...provided,
        color: 'white'
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#64748b'
    })
};

const SignupSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Too short!').required('Required'),
  confirm_password: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Required'),
  phone: Yup.string().required('Required'),
  business_name: Yup.string().nullable(),
  country: Yup.string().required('Country is required'),
  gstin: Yup.string().when('country', {
    is: 'IN',
    then: (schema) => schema.length(15, 'GSTIN must be 15 characters').nullable(),
    otherwise: (schema) => schema.nullable(),
  }),
  trn: Yup.string().when('country', {
    is: 'AE',
    then: (schema) => schema.matches(/^\d{15}$/, 'TRN must be exactly 15 digits').nullable(),
    otherwise: (schema) => schema.nullable(),
  }),
  state: Yup.string().required('State/Region is required'),
  city: Yup.string().nullable(),
  termsAccepted: Yup.boolean().oneOf([true], 'You must accept the Terms of Service').required('You must accept the Terms of Service'),
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
            theme: "filled_blue", 
            size: "large", 
            width: "100%",
            text: "signup_with",
            shape: "pill"
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
    <div className="min-h-screen bg-[#0f172a] text-white font-sans flex overflow-hidden">
            <Seo
                title="Create Account"
                description="Create your Cenvora account to start using billing and inventory software for your business."
                canonicalPath="/signup"
                noindex
            />
      {loading && <Loader />}
      
      {/* Left Side - Visual & Value Prop (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-[#020617] overflow-hidden">
        {/* Abstract Background Mesh - Purple/Blue Theme for Signup */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/20 via-[#0f172a] to-blue-900/20"></div>
            <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        {/* Brand Logo */}
        <Link to="/" className="relative z-10 flex items-center hover:opacity-90 transition-opacity">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[180px] h-auto object-contain" />
        </Link>

        {/* Value Prop */}
        <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight mb-6">
                Take control of your billing and inventory in minutes.
            </h2>
            <ul className="space-y-6 text-lg text-slate-300">
                <li className="flex items-start gap-3">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mt-1 font-semibold">✓</div>
                    <div>
                        <strong className="text-white block font-semibold mb-0.5">14-Day Free Pro Trial</strong>
                        <span className="text-sm text-slate-400 leading-relaxed">Instant access to all premium features. No credit card required.</span>
                    </div>
                </li>
                <li className="flex items-start gap-3">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mt-1 font-semibold">✓</div>
                    <div>
                        <strong className="text-white block font-semibold mb-0.5">Setup in under 2 minutes</strong>
                        <span className="text-sm text-slate-400 leading-relaxed">Import your items and start raising GST invoices immediately.</span>
                    </div>
                </li>
                <li className="flex items-start gap-3">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mt-1 font-semibold">✓</div>
                    <div>
                        <strong className="text-white block font-semibold mb-0.5">Staff-ready simplicity</strong>
                        <span className="text-sm text-slate-400 leading-relaxed">An interface so intuitive your team can use it with zero training.</span>
                    </div>
                </li>
            </ul>
        </div>

        {/* Footer Links */}
        <div className="relative z-10 flex gap-6 text-sm text-slate-500">
            <p>© 2026 Cenvora Inc.</p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#0f172a] relative overflow-y-auto">
        {/* Mobile Navbar */}
        <nav className="absolute top-0 left-0 w-full p-6 lg:hidden flex justify-between items-center z-20">
            <Link to="/" className="flex items-center">
                <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[140px] h-auto object-contain" />
            </Link>
        </nav>

        <div className="w-full max-w-md space-y-8 my-auto pt-16 lg:pt-0">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white tracking-tight">Create your account</h2>
                <p className="mt-2 text-slate-400">
                    Start your 14-day Pro trial. No credit card required.
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
                                setSignupMessage('OTP sent to your email. Enter it below to complete signup.');
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
                            setFieldError('email', 'Signup failed. Please try again.');
                        }
                    }
                    setLoading(false);
                    setSubmitting(false);
                }}
            >
                {({ isSubmitting, setFieldValue, values, errors, submitCount, resetForm, handleSubmit }) => (
                    <form 
                        className="mt-8 space-y-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (isSubmitAttempted) {
                                handleSubmit(e);
                            }
                        }}
                    >
                        {signupMessage ? (
                            <div className="text-sm text-cyan-300 mb-4">{signupMessage}</div>
                        ) : null}

                        {otpRequested ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-1.5">Signup OTP</label>
                              <Field
                                  type="text"
                                  name="otp"
                                  className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                  placeholder="Enter 6-digit OTP"
                              />
                              {isSubmitAttempted && errors.otp && <div className="text-red-400 text-xs mt-1">{errors.otp}</div>}
                              <p className="text-xs text-slate-400 mt-2">Sent to: {pendingEmail || 'your email'}</p>
                            </div>

                            <button
                                type="submit"
                                onClick={() => setIsSubmitAttempted(true)}
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Verifying OTP...' : 'Verify OTP & Create Account'}
                                {!isSubmitting && <ArrowRightIcon className="w-5 h-5" />}
                            </button>
                          </div>
                        ) : showManualForm ? (
                          <div className="space-y-5 animate-fade-in">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                resetForm();
                                setIsSubmitAttempted(false);
                                setShowManualForm(false);
                              }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mb-2 font-semibold"
                            >
                              ← Back to Google sign-up
                            </button>

                            <div className="grid grid-cols-1 gap-5">
                              <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                                  <Field
                                      type="email"
                                      name="email"
                                      className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                      placeholder="name@company.com"
                                  />
                                  {isSubmitAttempted && errors.email && <div className="text-red-400 text-xs mt-1">{errors.email}</div>}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                                      <Field
                                          type="password"
                                          name="password"
                                          className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                          placeholder="••••••••"
                                      />
                                      {isSubmitAttempted && errors.password && <div className="text-red-400 text-xs mt-1">{errors.password}</div>}
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm</label>
                                      <Field
                                          type="password"
                                          name="confirm_password"
                                          className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                          placeholder="••••••••"
                                      />
                                      {isSubmitAttempted && errors.confirm_password && <div className="text-red-400 text-xs mt-1">{errors.confirm_password}</div>}
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
                                  <Field
                                      type="text"
                                      name="phone"
                                      className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                      placeholder="+91 98765 43210"
                                  />
                                  {isSubmitAttempted && errors.phone && <div className="text-red-400 text-xs mt-1">{errors.phone}</div>}
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Business Name (Optional)</label>
                                  <Field
                                      type="text"
                                      name="business_name"
                                      className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                      placeholder="Acme Corp"
                                  />
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Country <span className="text-red-400">*</span></label>
                                  <Select
                                      options={[
                                          { value: 'IN', label: 'India' },
                                          { value: 'AE', label: 'United Arab Emirates' }
                                      ]}
                                      className="react-select-container"
                                      classNamePrefix="react-select"
                                      placeholder="Select Country"
                                      styles={customSelectStyles}
                                      onChange={(option) => {
                                          setFieldValue('country', option.value);
                                          setFieldValue('state', '');
                                          setFieldValue('city', '');
                                      }}
                                      value={{ value: values.country, label: values.country === 'IN' ? 'India' : 'United Arab Emirates' }}
                                  />
                                  {isSubmitAttempted && errors.country && <div className="text-red-400 text-xs mt-1">{errors.country}</div>}
                              </div>

                              {values.country === 'IN' && (
                                  <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1.5">GSTIN (Optional)</label>
                                      <Field
                                          type="text"
                                          name="gstin"
                                          className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                          placeholder="22AAAAA0000A1Z5"
                                      />
                                      {isSubmitAttempted && errors.gstin && <div className="text-red-400 text-xs mt-1">{errors.gstin}</div>}
                                  </div>
                              )}

                              {values.country === 'AE' && (
                                  <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1.5">TRN (Optional, 15-digit)</label>
                                      <Field
                                          type="text"
                                          name="trn"
                                          className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                          placeholder="100000000000003"
                                      />
                                      {isSubmitAttempted && errors.trn && <div className="text-red-400 text-xs mt-1">{errors.trn}</div>}
                                  </div>
                              )}

                              {values.country && (
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm font-medium text-slate-300 mb-1.5">State <span className="text-red-400">*</span></label>
                                          <Select
                                              options={State.getStatesOfCountry(values.country).map(state => ({ value: state.isoCode, label: state.name }))}
                                              className="react-select-container"
                                              classNamePrefix="react-select"
                                              placeholder="Select State"
                                              styles={customSelectStyles}
                                              onChange={(option) => {
                                                  setFieldValue('state', option.value);
                                                  setFieldValue('city', '');
                                              }}
                                              value={values.state ? { value: values.state, label: State.getStateByCodeAndCountry(values.state, values.country)?.name || values.state } : null}
                                          />
                                          {isSubmitAttempted && errors.state && <div className="text-red-400 text-xs mt-1">{errors.state}</div>}
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
                                          <Select
                                              options={City.getCitiesOfState(values.country, values.state).map(city => ({ value: city.name, label: city.name }))}
                                              className="react-select-container"
                                              classNamePrefix="react-select"
                                              placeholder="Select City"
                                              styles={customSelectStyles}
                                              isDisabled={!values.state}
                                              onChange={(option) => setFieldValue('city', option.value)}
                                              value={values.city ? { value: values.city, label: values.city } : null}
                                          />
                                          {isSubmitAttempted && errors.city && <div className="text-red-400 text-xs mt-1">{errors.city}</div>}
                                      </div>
                                  </div>
                              )}
                            </div>

                            <div className="mt-4">
                                <div className="flex items-start gap-3">
                                    <Field 
                                        type="checkbox" 
                                        name="termsAccepted"
                                        className="mt-1 w-4 h-4 rounded border-slate-600 bg-[#1e293b] text-cyan-500 focus:ring-cyan-500" 
                                    />
                                    <p className="text-sm text-slate-400">
                                        I agree to the <Link to="/terms" className="text-cyan-400 hover:text-cyan-300">Terms of Service</Link> and <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</Link>.
                                    </p>
                                </div>
                                {isSubmitAttempted && errors.termsAccepted && <div className="text-red-400 text-xs mt-1 ml-7">{errors.termsAccepted}</div>}
                            </div>

                            <button
                                type="submit"
                                onClick={() => setIsSubmitAttempted(true)}
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Sending OTP...' : 'Continue with OTP'}
                                {!isSubmitting && <ArrowRightIcon className="w-5 h-5" />}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-6 animate-fade-in">
                            {googleError && (
                              <div className="text-red-400 text-xs text-center font-medium mt-2">{googleError}</div>
                            )}

                            <div id="googleSignUpDiv" className="w-full flex justify-center min-h-[44px]"></div>

                            <div className="relative my-5">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-800"></div>
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0f172a] px-2 text-slate-400 font-medium">Or</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                resetForm();
                                setIsSubmitAttempted(false);
                                setShowManualForm(true);
                              }}
                              className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-semibold text-slate-200 shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              Enter details manually <ArrowRightIcon className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                    </form>
                )}
            </Formik>

            <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                    Sign in
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
}