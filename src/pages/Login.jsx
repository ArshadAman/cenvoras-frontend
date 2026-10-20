import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Seo from '../components/Seo';
import AuthPrismCanvas from '../components/3d/AuthPrismCanvas';
import BrandLogo from '../components/common/BrandLogo';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Please enter your email address'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Please enter your password'),
});

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState('');

  React.useEffect(() => {
    /* global google */
    const initGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { 
            theme: "outline", 
            size: "large", 
            width: "100%",
            text: "signin_with",
            shape: "rectangular"
          }
        );
      } else {
        setTimeout(initGoogleSignIn, 100);
      }
    };
    initGoogleSignIn();
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

        if (onLogin) onLogin(false);
      } else {
        setGoogleError('Could not log in with Google. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setGoogleError(err?.response?.data?.error || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-body flex flex-col justify-between">
      <Seo
        title="Sign In | Cenvora"
        description="Sign in to your Cenvora account to manage invoices, stock, and customer ledgers."
        canonicalPath="/login"
        noindex
      />
      {loading && <Loader />}

      <div className="flex-1 flex w-full">
        {/* Left Side: 50% Interactive 3D Showcase Panel (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] p-12 flex-col justify-between overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Tagline */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <BrandLogo className="h-12 sm:h-14 w-auto" />
            </Link>
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--accent-primary)] text-xs font-semibold mb-3">
                <ShieldCheckIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                GST-Ready Business Cloud
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-snug font-display">
                Accelerate your daily billing, stock, and customer accounts.
              </h2>
            </div>
          </div>

          {/* Center 3D Interactive Canvas */}
          <div className="relative z-10 my-4 flex items-center justify-center">
            <AuthPrismCanvas />
          </div>

          {/* Bottom Trust Indicators */}
          <div className="relative z-10 border-t border-[var(--border-subtle)] pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)]">
                <div className="text-lg font-bold text-[var(--text-primary)] font-mono">₹1.2M+</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Daily Invoiced</div>
              </div>
              <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)]">
                <div className="text-lg font-bold text-[var(--status-success)] font-mono">99.98%</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Uptime SLA</div>
              </div>
              <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)]">
                <div className="text-lg font-bold text-[var(--accent-primary)] font-mono">100%</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">GST Compliant</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-block hover:opacity-90 transition-opacity mb-4">
                <BrandLogo className="h-10 sm:h-11 w-auto mx-auto" />
              </Link>
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-display">Sign in to Cenvora</h2>
            </div>

            {/* Auth Glass Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight font-display">Welcome back</h1>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">Sign in to your account to access your workspace</p>
              </div>

              <Formik
                initialValues={{ username: '', password: '', rememberMe: false }}
                validationSchema={LoginSchema}
                onSubmit={async (values, { setSubmitting, setFieldError }) => {
                  setLoading(true);
                  try {
                    const payload = {
                      username: values.username,
                      password: values.password,
                    };
                    const response = await api.post('/users/login/', payload);
                    const token = response.data.token || response.data.access;
                    if (token) {
                      localStorage.setItem('token', token);
                      localStorage.setItem('refresh', response.data.refresh);
                      
                      try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        localStorage.setItem('role', payload.role || 'admin');
                      } catch (e) {
                        console.error("Failed to parse token", e);
                      }

                      if (onLogin) onLogin(values.rememberMe);
                    } else {
                      setFieldError('username', 'No login token received.');
                    }
                  } catch {
                    setFieldError('username', 'Invalid email or password. Please try again.');
                  }
                  setLoading(false);
                  setSubmitting(false);
                }}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-4">
                    <div>
                      <label className="form-label">
                        Email Address
                      </label>
                      <Field
                        type="email"
                        name="username"
                        className="form-input"
                        placeholder="name@company.com"
                      />
                      <ErrorMessage name="username" component="div" className="form-error" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="form-label !mb-0">
                          Password
                        </label>
                        <Link to="/forgot-password" className="text-xs text-[var(--accent-primary)] hover:underline transition-colors font-medium">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="password"
                          className="form-input pr-16"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <ErrorMessage name="password" component="div" className="form-error" />
                    </div>

                    <div className="flex items-center text-xs text-[var(--text-muted)] pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Field 
                          type="checkbox" 
                          name="rememberMe" 
                          className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--accent-primary)] focus:ring-0" 
                        />
                        <span>Remember me on this device</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-3 btn-primary font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--border-subtle)]"></div>
                      </div>
                      <div className="relative flex justify-center text-xs text-[var(--text-muted)] font-medium">
                        <span className="bg-[var(--bg-surface)] px-3">or continue with</span>
                      </div>
                    </div>

                    {googleError && (
                      <div className="text-[var(--status-danger)] text-xs text-center">{googleError}</div>
                    )}

                    <div id="googleSignInDiv" className="w-full flex justify-center min-h-[40px]"></div>
                  </Form>
                )}
              </Formik>

              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                Don't have an account?{' '}
                <Link to="/signup" className="text-[var(--text-primary)] font-semibold hover:text-[var(--accent-primary)] transition-colors">
                  Start 14-day free trial
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-[var(--text-muted)]">
              <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">
                &larr; Back to Cenvora homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}