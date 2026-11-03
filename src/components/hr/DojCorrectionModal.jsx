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
          <thead><tr className="text-[var(--text-muted)]"><th className="text-left">Relates to</th><th className="text-right">Days (old → new / working)</th><th className="text-right">Gross used</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            {data.lines.map((l, i) => (
              <tr key={i}>
                <td>{MONTHS[(l.month || 1) - 1]} {l.year}</td>
                <td className="text-right">{l.carry ? '—' : `${l.old_payable_days} → ${l.new_payable_days} / ${l.working_days}`}</td>
                <td className="text-right">{l.monthly_gross != null ? `₹${inr(l.monthly_gross)}` : '—'}</td>
                <td className="text-right">{Number(l.delta) < 0 ? '−' : ''}₹{inr(l.delta)}{l.edited ? ' (edited)' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data.recompute_of && (
        <p className="text-xs text-[var(--text-muted)]">This recomputes the earlier ₹0 correction ({data.old_doj} → {data.new_doj}); its old values are kept in its history.</p>
      )}
      {Array.isArray(data.warnings) && data.warnings.map((w, i) => (
        <p key={i} className="text-amber-600 text-xs" data-testid="doj-warning">⚠ {w}</p>
      ))}
    </div>
  );
}

function EditCorrection({ employee, corr, onSaved }) {
  const [amounts, setAmounts] = useState({});
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const key = (l) => `${l.year}-${l.month}`;
  useEffect(() => {
    const a = {};
    (corr.lines || []).forEach((l) => { if (!l.carry) a[key(l)] = l.delta; });
    setAmounts(a); setReason(''); setErrors([]);
  }, [corr]);
  const save = async () => {
    setErrors([]);
    if (!reason.trim()) { setErrors(['A reason is required to edit the arrears.']); return; }
    const lines = (corr.lines || []).filter((l) => !l.carry && String(amounts[key(l)]) !== String(l.delta))
      .map((l) => ({ year: l.year, month: l.month, amount: amounts[key(l)] }));
    if (!lines.length) { setErrors(['Change at least one amount.']); return; }
    setBusy(true);
    try {
      await hrApi.adjustDojCorrection(employee.id, corr.id, { lines, reason: reason.trim() });
      toast.success('DOJ correction updated');
      onSaved();
    } catch (err) { setErrors(apiErrorLines(err)); } finally { setBusy(false); }
  };
  const ic = 'rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] px-2 py-1 text-xs text-[var(--text-primary)]';
  return (
    <div className="space-y-2 text-xs" data-testid="doj-edit">
      {(corr.lines || []).filter((l) => !l.carry).map((l) => (
        <div key={key(l)} className="flex items-center justify-between gap-2">
          <span>{MONTHS[l.month - 1]} {l.year} (computed ₹{inr(l.computed_delta ?? l.delta)})</span>
          <input type="number" step="0.01" className={ic + ' w-32 text-right'} value={amounts[key(l)] ?? ''}
            onChange={(e) => setAmounts({ ...amounts, [key(l)]: e.target.value })} aria-label={`Amount for ${MONTHS[l.month - 1]} ${l.year}`} />
        </div>
      ))}
      <input className={ic + ' w-full'} placeholder="Reason for the edit (logged)" value={reason} onChange={(e) => setReason(e.target.value)} />
      {errors.map((m, i) => <p key={i} className="text-red-500">{m}</p>)}
      <div className="flex justify-end"><button type="button" disabled={busy} onClick={save} className="btn-secondary px-3 py-1 rounded-lg disabled:opacity-50">{busy ? 'Saving…' : 'Save amounts'}</button></div>
    </div>
  );
}

function ExistingCorrections({ employee, refreshKey }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = async () => {
    try { const r = await hrApi.listDojCorrections(employee.id); setItems((r.data || []).filter((c) => !c.carried)); } catch { setItems([]); }
  };
  useEffect(() => { load(); setEditing(null); }, [employee?.id, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] p-3 space-y-2 text-sm">
      <p className="font-semibold text-[var(--text-primary)]">Earlier corrections</p>
      {items.map((c) => (
        <div key={c.id} className="space-y-1">
          <div className="flex justify-between gap-2 text-xs">
            <span>{c.old_doj} → {c.new_doj}: {c.kind} ₹{inr(c.amount)} in {MONTHS[c.target_month - 1]} {c.target_year}</span>
            {c.editable ? (
              <button type="button" className="underline" onClick={() => setEditing(editing === c.id ? null : c.id)}>{editing === c.id ? 'Close' : 'Edit amounts'}</button>
            ) : <span className="text-[var(--text-muted)]">Locked (run approved)</span>}
          </div>
          {editing === c.id && <EditCorrection employee={employee} corr={c} onSaved={() => { setEditing(null); load(); }} />}
        </div>
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
      const payload = { new_doj: newDoj, reason: reason.trim() };
      if (preview?.recompute_of) payload.recompute = true;
      const res = await hrApi.applyDojCorrection(employee.id, payload);
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
            <ExistingCorrections employee={employee} refreshKey={result?.id} />
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
            <ExistingCorrections employee={employee} refreshKey={employee?.id} />
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
