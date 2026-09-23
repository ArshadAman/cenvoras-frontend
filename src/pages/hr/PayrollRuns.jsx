import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { getAccounts } from "../../api/ledger";
import {
  CalculatorIcon, PlayIcon, CheckBadgeIcon, XMarkIcon,
  ShieldExclamationIcon, ArrowPathIcon, BanknotesIcon, LockClosedIcon,
  ArrowUturnLeftIcon, EyeIcon, DocumentArrowDownIcon, CheckCircleIcon,
  UserGroupIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const STAGES = ['draft', 'calculating', 'calculated', 'review', 'approved', 'paid', 'locked'];

// ─── Employee Payslip Inspector Modal & Breakdown ─────────────────────────────
function EmployeeInspectorModal({ isOpen, onClose, payrollRun }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchRunPayslips = async () => {
    if (!payrollRun) return;
    setLoading(true);
    try {
      const res = await hrApi.getPayslips({ payroll_run: payrollRun.id });
      setPayslips(res.data?.results || res.data || []);
    } catch (err) {
      toast.error('Failed to load employee payslips for this cycle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && payrollRun) {
      fetchRunPayslips();
      setSelectedPayslip(null);
      setSearch('');
    }
  }, [isOpen, payrollRun]);

  const handleDownloadPdf = async (ps) => {
    try {
      const res = await hrApi.downloadPayslipPdf(ps.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${ps.employee_code || ps.employee}_${payrollRun.month}_${payrollRun.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error('Failed to download payslip PDF');
    }
  };

  if (!isOpen || !payrollRun) return null;

  const filteredPayslips = payslips.filter(ps => {
    const q = search.toLowerCase();
    const name = (ps.employee_name || '').toLowerCase();
    const code = (ps.employee_code || '').toLowerCase();
    const dept = (ps.department_name || '').toLowerCase();
    return name.includes(q) || code.includes(q) || dept.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">
                  Cycle Inspection: {MONTHS[payrollRun.month - 1]} {payrollRun.year}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                  payrollRun.status === 'locked' ? 'bg-purple-500/20 text-purple-300' :
                  payrollRun.status === 'paid' ? 'bg-blue-500/20 text-blue-300' :
                  payrollRun.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                  'bg-teal-500/20 text-teal-300'
                }`}>
                  {payrollRun.status}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {payslips.length} Employees • Gross ₹{parseFloat(payrollRun.total_gross || 0).toLocaleString('en-IN')} • Net ₹{parseFloat(payrollRun.total_net || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Employee List */}
          <div className={`${selectedPayslip ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-5/12 border-r border-white/10`}>
            {/* Search */}
            <div className="p-3 border-b border-white/10 bg-white/[0.01]">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, code, dept..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading cycle payslips...</div>
              ) : filteredPayslips.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No employee records match</div>
              ) : (
                filteredPayslips.map(ps => {
                  const isSelected = selectedPayslip?.id === ps.id;
                  return (
                    <div
                      key={ps.id}
                      onClick={() => setSelectedPayslip(ps)}
                      className={`p-3.5 cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected ? 'bg-indigo-500/15 border-l-2 border-indigo-400' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{ps.employee_name || 'Employee'}</p>
                        <p className="text-xs text-gray-400 truncate">{ps.employee_code} • {ps.designation_name || ps.department_name || 'Staff'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-emerald-400">₹{parseFloat(ps.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-gray-500">Gross ₹{parseFloat(ps.gross_salary || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Detailed Inspection Drawer / Panel */}
          <div className={`${!selectedPayslip ? 'hidden md:flex items-center justify-center' : 'flex'} flex-col flex-1 bg-black/40 overflow-y-auto`}>
            {!selectedPayslip ? (
              <div className="text-center p-8">
                <InformationCircleIcon className="w-10 h-10 text-indigo-400/50 mx-auto mb-2" />
                <p className="text-sm text-gray-300 font-medium">Select an Employee</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Click on any employee to inspect their attendance days, itemized earnings, and transparent deduction reasons.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Back button for mobile */}
                <div className="flex md:hidden items-center justify-between pb-2 border-b border-white/10">
                  <button
                    onClick={() => setSelectedPayslip(null)}
                    className="text-xs text-indigo-400 flex items-center gap-1 font-medium"
                  >
                    ← Back to Employee List
                  </button>
                </div>

                {/* Employee Header Card */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedPayslip.employee_name}</h3>
                    <p className="text-xs text-gray-400">
                      Code: <span className="text-gray-200">{selectedPayslip.employee_code}</span> • Dept: <span className="text-gray-200">{selectedPayslip.department_name || '—'}</span> • Role: <span className="text-gray-200">{selectedPayslip.designation_name || '—'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPdf(selectedPayslip)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Download Payslip PDF
                    </button>
                  </div>
                </div>

                {/* Attendance Summary */}
                {selectedPayslip.attendance_summary && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attendance & Calendar Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-[11px] text-gray-400">Working Days</p>
                        <p className="text-base font-semibold text-white mt-0.5">{selectedPayslip.attendance_summary.working_days ?? '—'}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-[11px] text-emerald-400">Present Days</p>
                        <p className="text-base font-semibold text-emerald-300 mt-0.5">{selectedPayslip.attendance_summary.present_days ?? '—'}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-[11px] text-blue-400">Paid Leaves</p>
                        <p className="text-base font-semibold text-blue-300 mt-0.5">{selectedPayslip.attendance_summary.paid_leaves ?? 0}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-[11px] text-red-400">Loss of Pay (LOP)</p>
                        <p className="text-base font-semibold text-red-300 mt-0.5">{selectedPayslip.attendance_summary.unpaid_leaves ?? 0} days</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Two-Column Earnings & Deductions with Reasons */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Earnings</span>
                      <span className="text-xs font-bold text-emerald-400">₹{parseFloat(selectedPayslip.gross_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {selectedPayslip.earnings_breakdown && Object.entries(selectedPayslip.earnings_breakdown).length > 0 ? (
                        Object.entries(selectedPayslip.earnings_breakdown).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 capitalize">{k.replace(/_/g, ' ')}</span>
                            <span className="font-medium text-white">₹{parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">No earnings recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Deductions with Detailed Reasons */}
                  <div className="p-4 rounded-xl bg-red-500/[0.03] border border-red-500/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-400">Deductions & Explanations</span>
                      <span className="text-xs font-bold text-red-400">₹{parseFloat(selectedPayslip.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                      {selectedPayslip.deductions_breakdown && Object.entries(selectedPayslip.deductions_breakdown).length > 0 ? (
                        Object.entries(selectedPayslip.deductions_breakdown).map(([k, v]) => {
                          const amt = parseFloat(v || 0);
                          const reason = selectedPayslip.deduction_reasons?.[k];
                          return (
                            <div key={k} className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-red-300 capitalize">{k.replace(/_/g, ' ')}</span>
                                <span className="font-semibold text-red-400">₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              {reason && (
                                <p className="text-[11px] text-gray-400 leading-relaxed italic bg-black/30 p-1.5 rounded">
                                  💡 {reason}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-500">No deductions applied</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Employer Statutory Contributions */}
                {selectedPayslip.employer_contributions && Object.keys(selectedPayslip.employer_contributions).length > 0 && (
                  <div className="p-4 rounded-xl bg-purple-500/[0.03] border border-purple-500/20">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">Employer Statutory Benefits (Non-docked)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(selectedPayslip.employer_contributions).map(([k, v]) => (
                        <div key={k} className="p-2 rounded-lg bg-white/5 border border-white/5 text-xs">
                          <p className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}</p>
                          <p className="font-semibold text-purple-300 mt-0.5">₹{parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Net Salary Summary Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-black/40 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Net Take-Home Pay</p>
                    <p className="text-2xl font-bold text-white mt-0.5">₹{parseFloat(selectedPayslip.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {payrollRun.status === 'paid' ? 'Paid to Bank' : 'Payable'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please enter a reason for reopening');
      return;
    }
    setSaving(true);
    try {
      await hrApi.reopenPayroll(payrollRun.id, { reason: reason.trim() });
      toast.success('Payroll reopened and accounting accrual reversed');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.detail
        || (Array.isArray(err.response?.data) ? err.response?.data[0] : null)
        || (typeof err.response?.data === 'string' ? err.response?.data : null)
        || 'Failed to reopen';
      toast.error(msg);
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
  const [selectedInspectRun, setSelectedInspectRun] = useState(null);

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

  const handleBankExport = async (id, month, year) => {
    try {
      const res = await hrApi.downloadBankExport(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bank_payout_${MONTHS[month - 1]}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Bank payout CSV downloaded successfully");
    } catch (err) {
      toast.error("Failed to export bank payout CSV");
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
                        {['draft', 'calculated', 'review', 'completed'].includes(run.status) && (
                          <button
                            onClick={() => handleCalculate(run.id)}
                            className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold"
                          >
                            {run.status === 'draft' ? 'Calculate' : 'Recalculate'}
                          </button>
                        )}

                        {/* Inspect Employees */}
                        {run.status !== 'draft' && (
                          <button
                            onClick={() => setSelectedInspectRun(run)}
                            className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1"
                            title="Inspect individual employees, deductions & reasons"
                          >
                            <EyeIcon className="w-3.5 h-3.5" /> Inspect
                          </button>
                        )}

                        {/* Export Bank CSV */}
                        {['calculated', 'review', 'completed', 'approved', 'paid', 'locked'].includes(run.status) && (
                          <button
                            onClick={() => handleBankExport(run.id, run.month, run.year)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 text-xs font-medium inline-flex items-center gap-1"
                            title="Download Bank Payout CSV"
                          >
                            <DocumentArrowDownIcon className="w-3.5 h-3.5" /> Bank CSV
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
                        {['approved', 'paid', 'locked'].includes(run.status) && (
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

      <EmployeeInspectorModal
        isOpen={!!selectedInspectRun}
        onClose={() => setSelectedInspectRun(null)}
        payrollRun={selectedInspectRun}
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
