import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LockClosedIcon, XMarkIcon, ArrowRightOnRectangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import api from '../../api/api';

export default function ReAuthenticateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Attempt to parse existing username/email from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email || payload.username) {
          setUsername(payload.email || payload.username);
        }
      } catch {
        // Ignore parse error
      }
    }

    const handleAuthExpired = (e) => {
      if (e?.detail?.username) {
        setUsername(e.detail.username);
      }
      setErrorMessage('');
      setPassword('');
      setIsOpen(true);
    };

    window.addEventListener('cenvora:auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('cenvora:auth_expired', handleAuthExpired);
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        username: username || undefined,
        password: password,
      };

      const response = await api.post('/users/login/', payload);
      const token = response.data.token || response.data.access;
      const refresh = response.data.refresh;

      if (!token) {
        throw new Error('No access token received.');
      }

      localStorage.setItem('token', token);
      if (refresh) {
        localStorage.setItem('refresh', refresh);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Notify queue that auth is recovered
      window.dispatchEvent(
        new CustomEvent('cenvora:auth_recovered', {
          detail: { token },
        })
      );

      setIsOpen(false);
      setPassword('');
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Authentication failed. Please verify your password.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('role');
    localStorage.removeItem('activeSession');
    setIsOpen(false);
    window.location.href = '/login';
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop with heavy blur */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-up">
        {/* Header Icon */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] flex items-center justify-center text-[var(--status-warning)]">
              <LockClosedIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Session Paused</h2>
              <p className="text-xs text-[var(--text-muted)]">Re-authenticate to protect in-flight work</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
            title="Log out instead"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
          Your active login session expired. Enter your password to resume seamlessly without losing uncommitted invoice drafts or calculations.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-[var(--status-danger)] text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {username && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Account
              </label>
              <input
                type="text"
                disabled
                value={username}
                className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-muted)] text-sm cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm pr-11 focus:outline-none focus:border-[var(--accent-primary)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <span>Unlock & Resume</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary w-full py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Log out instead</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
