import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  BanknotesIcon, PlusIcon, CheckBadgeIcon, XMarkIcon,
  ArrowPathIcon, CurrencyRupeeIcon, CheckCircleIcon, EyeIcon
} from '@heroicons/react/24/outline';
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";

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
      const payload = {
        ...form,
        record_type: form.type,
        original_amount: form.principal_amount,
      };
      await hrApi.createAdvanceLoan(payload);
      showSuccessToast(`${form.type === 'advance' ? 'Salary advance' : 'Personal loan'} request submitted successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      showErrorToast(err, 'Failed to submit loan request');
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
            <textarea rows={2} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className={ic + ' resize-none'} placeholder="Medical emergency / Home renovation..." />
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

// ─── Loan Details & Schedule Modal ────────────────────────────────────────────
function LoanDetailsModal({ isOpen, onClose, loan, onApprove, onCloseLoan }) {
  if (!isOpen || !loan) return null;

  const principal = parseFloat(loan.principal_amount || loan.original_amount || 0);
  const balance = parseFloat(loan.balance_amount || loan.outstanding_balance || 0);
  const installment = parseFloat(loan.monthly_installment || 0);
  const progress = principal > 0 ? Math.min(100, Math.round(((principal - balance) / principal) * 100)) : 100;
  const loanType = loan.type || loan.record_type || 'advance';
  const remainingInstallments = installment > 0 ? Math.ceil(balance / installment) : 0;

  const STATUS_STYLES = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    requested: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    fully_recovered: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    closed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BanknotesIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Advance / Loan Details</h2>
              <p className="text-xs text-gray-400">Recovery progress, purpose, and repayment schedule</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Employee & Type */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">{loan.employee_name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Disbursed on: <span className="text-gray-200">{loan.disbursement_date}</span>
                {loan.disbursed_by_name && <span> • By: <span className="text-gray-200">{loan.disbursed_by_name}</span></span>}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                loanType === 'advance' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {loanType === 'advance' ? 'Salary Advance' : 'Personal Loan'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider border ${STATUS_STYLES[loan.status] || 'bg-white/10 text-white'}`}>
                {loan.status}
              </span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-[11px] text-gray-400">Principal</p>
              <p className="text-base font-bold text-white mt-1">₹{principal.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-[11px] text-indigo-300">Monthly Deduction</p>
              <p className="text-base font-bold text-indigo-300 mt-1">₹{installment.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-[11px] text-emerald-300">Balance</p>
              <p className="text-base font-bold text-emerald-400 mt-1">₹{balance.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Recovery Progress Bar */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Recovery Progress</span>
              <span className="font-semibold text-emerald-400">{progress}% recovered ({remainingInstallments} installments remaining)</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Stated Purpose */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">Stated Purpose / Reason</h4>
              <span className="text-[11px] text-gray-500">Recorded on application</span>
            </div>
            {loan.reason ? (
              <p className="text-sm text-gray-200 bg-black/40 p-3 rounded-lg border border-white/5 leading-relaxed whitespace-pre-wrap">
                {loan.reason}
              </p>
            ) : (
              <p className="text-xs text-gray-500 italic bg-black/20 p-3 rounded-lg">No specific reason provided for this disbursement.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 rounded-xl transition"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {loan.status === 'requested' && (
              <button
                type="button"
                onClick={() => {
                  onApprove(loan.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <CheckBadgeIcon className="w-4 h-4" /> Approve & Activate
              </button>
            )}
            {loan.status === 'active' && (
              <button
                type="button"
                onClick={() => {
                  onCloseLoan(loan.id);
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-medium text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition"
              >
                Close Loan (Write-off balance)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdvancesLoans() {
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

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
      showErrorToast(error, "Failed to load advances and loans");
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
      showSuccessToast("Advance/Loan approved and scheduled for automated payroll deduction");
      fetchLoans();
    } catch (err) {
      showErrorToast(err, "Failed to approve advance/loan");
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm("Close this loan? Remaining balance will be set to ₹0.00.")) return;
    try {
      await hrApi.closeAdvanceLoan(id);
      showSuccessToast("Advance/Loan closed successfully");
      fetchLoans();
    } catch (err) {
      showErrorToast(err, "Failed to close loan");
    }
  };

  const totalOutstanding = loans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + parseFloat(l.balance_amount || l.outstanding_balance || 0), 0);

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
                Manage employee salary advances, personal loans, and automated payroll recovery schedules. Click any row to view stated reason and repayment details.
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
                    const principal = parseFloat(loan.principal_amount || loan.original_amount || 0);
                    const balance = parseFloat(loan.balance_amount || loan.outstanding_balance || 0);
                    const progress = principal > 0 ? Math.min(100, Math.round(((principal - balance) / principal) * 100)) : 100;
                    const loanType = loan.type || loan.record_type || 'advance';

                    return (
                      <tr
                        key={loan.id}
                        onClick={() => setSelectedLoan(loan)}
                        className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                        title="Click to view complete details, repayment schedule, and purpose"
                      >
                        <td className="px-6 py-4 font-medium text-white">
                          <p>{loan.employee_name}</p>
                          <p className="text-xs text-gray-400">Disbursed: {loan.disbursement_date}</p>
                          {loan.reason && (
                            <p className="text-xs text-gray-400 italic truncate max-w-xs mt-0.5">
                              “{loan.reason}”
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            loanType === 'advance' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {loanType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">₹{principal.toLocaleString('en-IN')}</td>
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
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLoan(loan);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-medium inline-flex items-center gap-1 transition"
                            title="View details & purpose"
                          >
                            <EyeIcon className="w-3.5 h-3.5" /> Details
                          </button>
                          {loan.status === 'requested' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(loan.id);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {loan.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClose(loan.id);
                              }}
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

      <LoanDetailsModal
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        loan={selectedLoan}
        onApprove={handleApprove}
        onCloseLoan={handleClose}
      />
    </>
  );
}
