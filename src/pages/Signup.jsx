import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../api/api.js';
import Loader from '../components/Loader';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const SignupSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Too short!').required('Required'),
  confirm_password: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Required'),
  phone: Yup.string().required('Required'),
  business_name: Yup.string().nullable(),
  gstin: Yup.string().nullable(),
  termsAccepted: Yup.boolean().oneOf([true], 'You must accept the Terms of Service').required('You must accept the Terms of Service'),
});

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans flex overflow-hidden">
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
                Join thousands of businesses scaling with Cenvora.
            </h2>
            <ul className="space-y-4 text-lg text-slate-300">
                <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                    Real-time inventory tracking
                </li>
                <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                    Advanced analytics dashboard
                </li>
                <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                    GST-Ready Billing & Reports
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
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white tracking-tight">Create your account</h2>
                <p className="mt-2 text-slate-400">
                    Start your 30-day free trial. No credit card required.
                </p>
            </div>

            <Formik
                initialValues={{ 
                    email: '', 
                    password: '', 
                    confirm_password: '', 
                    phone: '', 
                    business_name: '', 
                    gstin: '',
                    termsAccepted: false
                }}
                validationSchema={SignupSchema}
                onSubmit={async (values, { setSubmitting, setFieldError }) => {
                    setLoading(true);
                    try {
                        const response = await api.post('/users/signup/', values);
                        if (response.status === 201) {
                            navigate('/login');
                        }
                    } catch (error) {
                        console.error("Signup error:", error);
                        // Handle generic errors here
                    }
                    setLoading(false);
                    setSubmitting(false);
                }}
            >
                {({ isSubmitting }) => (
                    <Form className="mt-8 space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                                <Field
                                    type="email"
                                    name="email"
                                    className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                    placeholder="name@company.com"
                                />
                                <ErrorMessage name="email" component="div" className="text-red-400 text-xs mt-1" />
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
                                    <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm</label>
                                    <Field
                                        type="password"
                                        name="confirm_password"
                                        className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                        placeholder="••••••••"
                                    />
                                    <ErrorMessage name="confirm_password" component="div" className="text-red-400 text-xs mt-1" />
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
                                <ErrorMessage name="phone" component="div" className="text-red-400 text-xs mt-1" />
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
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">GSTIN (Optional)</label>
                                <Field
                                    type="text"
                                    name="gstin"
                                    className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-500"
                                    placeholder="22AAAAA0000A1Z5"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="flex items-start gap-3">
                                <Field 
                                    type="checkbox" 
                                    name="termsAccepted"
                                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-[#1e293b] text-cyan-500 focus:ring-cyan-500" 
                                />
                                <p className="text-sm text-slate-400">
                                    I agree to the <Link to="/terms" className="text-cyan-400 hover:text-cyan-300" target="_blank">Terms of Service</Link> and <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300" target="_blank">Privacy Policy</Link>.
                                </p>
                            </div>
                            <ErrorMessage name="termsAccepted" component="div" className="text-red-400 text-xs mt-1 ml-7" />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Creating account...' : 'Create Account'}
                            {!isSubmitting && <ArrowRightIcon className="w-5 h-5" />}
                        </button>
                    </Form>
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