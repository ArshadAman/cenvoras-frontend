import React, { useState, useEffect } from "react";
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
        title: '',
        amount: '',
        is_recurring: false,
        effective_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
    }
  }, [isOpen]);

  const PRESETS = {
    allowance: ['Travel Allowance', 'Internet / Phone Allowance', 'Food & Meal Allowance', 'Medical Allowance', 'Special Allowance'],
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
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm";
  const labelCls = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-indigo-400" />
            Grant Allowance or Bonus
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
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
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-400 hover:text-indigo-300 transition"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Amount (₹) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="1"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className={ic}
              placeholder="e.g. 5000"
            />
          </div>

          {form.record_type === 'allowance' && (
            <label className="flex items-center gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.is_recurring}
                onChange={e => setForm(p => ({ ...p, is_recurring: e.target.checked }))}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-0"
              />
              <div>
                <span className="text-sm text-gray-300">Monthly Recurring</span>
                <p className="text-[11px] text-gray-500">Automatically adds this allowance to every monthly payroll run.</p>
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

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-400 bg-white/5 rounded-xl hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 transition disabled:opacity-50"
            >
              {saving ? 'Granting...' : `Grant ${form.record_type === 'allowance' ? 'Allowance' : 'Bonus'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
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
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Compensation & Rewards</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <GiftIcon className="w-9 h-9 text-indigo-300" />
                Allowances & Bonuses
              </h1>
              <p className="text-white/65 text-sm mt-2">
                Manage recurring employee allowances, performance rewards, and festival bonuses with automated payroll integration.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300"
            >
              <PlusIcon className="h-4 w-4" />
              Grant Allowance / Bonus
            </button>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Active Allowances</p>
            <p className="text-3xl font-bold text-white">₹{totalAllowances.toLocaleString('en-IN')}</p>
            <p className="text-xs text-indigo-300 mt-1">{recurringCount} monthly recurring</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Bonuses Awarded</p>
            <p className="text-3xl font-bold text-amber-400">₹{totalBonuses.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">Directly credited to net salary</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Granted Records</p>
            <p className="text-3xl font-bold text-emerald-400">{items.length}</p>
            <p className="text-xs text-gray-500 mt-1">Across all employees</p>
          </div>
        </div>

        {/* Table Section */}
        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
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
                    activeTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              className="text-gray-400 hover:text-white text-xs inline-flex items-center gap-1"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
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
                  <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-400">Loading records...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-400">No allowances or bonus records found.</td></tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">
                        <p>{item.employee_name || item.employee}</p>
                        {item.employee_code && <p className="text-xs text-gray-500">{item.employee_code}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.record_type === 'allowance' ? 'bg-blue-500/15 text-blue-300' : 'bg-purple-500/15 text-purple-300'
                          }`}>
                            {item.record_type_display || item.record_type}
                          </span>
                          <span className="text-white font-medium">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        ₹{parseFloat(item.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {item.is_recurring ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            ● Monthly Recurring
                          </span>
                        ) : (
                          <span className="text-gray-400">One-time payout</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {item.effective_date}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition"
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
