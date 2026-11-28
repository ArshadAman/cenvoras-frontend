import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { updateUserProfile } from '../api/users';
import { GST_STATUS_OPTIONS, needsGstStatusConfirmation } from '../utils/gstStatus';

// Rudra (#216): admin-only banner until the company GST status is confirmed. The only way to
// dismiss it is to save a status.
export default function GstStatusConfirmBanner({ profileData, isAdmin }) {
  const billing = profileData?.billing_profile || profileData?.profile || {};
  const [choice, setChoice] = useState(billing.gst_status || '');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (gst_status) => updateUserProfile({ gst_status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('GST status confirmed. Invoice tax rules are now aligned.');
    },
    onError: (e) => {
      const d = e?.response?.data;
      setError((d && (d.gstin || d.gst_status || d.error || d.message)) ? String(d.gstin || d.gst_status || d.error || d.message) : 'Could not save your GST status. Please try again.');
    },
  });
  if (!isAdmin || !needsGstStatusConfirmation(billing)) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-2xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-3.5 text-sm text-[var(--text-primary)] flex flex-wrap items-center justify-between gap-3 shadow-sm"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--status-warning-border)] text-[var(--status-warning)] flex items-center justify-center shrink-0">
          <ShieldCheckIcon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)]">
            Confirm your GST registration status
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            This ensures your invoices apply the correct CGST/SGST or Composition tax rules automatically.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          aria-label="GST status"
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="" disabled>Select GST status…</option>
          {GST_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          type="button"
          disabled={!choice || save.isPending}
          onClick={() => { setError(''); save.mutate(choice); }}
          className="btn-primary !text-sm !py-1.5 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Confirm Status'}
        </button>
      </div>
      {error && <span className="w-full text-xs font-medium text-[var(--status-danger)]">{error}</span>}
    </div>
  );
}
