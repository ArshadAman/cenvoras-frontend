import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Required'),
  password: Yup.string().min(6, 'Too short!').required('Required'),
});

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans flex overflow-hidden">
      {loading && <Loader />}
      
      {/* Left Side - Visual & Testimonial (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-[#020617] overflow-hidden">
        {/* Abstract Background Mesh */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-900/20 via-[#0f172a] to-blue-900/20"></div>
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        {/* Brand Logo */}
        <Link to="/" className="relative z-10 flex items-center hover:opacity-90 transition-opacity">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[180px] h-auto object-contain" />
        </Link>

        {/* Testimonial / Value Prop */}
        <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight mb-6">
                "Cenvora transformed how we track our inventory. It's not just a tool; it's our growth engine."
            </h2>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold">
                    JD
                </div>
                <div>
                    <p className="font-semibold text-white">John Doe</p>
                    <p className="text-slate-400 text-sm">CEO, TechFlow Inc.</p>
                </div>
            </div>
        </div>

        {/* Footer Links */}
        <div className="relative z-10 flex gap-6 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#0f172a] relative">
        {/* Mobile Navbar (Only visible on mobile) */}
        <nav className="absolute top-0 left-0 w-full p-6 lg:hidden flex justify-between items-center z-20">
            <Link to="/" className="flex items-center">
                <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[140px] h-auto object-contain" />
            </Link>
        </nav>

        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
                <p className="mt-2 text-slate-400">
                    Please enter your details to sign in.
                </p>
            </div>

            <Formik
                initialValues={{ username: '', password: '' }}
                validationSchema={LoginSchema}
                onSubmit={async (values, { setSubmitting, setFieldError }) => {
                    setLoading(true);
                    try {
                        const response = await api.post('/users/login/', values);
                        const token = response.data.token || response.data.access;
                        if (token) {
                            localStorage.setItem('token', token);
                            localStorage.setItem('refresh', response.data.refresh);
                            
                            // Extract and store role for easy access
                            try {
                                const payload = JSON.parse(atob(token.split('.')[1]));
                                localStorage.setItem('role', payload.role || 'admin'); // Default to admin if missing
                            } catch (e) {
                                console.error("Failed to parse token", e);
                            }

                            if (onLogin) onLogin();
                        } else {
                            setFieldError('username', 'No token received');
                        }
                    } catch (error) {
                        setFieldError('username', 'Invalid credentials');
                    }
                    setLoading(false);
                    setSubmitting(false);
                }}
            >
                {({ isSubmitting }) => (
                    <Form className="mt-8 space-y-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                                <Field
                                    type="text"
                                    name="username"
                                    className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                    placeholder="Enter your username"
                                />
                                <ErrorMessage name="username" component="div" className="text-red-400 text-xs mt-1" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <Field
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-[#1e293b] text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                                <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Forgot password?</Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                            {!isSubmitting && <ArrowRightIcon className="w-5 h-5" />}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-800"></div>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>

            <p className="text-center text-sm text-slate-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                    Sign up for free
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
}