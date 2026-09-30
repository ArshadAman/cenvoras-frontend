import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon, SparklesIcon, KeyIcon } from '@heroicons/react/24/outline';
import Seo from '../components/Seo';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Email address is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
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
            theme: "filled_black", 
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
        setGoogleError('Failed to login with Google: No token received');
      }
    } catch (err) {
      console.error(err);
      setGoogleError(err?.response?.data?.error || 'Google Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white font-sans flex overflow-hidden selection:bg-cyan-500/30 selection:text-white">
      <Seo
        title="Sign In | Cenvora Sovereign ERP"
        description="Sign in to your private Cenvora instance to manage sales billing, batch stock valuation, and double-entry ledgers."
        canonicalPath="/login"
        noindex
      />
      {loading && <Loader />}
      
      {/* Left Column: High-Trust Commercial Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-14 bg-[#0a0d14] border-r border-white/5 overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-500/10 rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[140px]"></div>
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[170px] h-auto object-contain" />
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Perpetual Architecture • Client Data Sovereignty
          </div>
        </div>

        {/* Real Customer Testimony */}
        <div className="relative z-10 max-w-lg my-auto py-12">
          <div className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
            Verified Enterprise Deployment
          </div>
          <blockquote className="text-2xl font-medium leading-relaxed text-white">
            "We used to dread month-end GST filing and manual stock reconciliations. With Cenvora's perpetual instance, counter bills take 10 seconds and our database is completely our own. It transformed our wholesale operations."
          </blockquote>
          <div className="flex items-center gap-4 mt-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-sm font-bold text-black shadow-lg shadow-cyan-500/20">
              RM
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Rajesh K. Mehta</p>
              <p className="text-gray-400 text-xs">Managing Director, Mehta Industrial Traders</p>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-3 font-mono text-xs">
            <div>
              <span className="text-gray-500 block">Invoicing</span>
              <span className="text-white font-bold">&lt;10s Counter</span>
            </div>
            <div>
              <span className="text-gray-500 block">Sovereignty</span>
              <span className="text-emerald-400 font-bold">100% Private DB</span>
            </div>
            <div>
              <span className="text-gray-500 block">Per-Seat Fee</span>
              <span className="text-cyan-400 font-bold">₹0 Forever</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="relative z-10 flex gap-6 text-xs font-mono text-gray-500">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/gst-hsn-guide" className="hover:text-white transition-colors">HSN Directory</Link>
        </div>
      </div>

      {/* Right Column: Authentication Console */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#07080b]">
        {/* Mobile Header */}
        <nav className="absolute top-0 left-0 w-full p-6 lg:hidden flex justify-between items-center z-20">
          <Link to="/" className="flex items-center">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[130px] h-auto object-contain" />
          </Link>
          <Link to="/signup" className="text-xs font-mono text-cyan-400">
            Create Sandbox &rarr;
          </Link>
        </nav>

        <div className="w-full max-w-md space-y-8 mt-12 sm:mt-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Access Your Console</h2>
            <p className="mt-2 text-sm text-gray-400">
              Sign in to your designated operator or administrative tenant.
            </p>
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
                  setFieldError('username', 'No authentication token returned.');
                }
              } catch {
                setFieldError('username', 'Invalid email or password. Please verify credentials.');
              }
              setLoading(false);
              setSubmitting(false);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                    Email Address
                  </label>
                  <Field
                    type="email"
                    name="username"
                    className="w-full px-4 py-3 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors text-white placeholder-gray-600 text-sm"
                    placeholder="operator@company.com"
                  />
                  <ErrorMessage name="username" component="div" className="text-red-400 text-xs mt-1.5 font-mono" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-cyan-400 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="w-full px-4 py-3 bg-[#0c1017] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors text-white placeholder-gray-600 text-sm pr-16"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-xs font-mono"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1.5 font-mono" />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Field 
                      type="checkbox" 
                      name="rememberMe" 
                      className="w-4 h-4 rounded border-white/20 bg-[#0c1017] text-cyan-400 focus:ring-0 focus:ring-offset-0" 
                    />
                    <span>Keep session active</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-xl shadow-lg shadow-cyan-400/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In to Console'}
                  {!isSubmitting && <ArrowRightIcon className="w-4 h-4" />}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                    <span className="bg-[#07080b] px-3 text-gray-500">Fast Google Authentication</span>
                  </div>
                </div>

                {googleError && (
                  <div className="text-red-400 text-xs text-center font-mono">{googleError}</div>
                )}

                <div id="googleSignInDiv" className="w-full flex justify-center min-h-[44px]"></div>
              </Form>
            )}
          </Formik>

          <div className="pt-4 border-t border-white/5 text-center text-xs text-gray-400">
            Need to evaluate Cenvora?{' '}
            <Link to="/signup" className="text-cyan-400 font-semibold hover:underline">
              Start 14-Day Free Cloud Sandbox
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}