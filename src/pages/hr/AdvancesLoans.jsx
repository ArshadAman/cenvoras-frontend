import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  BanknotesIcon, PlusIcon, CheckBadgeIcon, XMarkIcon,
  ArrowPathIcon, CurrencyRupeeIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

function AdvanceLoanModal({ isOpen, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({
    employee: '',
    type: 'advance',
    principal_amount: '',
    monthly_installment: '',
    reason: '',
    disbursement_date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        employee: '',
        type: 'advance',
        principal_amount: '',
        monthly_installment: '',
        reason: '',
        disbursement_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.createAdvanceLoan(form);
      toast.success(`${form.type === 'advance' ? 'Salary advance' : 'Loan'} request submitted`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit loan request');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Disburse Advance / Loan</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Employee *</label>
            <select required value={form.employee} onChange={e => setForm(p => ({ ...p, employee: e.target.value }))} className={ic}>
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Type *</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={ic}>
                <option value="advance">Salary Advance</option>
                <option value="loan">Personal Loan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Disbursement Date *</label>
              <input required type="date" value={form.disbursement_date} onChange={e => setForm(p => ({ ...p, disbursement_date: e.target.value }))} className={ic} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Principal Amount (₹) *</label>
              <input required type="number" step="0.01" value={form.principal_amount} onChange={e => setForm(p => ({ ...p, principal_amount: e.target.value, monthly_installment: p.type === 'advance' ? e.target.value : p.monthly_installment }))} className={ic} placeholder="50000" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Monthly Deduction (₹) *</label>
              <input required type="number" step="0.01" value={form.monthly_installment} onChange={e => setForm(p => ({ ...p, monthly_installment: e.target.value }))} className={ic} placeholder="5000" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Reason / Purpose</label>
            <textarea rows={2} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className={ic + ' resize-none'} placeholder="Medical emergency / Home renovation" />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-400 bg-white/5 rounded-xl hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">
              {saving ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdvancesLoans() {
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const [loanRes, empRes] = await Promise.all([
        hrApi.getAdvancesLoans(),
        hrApi.getEmployees({ limit: 200 })
      ]);
      setLoans(loanRes.data?.results || loanRes.data || []);
      setEmployees(empRes.data?.results || empRes.data || []);
    } catch (error) {
      toast.error("Failed to load advances and loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleApprove = async (id) => {
    try {
      await hrApi.approveAdvanceLoan(id);
      toast.success("Advance/Loan approved and activated for payroll recovery");
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve");
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm("Close this loan? Remaining balance will be set to ₹0.00.")) return;
    try {
      await hrApi.closeAdvanceLoan(id);
      toast.success("Loan marked as closed");
      fetchLoans();
    } catch (err) {
      toast.error("Failed to close loan");
    }
  };

  const totalOutstanding = loans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + parseFloat(l.balance_amount || 0), 0);

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Employee Financials</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <BanknotesIcon className="w-9 h-9 text-indigo-300" />
                Advances & Loans
              </h1>
              <p className="text-white/65 text-sm mt-2">
                Manage employee salary advances, personal loans, and automated payroll recovery schedules.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 shadow-lg shadow-indigo-500/20"
            >
              <PlusIcon className="h-4 w-4" />
              New Advance / Loan
            </button>
          </div>
        </section>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Active Loans</p>
            <p className="text-3xl font-bold text-white">{loans.filter(l => l.status === 'active').length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pending Approval</p>
            <p className="text-3xl font-bold text-amber-400">{loans.filter(l => l.status === 'requested').length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Outstanding Recovery</p>
            <p className="text-3xl font-bold text-emerald-400">₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Loans Table */}
        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Loan & Advance Ledger</h2>
            <button onClick={fetchLoans} className="text-gray-400 hover:text-white text-xs inline-flex items-center gap-1">
              <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Principal</th>
                  <th className="px-6 py-4">Monthly Recovery</th>
                  <th className="px-6 py-4">Outstanding Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center">Loading records...</td></tr>
                ) : loans.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-400">No advance or loan records found.</td></tr>
                ) : (
                  loans.map(loan => {
                    const principal = parseFloat(loan.principal_amount || 0);
                    const balance = parseFloat(loan.balance_amount || 0);
                    const progress = principal > 0 ? Math.min(100, Math.round(((principal - balance) / principal) * 100)) : 100;

                    return (
                      <tr key={loan.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="px-6 py-4 font-medium text-white">
                          <p>{loan.employee_name}</p>
                          <p className="text-xs text-gray-400">Disbursed: {loan.disbursement_date}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            loan.type === 'advance' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {loan.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">₹{principal.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">₹{parseFloat(loan.monthly_installment || 0).toLocaleString('en-IN')}/mo</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-emerald-400">₹{balance.toLocaleString('en-IN')}</p>
                            <div className="w-24 bg-white/10 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400">{progress}% recovered</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                            loan.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            loan.status === 'requested' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {loan.status === 'requested' && (
                            <button
                              onClick={() => handleApprove(loan.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {loan.status === 'active' && (
                            <button
                              onClick={() => handleClose(loan.id)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white text-xs font-medium"
                            >
                              Close
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AdvanceLoanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLoans}
        employees={employees}
      />
    </>
  );
}
