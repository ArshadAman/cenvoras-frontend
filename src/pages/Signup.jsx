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

const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#18181b', // zinc-900
    borderColor: state.isFocused ? '#71717a' : '#27272a',
    borderRadius: '0.5rem',
    padding: '2px',
    color: 'white',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#3f3f46'
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '0.5rem',
    zIndex: 50
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#ffffff' : state.isFocused ? '#27272a' : 'transparent',
    color: state.isSelected ? '#09090b' : '#f4f4f5',
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
    color: '#71717a',
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
    <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-center items-center px-6 py-12">
      <Seo
        title="Start Free Trial | Cenvora"
        description="Try Cenvora free for 14 days. Create GST invoices, manage stock, and track customer payments with zero obligation."
        canonicalPath="/signup"
        noindex
      />
      {loading && <Loader />}

      {/* Brand Logo */}
      <div className="mb-6">
        <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
          <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-2xl p-7 sm:p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-white tracking-tight">Start your 14-day free trial</h1>
          <p className="text-xs text-zinc-400 mt-1">Full access to GST billing & stock management. No credit card required.</p>
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
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300">
                  {signupMessage}
                </div>
              )}

              {otpRequested ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Verification Code (OTP)
                    </label>
                    <Field
                      type="text"
                      name="otp"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 text-sm text-center font-mono tracking-widest"
                      placeholder="123456"
                    />
                    {isSubmitAttempted && errors.otp && (
                      <div className="text-red-400 text-xs mt-1">{errors.otp}</div>
                    )}
                    <p className="text-[11px] text-zinc-500 mt-2">Sent to {pendingEmail}</p>
                  </div>

                  <button
                    type="submit"
                    onClick={() => setIsSubmitAttempted(true)}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-white text-zinc-950 font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
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
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mb-1"
                  >
                    &larr; Back to Google sign-up
                  </button>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Email Address <span className="text-zinc-500">*</span>
                    </label>
                    <Field
                      type="email"
                      name="email"
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 text-sm"
                      placeholder="name@company.com"
                    />
                    {isSubmitAttempted && errors.email && (
                      <div className="text-red-400 text-xs mt-1">{errors.email}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Password <span className="text-zinc-500">*</span>
                      </label>
                      <Field
                        type="password"
                        name="password"
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 text-sm"
                        placeholder="••••••••"
                      />
                      {isSubmitAttempted && errors.password && (
                        <div className="text-red-400 text-xs mt-1">{errors.password}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Confirm <span className="text-zinc-500">*</span>
                      </label>
                      <Field
                        type="password"
                        name="confirm_password"
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 text-sm"
                        placeholder="••••••••"
                      />
                      {isSubmitAttempted && errors.confirm_password && (
                        <div className="text-red-400 text-xs mt-1">{errors.confirm_password}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Mobile Number <span className="text-zinc-500">*</span>
                      </label>
                      <Field
                        type="text"
                        name="phone"
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 text-sm"
                        placeholder="+91 98765 43210"
                      />
                      {isSubmitAttempted && errors.phone && (
                        <div className="text-red-400 text-xs mt-1">{errors.phone}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Business Name
                      </label>
                      <Field
                        type="text"
                        name="business_name"
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 text-sm"
                        placeholder="My Trading Co"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      GSTIN (Optional)
                    </label>
                    <Field
                      type="text"
                      name="gstin"
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 text-sm uppercase"
                      placeholder="22AAAAA0000A1Z5"
                    />
                    {isSubmitAttempted && errors.gstin && (
                      <div className="text-red-400 text-xs mt-1">{errors.gstin}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        State <span className="text-zinc-500">*</span>
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
                        <div className="text-red-400 text-xs mt-1">{errors.state}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
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
                        <div className="text-red-400 text-xs mt-1">{errors.city}</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Field 
                        type="checkbox" 
                        name="termsAccepted"
                        className="mt-0.5 w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0" 
                      />
                      <span className="text-xs text-zinc-400">
                        I agree to the <Link to="/terms" className="text-white hover:underline">Terms</Link> and <Link to="/privacy" className="text-white hover:underline">Privacy Policy</Link>.
                      </span>
                    </label>
                    {isSubmitAttempted && errors.termsAccepted && (
                      <div className="text-red-400 text-xs mt-1">{errors.termsAccepted}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    onClick={() => setIsSubmitAttempted(true)}
                    disabled={isSubmitting}
                    className="w-full mt-2 py-2.5 bg-white text-zinc-950 font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? 'Creating account...' : 'Create Account with Email'}
                    {!isSubmitting && <ArrowRightIcon className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {googleError && (
                    <div className="text-red-400 text-xs text-center">{googleError}</div>
                  )}

                  <div id="googleSignUpDiv" className="w-full flex justify-center min-h-[40px]"></div>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[11px] text-zinc-500">
                      <span className="bg-zinc-950 px-2">or</span>
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
                    className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Sign up with email instead</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              )}
            </form>
          )}
        </Formik>

        <div className="mt-6 pt-5 border-t border-zinc-900 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>

      {/* Clean Footer Link */}
      <div className="mt-8 text-center text-xs text-zinc-600">
        <Link to="/" className="hover:text-zinc-400 transition-colors">
          &larr; Back to Cenvora homepage
        </Link>
      </div>
    </div>
  );
}