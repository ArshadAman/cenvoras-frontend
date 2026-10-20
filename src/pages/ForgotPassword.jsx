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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex items-center justify-center p-6">
      <Seo
        title="Reset Password"
        description="Reset your Cenvora password to regain access to billing and inventory tools."
        canonicalPath="/forgot-password"
        noindex
      />
      {loading && <Loader />}
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">Forgot Password</h1>
        <p className="text-[var(--text-secondary)] mt-1.5 text-sm">
          {otpSent
            ? 'Enter the OTP sent to your email and set a new password.'
            : 'Enter your email to receive a password reset OTP.'}
        </p>

        {message ? <div className="mt-4 text-sm text-[var(--status-success)]">{message}</div> : null}

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
                  <label className="form-label">Email</label>
                  <Field
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="name@company.com"
                  />
                  <ErrorMessage name="email" component="div" className="form-error" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
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
                  <label className="form-label">Email</label>
                  <Field
                    name="email"
                    type="email"
                    className="form-input"
                  />
                  <ErrorMessage name="email" component="div" className="form-error" />
                </div>

                <div>
                  <label className="form-label">OTP</label>
                  <Field
                    name="otp"
                    type="text"
                    className="form-input font-mono tracking-widest text-center"
                    placeholder="6-digit OTP"
                  />
                  <ErrorMessage name="otp" component="div" className="form-error" />
                </div>

                <div>
                  <label className="form-label">New Password</label>
                  <Field
                    name="password"
                    type="password"
                    className="form-input"
                    placeholder="Minimum 8 characters"
                  />
                  <ErrorMessage name="password" component="div" className="form-error" />
                </div>

                <div>
                  <label className="form-label">Confirm Password</label>
                  <Field
                    name="confirmPassword"
                    type="password"
                    className="form-input"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="form-error" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-2.5 text-sm font-semibold rounded-xl"
                >
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </Form>
            )}
          </Formik>
        )}

        <p className="text-sm text-[var(--text-muted)] mt-6 text-center">
          Remembered your password?{' '}
          <Link to="/login" className="text-[var(--accent-primary)] hover:underline font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
