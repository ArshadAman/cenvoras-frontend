import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Seo from '../components/Seo';

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
    <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-center items-center px-6 py-12">
      <Seo
        title="Sign In | Cenvora"
        description="Sign in to your Cenvora account to manage invoices, stock, and customer ledgers."
        canonicalPath="/login"
        noindex
      />
      {loading && <Loader />}

      {/* Brand Logo */}
      <div className="mb-8">
        <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
          <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800/80 rounded-2xl p-7 sm:p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-xs text-zinc-400 mt-1">Sign in with your email and password</p>
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
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <Field
                  type="email"
                  name="username"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 text-sm transition-colors"
                  placeholder="name@company.com"
                />
                <ErrorMessage name="username" component="div" className="text-red-400 text-xs mt-1" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-zinc-400 hover:text-white transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Field
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 text-sm pr-14 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1" />
              </div>

              <div className="flex items-center text-xs text-zinc-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Field 
                    type="checkbox" 
                    name="rememberMe" 
                    className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0" 
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 bg-white text-zinc-950 font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                {!isSubmitting && <ArrowRightIcon className="w-3.5 h-3.5" />}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-[11px] text-zinc-500">
                  <span className="bg-zinc-950 px-2">or continue with</span>
                </div>
              </div>

              {googleError && (
                <div className="text-red-400 text-xs text-center">{googleError}</div>
              )}

              <div id="googleSignInDiv" className="w-full flex justify-center min-h-[40px]"></div>
            </Form>
          )}
        </Formik>

        <div className="mt-6 pt-5 border-t border-zinc-900 text-center text-xs text-zinc-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-white font-medium hover:underline">
            Start 14-day free trial
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