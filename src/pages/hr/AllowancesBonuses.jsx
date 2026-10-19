import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { hrApi } from "../../api/hr";
import {
  GiftIcon, PlusIcon, CheckBadgeIcon, XMarkIcon,
  TrashIcon, CheckCircleIcon, SparklesIcon, CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

function AllowanceBonusModal({ isOpen, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({
    employee: '',
    record_type: 'allowance',
    calculation_mode: 'fixed',
    title: '',
    amount: '',
    is_recurring: false,
    effective_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        employee: '',
        record_type: 'allowance',
        calculation_mode: 'fixed',
        title: '',
        amount: '',
        is_recurring: false,
        effective_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
    }
  }, [isOpen]);

  const PRESETS = {
    allowance: ['Travel Allowance', 'Food & Meal Daily Allowance', 'Internet / Phone Allowance', 'Site Visit Allowance', 'Special Allowance'],
    bonus: ['Performance Bonus', 'Festival / Festive Bonus', 'Annual Incentive Bonus', 'Referral Bonus', 'Retention Bonus']
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter a title for the allowance or bonus");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      await hrApi.createAllowanceBonus({
        employee: form.employee,
        record_type: form.record_type,
        calculation_mode: form.record_type === 'allowance' ? form.calculation_mode : 'fixed',
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        is_recurring: form.record_type === 'allowance' ? form.is_recurring : false,
        effective_date: form.effective_date,
        reason: form.reason.trim(),
        status: 'approved'
      });
      toast.success(`${form.record_type === 'allowance' ? 'Allowance' : 'Bonus'} granted successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to create ${form.record_type}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            Grant Allowance or Bonus
          </h2>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Employee *</label>
            <select
              required
              value={form.employee}
              onChange={e => setForm(p => ({ ...p, employee: e.target.value }))}
              className={ic}
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type *</label>
              <select
                value={form.record_type}
                onChange={e => setForm(p => ({ ...p, record_type: e.target.value, title: '' }))}
                className={ic}
              >
                <option value="allowance">Allowance</option>
                <option value="bonus">Bonus</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Effective Date *</label>
              <input
                required
                type="date"
                value={form.effective_date}
                onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))}
                className={ic}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Title / Category *</label>
            <input
              required
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder={`e.g. ${form.record_type === 'allowance' ? 'Travel Allowance' : 'Performance Bonus'}`}
              className={ic}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS[form.record_type].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setForm(p => ({ ...p, title: preset }))}
                  className="px-2 py-0.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-subtle)] transition"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {form.record_type === 'allowance' && (
            <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <label className={labelCls}>Calculation Mode *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, calculation_mode: 'fixed' }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition text-center ${
                    form.calculation_mode === 'fixed'
                      ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Fixed Monthly Flat
                </button>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, calculation_mode: 'per_day' }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition text-center ${
                    form.calculation_mode === 'per_day'
                      ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Daily Rate (₹/day)
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {form.calculation_mode === 'per_day'
                  ? '💡 Multiplied by days present in monthly payroll: ₹ Rate/day × Present Days.'
                  : '💡 Flat fixed amount added to monthly payroll payslip regardless of daily presence.'}
              </p>
            </div>
          )}

          <div>
            <label className={labelCls}>
              {form.calculation_mode === 'per_day' && form.record_type === 'allowance'
                ? 'Daily Allowance Rate (₹/day) *'
                : 'Amount (₹) *'}
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="1"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className={ic}
              placeholder={form.calculation_mode === 'per_day' ? 'e.g. 500 (per day)' : 'e.g. 5000'}
            />
          </div>

          {form.record_type === 'allowance' && (
            <label className="flex items-center gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.is_recurring}
                onChange={e => setForm(p => ({ ...p, is_recurring: e.target.checked }))}
                className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--accent-primary)] focus:ring-0"
              />
              <div>
                <span className="text-sm text-[var(--text-primary)]">Monthly Recurring</span>
                <p className="text-[11px] text-[var(--text-muted)]">Automatically adds this allowance to every monthly payroll run.</p>
              </div>
            </label>
          )}

          <div>
            <label className={labelCls}>Remarks / Reason</label>
            <textarea
              rows={2}
              value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              className={ic + ' resize-none'}
              placeholder="e.g. Q1 top achiever reward / Approved remote work stipend"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? 'Granting...' : `Grant ${form.record_type === 'allowance' ? 'Allowance' : 'Bonus'}`}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function AllowancesBonuses() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [abRes, empRes] = await Promise.all([
        hrApi.getAllowancesBonuses(),
        hrApi.getEmployees({ status: 'active' }),
      ]);
      setItems(abRes.data?.results || abRes.data || []);
      setEmployees(empRes.data?.results || empRes.data || []);
    } catch (error) {
      toast.error("Failed to load allowances and bonuses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await hrApi.deleteAllowanceBonus(id);
      toast.success("Record deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete record");
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    return item.record_type === activeTab;
  });

  const totalAllowances = items
    .filter(i => i.record_type === 'allowance')
    .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

  const totalBonuses = items
    .filter(i => i.record_type === 'bonus')
    .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

  const recurringCount = items.filter(i => i.is_recurring).length;

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-2 font-semibold">Compensation & Rewards</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <GiftIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Allowances & Bonuses
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                Manage recurring employee allowances, performance rewards, and festival bonuses with automated payroll integration.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4" />
              Grant Allowance / Bonus
            </button>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 font-semibold">Total Active Allowances</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">₹{totalAllowances.toLocaleString('en-IN')}</p>
            <p className="text-xs text-[var(--accent-primary)] mt-1 font-medium">{recurringCount} monthly recurring</p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 font-semibold">Total Bonuses Awarded</p>
            <p className="text-3xl font-bold text-[var(--status-warning)]">₹{totalBonuses.toLocaleString('en-IN')}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Directly credited to net salary</p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 font-semibold">Total Granted Records</p>
            <p className="text-3xl font-bold text-[var(--status-success)]">{items.length}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Across all employees</p>
          </div>
        </div>

        {/* Table Section */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-primary)]/40">
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All Records' },
                { id: 'allowance', label: 'Allowances' },
                { id: 'bonus', label: 'Bonuses' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                    activeTab === tab.id
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-sm'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs inline-flex items-center gap-1 transition"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/70 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Type & Title</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Effective Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-10 text-center text-[var(--text-muted)]">Loading records...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-10 text-center text-[var(--text-muted)]">No allowances or bonus records found.</td></tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                        <p>{item.employee_name || item.employee}</p>
                        {item.employee_code && <p className="text-xs text-[var(--text-muted)] font-mono">{item.employee_code}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                            item.record_type === 'allowance'
                              ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
                              : 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30'
                          }`}>
                            {item.record_type_display || item.record_type}
                          </span>
                          <span className="text-[var(--text-primary)] font-medium">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[var(--text-primary)]">
                          ₹{parseFloat(item.amount || 0).toLocaleString('en-IN')}
                          {item.calculation_mode === 'per_day' && (
                            <span className="text-xs font-normal text-[var(--accent-primary)] ml-1">/ day</span>
                          )}
                        </div>
                        {item.calculation_mode === 'per_day' && (
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                            ⚡ ₹/day × Present Days
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {item.is_recurring ? (
                          <span className="inline-flex items-center gap-1 text-[var(--status-success)] font-medium">
                            ● Monthly Recurring
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">One-time payout</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] text-xs">
                        {item.effective_date}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1.5 text-[var(--status-danger)] hover:text-[var(--status-danger)] rounded-lg hover:bg-[var(--status-danger)]/15 transition"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AllowanceBonusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        employees={employees}
      />
    </>
  );
}
