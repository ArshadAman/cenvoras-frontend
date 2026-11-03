import React, { useEffect, useState } from 'react';
import { hrApi } from '../../api/hr';
import { getUserRole } from '../../utils/auth';
import { showErrorToast, showSuccessToast } from '../../utils/toastUtils';

/**
 * One-time admin banner: salary components that look like DA / retaining allowance but are not
 * flagged "Counts as PF wages". Dismissal is stored on the server; a new match shows it again.
 */
export default function PfWagesBanner() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const isAdmin = getUserRole() === 'admin';

  const load = () => hrApi.getPfWageComponents().then((r) => setData(r.data)).catch(() => setData(null));
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin || !data?.show_banner) return null;
  const items = (data.matches || []).filter((m) => !m.dismissed);

  const flag = async (m) => {
    setBusy(m.id);
    try {
      await hrApi.pfWageComponentsAction(m.kind === 'custom'
        ? { action: 'flag', assignment_id: m.assignment_id, name: m.name }
        : { action: 'flag', component_id: m.id });
      showSuccessToast(`${m.name} now counts as PF wages`);
      await load();
    } catch (err) { showErrorToast(err, 'Could not flag the component'); } finally { setBusy(''); }
  };
  const dismiss = async () => {
    setBusy('dismiss');
    try { await hrApi.pfWageComponentsAction({ action: 'dismiss' }); await load(); }
    catch (err) { showErrorToast(err, 'Could not dismiss'); } finally { setBusy(''); }
  };

  return (
    <div role="status" className="rounded-2xl border border-[var(--status-warning)]/40 bg-[var(--status-warning)]/10 p-4 text-sm space-y-2" data-testid="pf-wages-banner">
      <p className="font-semibold text-[var(--text-primary)]">Check PF wages: DA / retaining allowance</p>
      <p className="text-xs text-[var(--text-secondary)]">
        Under the EPF Act, DA and retaining allowance are PF wages with Basic (capped at the PF wage ceiling).
        These salary components and employee custom allowances look like DA or retaining allowance but aren't flagged. Flagging also changes PF on DOJ-correction arrears.
      </p>
      <ul className="space-y-1">
        {items.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3">
            <span className="text-[var(--text-primary)]">{m.name} <span className="text-xs text-[var(--text-muted)]">({m.kind === 'custom' ? `custom allowance, ${m.employee}` : m.salary_structure})</span></span>
            <button type="button" disabled={!!busy} onClick={() => flag(m)}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-50">
              {busy === m.id ? 'Saving…' : 'Flag as PF wages'}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <button type="button" disabled={!!busy} onClick={dismiss} className="text-xs text-[var(--text-muted)] underline disabled:opacity-50">Dismiss</button>
      </div>
    </div>
  );
}
