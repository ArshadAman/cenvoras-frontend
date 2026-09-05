import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import api from '../api/api';
import Loader from '../components/Loader';
import Seo from '../components/Seo';

const requestSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
});

const confirmSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  otp: Yup.string().length(6, 'OTP must be 6 digits').required('Required'),
  password: Yup.string().min(8, 'Minimum 8 characters').required('Required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Required'),
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans flex items-center justify-center p-6">
      <Seo
        title="Reset Password"
        description="Reset your Cenvora password to regain access to billing and inventory tools."
        canonicalPath="/forgot-password"
        noindex
      />
      {loading && <Loader />}
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Forgot Password</h1>
        <p className="text-slate-400 mt-2 text-sm">
          {otpSent
            ? 'Enter the OTP sent to your email and set a new password.'
            : 'Enter your email to receive a password reset OTP.'}
        </p>

        {message ? <div className="mt-4 text-sm text-cyan-300">{message}</div> : null}

        {!otpSent ? (
          <Formik
            initialValues={{ email: '' }}
            validationSchema={requestSchema}
            onSubmit={async (values, { setSubmitting, setFieldError }) => {
              setLoading(true);
              try {
                await api.post('/users/password-reset/', { email: values.email });
                setEmail(values.email);
                setOtpSent(true);
                setMessage('OTP sent to your email.');
              } catch {
                setFieldError('email', 'Unable to send OTP right now. Please try again.');
              }
              setLoading(false);
              setSubmitting(false);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Email</label>
                  <Field
                    name="email"
                    type="email"
                    className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
                    placeholder="name@company.com"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                  {!isSubmitting && <ArrowRightIcon className="w-4 h-4" />}
                </button>
              </Form>
            )}
          </Formik>
        ) : (
          <Formik
            initialValues={{ email, otp: '', password: '', confirmPassword: '' }}
            enableReinitialize
            validationSchema={confirmSchema}
            onSubmit={async (values, { setSubmitting, setFieldError }) => {
              setLoading(true);
              try {
                await api.post('/users/password-reset-otp-confirm/', {
                  email: values.email,
                  otp: values.otp,
                  password: values.password,
                });
                setMessage('Password reset successful. Redirecting to login...');
                setTimeout(() => navigate('/login'), 1000);
              } catch (err) {
                const backend = err?.response?.data?.error;
                setFieldError('otp', backend || 'Invalid OTP or request failed.');
              }
              setLoading(false);
              setSubmitting(false);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Email</label>
                  <Field
                    name="email"
                    type="email"
                    className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl text-white"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">OTP</label>
                  <Field
                    name="otp"
                    type="text"
                    className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl text-white"
                    placeholder="6-digit OTP"
                  />
                  <ErrorMessage name="otp" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">New Password</label>
                  <Field
                    name="password"
                    type="password"
                    className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl text-white"
                    placeholder="Minimum 8 characters"
                  />
                  <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Confirm Password</label>
                  <Field
                    name="confirmPassword"
                    type="password"
                    className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl text-white"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold"
                >
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </Form>
            )}
          </Formik>
        )}

        <p className="text-sm text-slate-400 mt-6 text-center">
          Remembered your password?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
