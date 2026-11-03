import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
    },
    onError: (e) => {
      const d = e?.response?.data;
      setError((d && (d.gstin || d.gst_status || d.error || d.message)) ? String(d.gstin || d.gst_status || d.error || d.message) : 'Could not save the GST status.');
    },
  });
  if (!isAdmin || !needsGstStatusConfirmation(billing)) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center gap-3">
      <span className="font-semibold">Confirm your GST status (Regular / Composition / Not registered)</span>
      <select value={choice} onChange={(e) => setChoice(e.target.value)} aria-label="GST status"
        className="rounded-lg border border-amber-300 bg-white px-2 py-1">
        <option value="" disabled>Choose…</option>
        {GST_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button type="button" disabled={!choice || save.isPending} onClick={() => { setError(''); save.mutate(choice); }}
        className="btn-primary !text-sm disabled:opacity-60">
        {save.isPending ? 'Saving…' : 'Confirm'}
      </button>
      {error && <span className="text-red-700">{error}</span>}
    </div>
  );
}
