import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { hrApi } from '../../api/hr';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Flatten a DRF/Django error body into readable lines, exactly as the API sent them. */
export function apiErrorLines(err) {
  const data = err?.response?.data;
  if (!data) return [err?.message || 'Request failed'];
  if (typeof data === 'string') return [data];
  return Object.entries(data).map(([k, v]) => {
    const msg = Array.isArray(v) ? v.join(' ') : String(v);
    return k === 'error' || k === 'detail' || k === 'non_field_errors' ? msg : `${k}: ${msg}`;
  });
}

function inr(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v;
}

function ResultBlock({ data, title }) {
  if (!data) return null;
  const amt = Number(data.amount);
  const isRecovery = data.kind === 'recovery' || amt < 0;
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] p-3 space-y-2 text-sm" data-testid="doj-result">
      <p className="font-semibold text-[var(--text-primary)]">{title}</p>
      <p>
        {data.old_doj} → {data.new_doj}:{' '}
        <strong className={isRecovery ? 'text-red-500' : 'text-green-600'}>
          {amt === 0 ? 'No change to pay' : `${isRecovery ? 'Recovery' : 'Arrears'} ₹${inr(data.amount)}`}
        </strong>
        {data.target_month ? ` in ${MONTHS[data.target_month - 1]} ${data.target_year} payroll` : ''}
      </p>
      {Array.isArray(data.lines) && data.lines.length > 0 && (
        <table className="w-full text-xs">
          <thead><tr className="text-[var(--text-muted)]"><th className="text-left">Month</th><th className="text-right">Days (old → new)</th><th className="text-right">Difference</th></tr></thead>
          <tbody>
            {data.lines.map((l, i) => (
              <tr key={i}>
                <td>{MONTHS[(l.month || 1) - 1]} {l.year}</td>
                <td className="text-right">{l.old_payable_days} → {l.new_payable_days}</td>
                <td className="text-right">{Number(l.delta) < 0 ? '−' : ''}₹{inr(l.delta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {Array.isArray(data.warnings) && data.warnings.map((w, i) => (
        <p key={i} className="text-amber-600 text-xs" data-testid="doj-warning">⚠ {w}</p>
      ))}
    </div>
  );
}

export default function DojCorrectionModal({ isOpen, onClose, employee, onSuccess }) {
  const [newDoj, setNewDoj] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) { setNewDoj(''); setReason(''); setErrors([]); setPreview(null); setResult(null); }
  }, [isOpen, employee?.id]);

  if (!isOpen || !employee) return null;

  const doPreview = async () => {
    setErrors([]); setPreview(null);
    if (!newDoj) { setErrors(['Pick the corrected date of joining.']); return; }
    setBusy(true);
    try {
      const res = await hrApi.previewDojCorrection(employee.id, newDoj);
      setPreview(res.data);
    } catch (err) { setErrors(apiErrorLines(err)); } finally { setBusy(false); }
  };

  const doApply = async (e) => {
    e.preventDefault();
    setErrors([]);
    if (!newDoj) { setErrors(['Pick the corrected date of joining.']); return; }
    if (!reason.trim()) { setErrors(['A reason is required for a DOJ correction.']); return; }
    setBusy(true);
    try {
      const res = await hrApi.applyDojCorrection(employee.id, { new_doj: newDoj, reason: reason.trim() });
      setResult(res.data);
      toast.success('Date of joining corrected');
      if (onSuccess) onSuccess();
    } catch (err) { setErrors(apiErrorLines(err)); } finally { setBusy(false); }
  };

  const ic = 'w-full rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] px-3 py-2 text-sm text-[var(--text-primary)]';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-label="Correct joining date">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Correct joining date</h2>
          <p className="text-xs text-[var(--text-muted)]">
            {employee.full_name} ({employee.employee_code}). Current date of joining: {employee.date_of_joining}.
            Locked months stay unchanged; the difference is paid or recovered in the next open payroll.
            If no payroll has run for this employee yet, just use Edit Profile.
          </p>
        </div>
        {result ? (
          <>
            <ResultBlock data={result} title="Correction saved" />
            <div className="flex justify-end"><button type="button" onClick={onClose} className="btn-primary px-5 py-2 text-sm rounded-xl">Done</button></div>
          </>
        ) : (
          <form onSubmit={doApply} className="space-y-3">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Corrected date of joining *</label>
              <input type="date" required value={newDoj} onChange={(e) => { setNewDoj(e.target.value); setPreview(null); }} className={ic} />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Reason *</label>
              <textarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={ic + ' resize-none'} placeholder="e.g. Offer letter shows joining on 15-Aug" />
            </div>
            {errors.length > 0 && (
              <div className="rounded-xl border border-red-400/50 bg-red-500/10 p-3 text-sm text-red-500" data-testid="doj-errors">
                {errors.map((m, i) => <p key={i}>{m}</p>)}
              </div>
            )}
            <ResultBlock data={preview} title="Preview (not saved)" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm rounded-xl">Cancel</button>
              <button type="button" disabled={busy} onClick={doPreview} className="btn-secondary px-4 py-2 text-sm rounded-xl disabled:opacity-50">Preview</button>
              <button type="submit" disabled={busy} className="btn-primary px-5 py-2 text-sm font-semibold rounded-xl disabled:opacity-50">{busy ? 'Saving…' : 'Apply correction'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
