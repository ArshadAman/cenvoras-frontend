import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { getAccounts } from "../../api/ledger";
import {
  CalculatorIcon, PlayIcon, CheckBadgeIcon, XMarkIcon,
  ShieldExclamationIcon, ArrowPathIcon, BanknotesIcon, LockClosedIcon,
  ArrowUturnLeftIcon, EyeIcon, DocumentArrowDownIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const STAGES = ['draft', 'calculating', 'calculated', 'review', 'approved', 'paid', 'locked'];

// ─── Exceptions & Pre-Approval Panel ──────────────────────────────────────────
function ExceptionsModal({ isOpen, onClose, payrollRunId, onResolved }) {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExceptions = () => {
    setLoading(true);
    hrApi.getPayrollExceptions(payrollRunId)
      .then(res => setExceptions(res.data || []))
      .catch(() => toast.error('Failed to load exceptions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && payrollRunId) fetchExceptions();
  }, [isOpen, payrollRunId]);

  const handleResolve = async (id) => {
    try {
      await hrApi.resolveException(id);
      toast.success('Exception marked as resolved');
      fetchExceptions();
      if (onResolved) onResolved();
    } catch (err) {
      toast.error('Failed to resolve exception');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldExclamationIcon className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Payroll Pre-Approval Exceptions</h2>
              <p className="text-xs text-gray-400">Critical exceptions block approval until resolved.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-96 overflow-y-auto space-y-3">
          {loading ? (
            <p className="text-center py-8 text-gray-400 text-sm">Scanning exceptions...</p>
          ) : exceptions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-white font-medium">Clean Run! No Exceptions Detected.</p>
              <p className="text-xs text-gray-400 mt-1">All bank accounts, statutory PANs, leaves, and structures are verified.</p>
            </div>
          ) : (
            exceptions.map(exc => (
              <div key={exc.id} className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                exc.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40">
                      {exc.severity}
                    </span>
                    <span className="text-sm font-semibold text-white">{exc.employee_name || 'System Exception'}</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{exc.message}</p>
                </div>
                {!exc.is_resolved ? (
                  <button
                    onClick={() => handleResolve(exc.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white whitespace-nowrap"
                  >
                    Acknowledge & Resolve
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-medium">Resolved</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Payment Disbursement Modal ───────────────────────────────────────────────
function PaymentModal({ isOpen, onClose, payrollRun, onSuccess }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getAccounts({ account_type: 'asset' })
        .then(res => setAccounts(res.results || res || []))
        .catch(() => toast.error('Failed to load asset accounts'));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      toast.error('Please select a payment/bank account');
      return;
    }
    setSaving(true);
    try {
      await hrApi.payPayroll(payrollRun.id, { payment_account_id: selectedAccount });
      toast.success('Disbursement recorded and ledger entries posted!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Disbursement failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !payrollRun) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Record Salary Disbursement</h2>
            <p className="text-xs text-gray-400">Total Net Payable: ₹{parseFloat(payrollRun.total_net).toLocaleString('en-IN')}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Disbursement Bank / Cash Account *</label>
            <select required value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className={ic}>
              <option value="">Select Account</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.code}) - Bal: ₹{parseFloat(acc.current_balance || 0).toLocaleString('en-IN')}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400">This will credit the chosen bank account and debit Salaries Payable in the General Ledger, settling loan recoveries.</p>

          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 bg-white/5 rounded-xl hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 rounded-xl hover:bg-emerald-300 disabled:opacity-50">
              {saving ? 'Processing...' : 'Confirm Disbursement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reopen Modal ─────────────────────────────────────────────────────────────
function ReopenModal({ isOpen, onClose, payrollRun, onSuccess }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.reopenPayroll(payrollRun.id, { reason });
      toast.success('Payroll reopened and accounting accrual reversed');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reopen');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !payrollRun) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Reopen Payroll Run</h2>
            <p className="text-xs text-gray-400">Reverts to draft status for recalculation</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Reason for Reopening *</label>
            <textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} className={ic + ' resize-none'} placeholder="e.g. Leave adjustments reported post approval" />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 bg-white/5 rounded-xl hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-500 disabled:opacity-50">
              {saving ? 'Reopening...' : 'Confirm Reopen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── New Payroll Modal ────────────────────────────────────────────────────────
function PayrollRunModal({ isOpen, onClose, onSuccess }) {
  const now = new Date();
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const n = new Date();
      setForm({ month: n.getMonth() + 1, year: n.getFullYear() });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.createPayrollRun(form);
      toast.success(`Payroll run initialized for ${MONTHS[form.month - 1]} ${form.year}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to initialize payroll run");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Initialize Payroll Cycle</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Month *</label>
            <select required name="month" value={form.month} onChange={e => setForm(p => ({ ...p, month: Number(e.target.value) }))} className={ic}>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Year *</label>
            <input required type="number" min={2020} max={2099} value={form.year} onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))} className={ic} />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-gray-400 bg-white/5 rounded-xl hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">
              {saving ? 'Creating...' : 'Initialize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Payroll Page ────────────────────────────────────────────────────────
export default function PayrollRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExceptionsRun, setSelectedExceptionsRun] = useState(null);
  const [selectedPayRun, setSelectedPayRun] = useState(null);
  const [selectedReopenRun, setSelectedReopenRun] = useState(null);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getPayrollRuns();
      setRuns(res.data?.results || res.data || []);
    } catch (error) {
      toast.error("Failed to load payroll cycles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleCalculate = async (id) => {
    try {
      await hrApi.calculatePayroll(id);
      toast.success("Payroll computed successfully!");
      fetchRuns();
    } catch (error) {
      toast.error(error.response?.data?.error || "Calculation failed");
    }
  };

  const handleApprove = async (id) => {
    try {
      await hrApi.approvePayroll(id);
      toast.success("Payroll approved! Salary Accrual journal entries posted to General Ledger.");
      fetchRuns();
    } catch (error) {
      toast.error(error.response?.data?.error || "Approval failed");
    }
  };

  const handleLock = async (id) => {
    if (!window.confirm('Lock this payroll cycle? Further changes will require an audited reopen.')) return;
    try {
      await hrApi.lockPayroll(id);
      toast.success("Payroll locked securely");
      fetchRuns();
    } catch (error) {
      toast.error(error.response?.data?.error || "Lock failed");
    }
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Core HRMS</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <CalculatorIcon className="w-9 h-9 text-indigo-300" />
                Monthly Payroll Workflow
              </h1>
              <p className="text-white/65 text-sm mt-2">
                Draft → Calculate → Review & Exceptions → Accrual Approval → Disbursement → Lock.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 shadow-lg shadow-indigo-500/20"
            >
              <PlayIcon className="h-4 w-4" />
              New Payroll Cycle
            </button>
          </div>
        </section>

        {/* Processing Table */}
        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Payroll Cycles</h2>
            <button onClick={fetchRuns} className="text-gray-400 hover:text-white text-xs inline-flex items-center gap-1">
              <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Cycle</th>
                  <th className="px-6 py-4">Status & Exceptions</th>
                  <th className="px-6 py-4">Gross Earnings</th>
                  <th className="px-6 py-4">Deductions</th>
                  <th className="px-6 py-4">Net Payable</th>
                  <th className="px-6 py-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-4 text-center">Loading payroll runs...</td></tr>
                ) : runs.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No payroll cycles created yet. Click "New Payroll Cycle" to start.</td></tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">
                        <div>
                          <p className="text-base font-semibold">{MONTHS[run.month - 1]} {run.year}</p>
                          <p className="text-xs text-gray-400">{run.employee_count} employees</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            run.status === 'locked' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            run.status === 'paid' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            run.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            run.status === 'calculated' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {run.status}
                          </span>

                          {run.critical_exceptions_count > 0 && (
                            <button
                              onClick={() => setSelectedExceptionsRun(run.id)}
                              className="block text-xs font-medium text-red-400 hover:text-red-300 underline"
                            >
                              ⚠️ {run.critical_exceptions_count} Critical Exceptions
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-medium text-white">₹{parseFloat(run.total_gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-red-400">₹{parseFloat(run.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-emerald-400 font-bold">₹{parseFloat(run.total_net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>

                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {/* Calculate / Recalculate */}
                        {['draft', 'calculated', 'review'].includes(run.status) && (
                          <button
                            onClick={() => handleCalculate(run.id)}
                            className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold"
                          >
                            {run.status === 'draft' ? 'Calculate' : 'Recalculate'}
                          </button>
                        )}

                        {/* View Exceptions */}
                        <button
                          onClick={() => setSelectedExceptionsRun(run.id)}
                          className="px-3 py-1 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 text-xs font-medium"
                        >
                          Exceptions
                        </button>

                        {/* Approve (Posts Accrual to Ledger) */}
                        {['calculated', 'review', 'completed'].includes(run.status) && (
                          <button
                            onClick={() => handleApprove(run.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <CheckBadgeIcon className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}

                        {/* Pay / Disburse */}
                        {run.status === 'approved' && (
                          <button
                            onClick={() => setSelectedPayRun(run)}
                            className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <BanknotesIcon className="w-3.5 h-3.5" /> Disburse
                          </button>
                        )}

                        {/* Lock */}
                        {run.status === 'paid' && (
                          <button
                            onClick={() => handleLock(run.id)}
                            className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <LockClosedIcon className="w-3.5 h-3.5" /> Lock
                          </button>
                        )}

                        {/* Reopen */}
                        {['approved', 'locked'].includes(run.status) && (
                          <button
                            onClick={() => setSelectedReopenRun(run)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <ArrowUturnLeftIcon className="w-3 h-3" /> Reopen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <PayrollRunModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRuns}
      />

      <ExceptionsModal
        isOpen={!!selectedExceptionsRun}
        onClose={() => setSelectedExceptionsRun(null)}
        payrollRunId={selectedExceptionsRun}
        onResolved={fetchRuns}
      />

      <PaymentModal
        isOpen={!!selectedPayRun}
        onClose={() => setSelectedPayRun(null)}
        payrollRun={selectedPayRun}
        onSuccess={fetchRuns}
      />

      <ReopenModal
        isOpen={!!selectedReopenRun}
        onClose={() => setSelectedReopenRun(null)}
        payrollRun={selectedReopenRun}
        onSuccess={fetchRuns}
      />
    </>
  );
}
