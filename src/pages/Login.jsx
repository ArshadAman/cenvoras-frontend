import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Seo from '../components/Seo';
import AuthPrismCanvas from '../components/3d/AuthPrismCanvas';

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
    <div className="min-h-screen bg-[#080C14] text-white font-sans flex flex-col justify-between selection:bg-sky-500/20 selection:text-sky-300">
      <Seo
        title="Sign In | Cenvora"
        description="Sign in to your Cenvora account to manage invoices, stock, and customer ledgers."
        canonicalPath="/login"
        noindex
      />
      {loading && <Loader />}

      <div className="flex-1 flex w-full">
        {/* Left Side: 50% Interactive 3D Showcase Panel (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B0F19] border-r border-slate-800/80 p-12 flex-col justify-between overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Tagline */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora" className="h-8 w-auto" />
            </Link>
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-sky-400 text-xs font-semibold mb-3">
                <ShieldCheckIcon className="w-4 h-4 text-sky-400" />
                GST-Ready Business Cloud
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
                Accelerate your daily billing, stock, and customer accounts.
              </h2>
            </div>
          </div>

          {/* Center 3D Interactive Canvas */}
          <div className="relative z-10 my-4 flex items-center justify-center">
            <AuthPrismCanvas />
          </div>

          {/* Bottom Trust Indicators */}
          <div className="relative z-10 border-t border-slate-800/80 pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div className="text-lg font-bold text-white font-mono">₹1.2M+</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Daily Invoiced</div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div className="text-lg font-bold text-emerald-400 font-mono">99.98%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Uptime SLA</div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div className="text-lg font-bold text-sky-400 font-mono">100%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">GST Compliant</div>
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
                <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora" className="h-8 w-auto mx-auto" />
              </Link>
              <h2 className="text-xl font-bold text-white">Sign in to Cenvora</h2>
            </div>

            {/* Auth Glass Card */}
            <div className="bg-slate-900/50 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome back</h1>
                <p className="text-xs text-slate-400 mt-1.5">Sign in to your account to access your workspace</p>
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
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Address
                      </label>
                      <Field
                        type="email"
                        name="username"
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm transition-all"
                        placeholder="name@company.com"
                      />
                      <ErrorMessage name="username" component="div" className="text-rose-400 text-xs mt-1.5" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300">
                          Password
                        </label>
                        <Link to="/forgot-password" className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="password"
                          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm pr-16 transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <ErrorMessage name="password" component="div" className="text-rose-400 text-xs mt-1.5" />
                    </div>

                    <div className="flex items-center text-xs text-slate-400 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Field 
                          type="checkbox" 
                          name="rememberMe" 
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0" 
                        />
                        <span>Remember me on this device</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-3.5 bg-white text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                      {!isSubmitting && <ArrowRightIcon className="w-3.5 h-3.5" />}
                    </button>

                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800"></div>
                      </div>
                      <div className="relative flex justify-center text-[11px] text-slate-500">
                        <span className="bg-slate-900 px-3">or continue with</span>
                      </div>
                    </div>

                    {googleError && (
                      <div className="text-rose-400 text-xs text-center">{googleError}</div>
                    )}

                    <div id="googleSignInDiv" className="w-full flex justify-center min-h-[40px]"></div>
                  </Form>
                )}
              </Formik>

              <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-white font-semibold hover:text-sky-300 transition-colors">
                  Start 14-day free trial
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