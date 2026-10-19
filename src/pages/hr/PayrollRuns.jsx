import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { hrApi } from "../../api/hr";
import { getAccounts } from "../../api/ledger";
import {
  CalculatorIcon, PlayIcon, CheckBadgeIcon, XMarkIcon,
  ShieldExclamationIcon, ArrowPathIcon, BanknotesIcon, LockClosedIcon,
  ArrowUturnLeftIcon, EyeIcon, DocumentArrowDownIcon, CheckCircleIcon,
  UserGroupIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, InformationCircleIcon,
  ExclamationTriangleIcon, ClockIcon, ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const STAGES = ['draft', 'calculating', 'calculated', 'review', 'approved', 'paid', 'locked'];

// ─── Unified Cycle Details & Audit Hub ─────────────────────────────────────────
function PayrollCycleDetailsModal({ isOpen, onClose, payrollRun, onActionRefresh }) {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit', 'employees', 'exceptions'
  const [payslips, setPayslips] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchCycleData = async () => {
    if (!payrollRun) return;
    setLoading(true);
    try {
      const [psRes, excRes] = await Promise.all([
        hrApi.getPayslips({ payroll_run: payrollRun.id }).catch(() => ({ data: [] })),
        hrApi.getPayrollExceptions(payrollRun.id).catch(() => ({ data: [] }))
      ]);
      setPayslips(psRes.data?.results || psRes.data || []);
      setExceptions(excRes.data || []);
    } catch (err) {
      showErrorToast(err, 'Failed to load cycle details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && payrollRun) {
      setSelectedPayslip(null);
      setSearch('');
      setActiveTab(payrollRun.is_reopened ? 'audit' : 'employees');
      fetchCycleData();
    }
  }, [isOpen, payrollRun?.id, payrollRun?.status, payrollRun?.total_net, payrollRun?.updated_at]);

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
      showSuccessToast('Payslip PDF downloaded successfully');
    } catch (err) {
      showErrorToast(err, 'Failed to download payslip PDF');
    }
  };

  const handleResolveException = async (id) => {
    try {
      await hrApi.resolveException(id);
      showSuccessToast('Exception marked as resolved');
      fetchCycleData();
      if (onActionRefresh) onActionRefresh();
    } catch (err) {
      showErrorToast(err, 'Failed to resolve exception');
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/30">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)]">
                <CalculatorIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {MONTHS[payrollRun.month - 1]} {payrollRun.year} Cycle Details
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    payrollRun.status === 'locked' ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30' :
                    payrollRun.status === 'paid' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' :
                    payrollRun.status === 'approved' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' :
                    payrollRun.status === 'calculated' ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30' :
                    'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                  }`}>
                    {payrollRun.status}
                  </span>
                  {payrollRun.is_reopened && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-3 h-3" /> Reopened
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {payslips.length} Employees • Net Payable: ₹{parseFloat(payrollRun.total_net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'employees'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm'
                  : 'bg-[var(--bg-primary)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              Employee Register ({payslips.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm'
                  : 'bg-[var(--bg-primary)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              Lifecycle & Audit History
              {payrollRun.is_reopened && (
                <span className="w-2 h-2 rounded-full bg-[var(--status-warning)] animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('exceptions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'exceptions'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm'
                  : 'bg-[var(--bg-primary)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <ShieldExclamationIcon className="w-4 h-4" />
              Pre-Approval Exceptions ({exceptions.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Lifecycle & Audit Trail */}
        {activeTab === 'audit' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Reopen Audit Alert Banner */}
            {(payrollRun.is_reopened || payrollRun.reopen_reason || (payrollRun.reopen_history && payrollRun.reopen_history.length > 0)) && (
              <div className="p-4 rounded-xl bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 text-[var(--status-warning)] space-y-2">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-[var(--status-warning)] shrink-0" />
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">This Payroll Cycle Was Reopened</h4>
                </div>
                <div className="pl-7 space-y-1 text-xs">
                  <p className="text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">Latest Reopen Reason:</span> "{payrollRun.reopen_reason || 'Administrative adjustment'}"
                  </p>
                  <p className="text-[var(--text-muted)] text-[11px]">
                    Reopened by <span className="text-[var(--status-warning)] font-medium">{payrollRun.reopened_by_name || 'Admin'}</span>
                    {payrollRun.reopened_at && ` on ${new Intl.DateTimeFormat('en-GB', {
                      timeZone: 'Asia/Kolkata',
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    }).format(new Date(payrollRun.reopened_at))} IST`}
                  </p>
                </div>

                {/* Chronological Reopen History List */}
                {payrollRun.reopen_history && payrollRun.reopen_history.length > 0 && (
                  <div className="pl-7 pt-2.5 border-t border-[var(--status-warning)]/20 space-y-1.5">
                    <p className="text-[11px] font-semibold text-[var(--status-warning)] uppercase tracking-wider">
                      Reopen Audit Trail ({payrollRun.reopen_history.length})
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {payrollRun.reopen_history.map((rh, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-primary)] text-[11px] space-y-0.5 border border-[var(--border-subtle)]">
                          <div className="flex justify-between items-center text-[var(--text-muted)]">
                            <span className="font-medium text-[var(--text-primary)]">{rh.reopened_by_name || rh.reopened_by}</span>
                            <span>{rh.reopened_at ? `${new Intl.DateTimeFormat('en-GB', {
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: false,
                            }).format(new Date(rh.reopened_at))} IST` : '—'}</span>
                          </div>
                          <p className="text-[var(--status-warning)] italic">"{rh.reason}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lifecycle Progression Timeline */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] space-y-3">
              <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Lifecycle Milestones</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Created */}
                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Created</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{payrollRun.created_by_name || 'System Administrator'}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                    {payrollRun.created_at ? new Date(payrollRun.created_at).toLocaleDateString('en-IN') : '—'}
                  </p>
                </div>

                {/* 2. Approved */}
                <div className={`p-3 rounded-lg border space-y-1 ${payrollRun.approved_at ? 'bg-[var(--status-success)]/10 border-[var(--status-success)]/30' : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-60'}`}>
                  <p className={`text-[11px] uppercase tracking-wider ${payrollRun.approved_at ? 'text-[var(--status-success)] font-semibold' : 'text-[var(--text-muted)]'}`}>Approved</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {payrollRun.approved_by_name || (payrollRun.approved_at ? 'Approved' : 'Pending')}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                    {payrollRun.approved_at ? new Date(payrollRun.approved_at).toLocaleDateString('en-IN') : 'Not approved yet'}
                  </p>
                </div>

                {/* 3. Disbursed / Paid */}
                <div className={`p-3 rounded-lg border space-y-1 ${payrollRun.paid_at ? 'bg-[var(--status-info)]/10 border-[var(--status-info)]/30' : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-60'}`}>
                  <p className={`text-[11px] uppercase tracking-wider ${payrollRun.paid_at ? 'text-[var(--status-info)] font-semibold' : 'text-[var(--text-muted)]'}`}>Disbursed</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {payrollRun.payment_account_name || (payrollRun.paid_at ? 'Disbursed' : 'Unpaid')}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                    {payrollRun.paid_at ? `Paid on ${new Date(payrollRun.paid_at).toLocaleDateString('en-IN')}` : 'Awaiting payment'}
                  </p>
                </div>

                {/* 4. Locked */}
                <div className={`p-3 rounded-lg border space-y-1 ${payrollRun.locked_at ? 'bg-[var(--status-info)]/10 border-[var(--status-info)]/30' : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-60'}`}>
                  <p className={`text-[11px] uppercase tracking-wider ${payrollRun.locked_at ? 'text-[var(--status-info)] font-semibold' : 'text-[var(--text-muted)]'}`}>Locked</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {payrollRun.locked_by_name || (payrollRun.locked_at ? 'Locked' : 'Unlocked')}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                    {payrollRun.locked_at ? new Date(payrollRun.locked_at).toLocaleDateString('en-IN') : 'Unlocked'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-primary)]/60 border border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Gross Earnings</p>
                <p className="text-lg font-bold text-[var(--text-primary)] mt-1">₹{parseFloat(payrollRun.total_gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30">
                <p className="text-xs text-[var(--status-danger)] uppercase tracking-wider font-semibold">Total Deductions</p>
                <p className="text-lg font-bold text-[var(--status-danger)] mt-1">₹{parseFloat(payrollRun.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--status-success)]/10 border border-[var(--status-success)]/30">
                <p className="text-xs text-[var(--status-success)] uppercase tracking-wider font-semibold">Net Take-Home</p>
                <p className="text-lg font-bold text-[var(--status-success)] mt-1">₹{parseFloat(payrollRun.total_net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--status-info)]/10 border border-[var(--status-info)]/30">
                <p className="text-xs text-[var(--status-info)] uppercase tracking-wider font-semibold">Employer Benefits</p>
                <p className="text-lg font-bold text-[var(--status-info)] mt-1">₹{parseFloat(payrollRun.total_employer_contributions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Employee Payments Register */}
        {activeTab === 'employees' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Employee List */}
            <div className={`${selectedPayslip ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-5/12 border-r border-[var(--border-subtle)]`}>
              {/* Search */}
              <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/20">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, code, dept..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                {loading ? (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading employee payments...</div>
                ) : filteredPayslips.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)]">No employee records match</div>
                ) : (
                  filteredPayslips.map(ps => {
                    const isSelected = selectedPayslip?.id === ps.id;
                    return (
                      <div
                        key={ps.id}
                        onClick={() => setSelectedPayslip(ps)}
                        className={`p-3.5 cursor-pointer transition flex items-center justify-between gap-3 ${
                          isSelected ? 'bg-[var(--accent-primary)]/15 border-l-2 border-[var(--accent-primary)]' : 'hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ps.employee_name || 'Employee'}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{ps.employee_code} • {ps.designation_name || ps.department_name || 'Staff'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-[var(--status-success)]">₹{parseFloat(ps.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          <p className="text-[11px] text-[var(--text-secondary)] font-medium">Gross ₹{parseFloat(ps.gross_salary || 0).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Detailed Inspection Drawer / Panel */}
            <div className={`${!selectedPayslip ? 'hidden md:flex items-center justify-center' : 'flex'} flex-col flex-1 bg-[var(--bg-primary)]/40 overflow-y-auto`}>
              {!selectedPayslip ? (
                <div className="text-center p-8">
                  <InformationCircleIcon className="w-10 h-10 text-[var(--accent-primary)]/50 mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-primary)] font-medium">Select an Employee</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
                    Click on any employee to inspect their attendance days, itemized earnings, and transparent deduction reasons.
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Back button for mobile */}
                  <div className="flex md:hidden items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <button
                      onClick={() => setSelectedPayslip(null)}
                      className="text-xs text-[var(--accent-primary)] flex items-center gap-1 font-medium"
                    >
                      ← Back to Employee List
                    </button>
                  </div>

                  {/* Employee Header Card */}
                  <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedPayslip.employee_name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        Code: <span className="text-[var(--text-secondary)]">{selectedPayslip.employee_code}</span> • Dept: <span className="text-[var(--text-secondary)]">{selectedPayslip.department_name || '—'}</span> • Role: <span className="text-[var(--text-secondary)]">{selectedPayslip.designation_name || '—'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPdf(selectedPayslip)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 border border-[var(--accent-primary)]/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                      >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Download Payslip PDF
                      </button>
                    </div>
                  </div>

                  {/* Attendance & Leave Summary */}
                  {(() => {
                    const attendance = selectedPayslip.attendance_summary || {
                      working_days: selectedPayslip.total_working_days ?? 26,
                      present_days: selectedPayslip.present_days ?? '—',
                      paid_leaves: selectedPayslip.paid_leave_days ?? 0,
                      unpaid_leaves: selectedPayslip.lop_days ?? 0,
                    };
                    const unpaidDays = parseFloat(attendance.unpaid_leaves || 0);
                    const lopAmt = parseFloat(selectedPayslip.lop_amount || 0);

                    return (
                      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Attendance & Working Days</h4>
                          <span className="text-xs text-[var(--text-muted)]">Monthly Standard: <span className="text-[var(--text-primary)] font-semibold">{attendance.working_days} Working Days</span></span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                            <p className="text-[11px] text-[var(--text-muted)]">Working Days</p>
                            <p className="text-base font-semibold text-[var(--text-primary)] mt-0.5">{attendance.working_days ?? '—'}</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[var(--status-success)]/10 border border-[var(--status-success)]/30">
                            <p className="text-[11px] text-[var(--status-success)]">Present Days</p>
                            <p className="text-base font-semibold text-[var(--status-success)] mt-0.5">{attendance.present_days ?? '—'}</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[var(--status-info)]/10 border border-[var(--status-info)]/30">
                            <p className="text-[11px] text-[var(--status-info)]">Paid Leaves</p>
                            <p className="text-base font-semibold text-[var(--status-info)] mt-0.5">{attendance.paid_leaves ?? 0}</p>
                          </div>
                          <div className={`p-2.5 rounded-lg border ${unpaidDays > 0 ? 'bg-[var(--status-danger)]/10 border-[var(--status-danger)]/30' : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)]'}`}>
                            <p className={`text-[11px] ${unpaidDays > 0 ? 'text-[var(--status-danger)] font-semibold' : 'text-[var(--text-muted)]'}`}>Loss of Pay (LOP)</p>
                            <p className={`text-base font-semibold mt-0.5 ${unpaidDays > 0 ? 'text-[var(--status-danger)]' : 'text-[var(--text-muted)]'}`}>{unpaidDays} days</p>
                          </div>
                        </div>

                        {/* Leave Deduction & LOP Explanation */}
                        {unpaidDays > 0 && (
                          <div className="p-3 rounded-lg bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 text-xs text-[var(--status-danger)] space-y-1">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="flex items-center gap-1.5">
                                <ExclamationTriangleIcon className="w-4 h-4 text-[var(--status-danger)] flex-shrink-0" />
                                Loss of Pay (LOP) Applied: {unpaidDays} Day(s)
                              </span>
                              {lopAmt > 0 && (
                                <span className="text-[var(--status-danger)] font-medium">Amount Docked: ₹{lopAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--status-danger)]/80 leading-relaxed">
                              Salary is prorated to {attendance.present_days} effective days out of {attendance.working_days} working days. Any unexcused absence, unpaid holidays, or leave exceeding quota are deducted as Loss of Pay.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Two-Column Earnings & Deductions with Reasons */}
                  {(() => {
                    const earningsMap = selectedPayslip.earnings_breakdown
                      && Object.keys(selectedPayslip.earnings_breakdown).length > 0
                        ? selectedPayslip.earnings_breakdown
                        : (selectedPayslip.earnings && Object.keys(selectedPayslip.earnings).length > 0
                            ? selectedPayslip.earnings
                            : (parseFloat(selectedPayslip.gross_salary || 0) > 0 ? { 'Gross Base Salary': selectedPayslip.gross_salary } : {}));

                    const rawDeductions = selectedPayslip.deductions_breakdown
                      && Object.keys(selectedPayslip.deductions_breakdown).length > 0
                        ? selectedPayslip.deductions_breakdown
                        : (selectedPayslip.deductions || {});

                    const deductionsMap = { ...rawDeductions };

                    if (parseFloat(selectedPayslip.employee_pf || 0) > 0 && !deductionsMap['PF'] && !deductionsMap['Provident Fund (PF)']) {
                      deductionsMap['Provident Fund (PF)'] = selectedPayslip.employee_pf;
                    }
                    if (parseFloat(selectedPayslip.employee_esi || 0) > 0 && !deductionsMap['ESI']) {
                      deductionsMap['State Insurance (ESI)'] = selectedPayslip.employee_esi;
                    }
                    if (parseFloat(selectedPayslip.tds || 0) > 0 && !deductionsMap['TDS'] && !deductionsMap['Income Tax (TDS)']) {
                      deductionsMap['Income Tax (TDS)'] = selectedPayslip.tds;
                    }
                    if (parseFloat(selectedPayslip.professional_tax || 0) > 0 && !deductionsMap['PT'] && !deductionsMap['Professional Tax (PT)']) {
                      deductionsMap['Professional Tax (PT)'] = selectedPayslip.professional_tax;
                    }
                    if (parseFloat(selectedPayslip.advance_recovery || 0) > 0 && !deductionsMap['Salary Advance Recovery']) {
                      deductionsMap['Salary Advance Recovery'] = selectedPayslip.advance_recovery;
                    }
                    if (parseFloat(selectedPayslip.loan_recovery || 0) > 0 && !deductionsMap['Loan Recovery']) {
                      deductionsMap['Loan Recovery'] = selectedPayslip.loan_recovery;
                    }
                    delete deductionsMap['Loss of Pay (LOP)'];
                    delete deductionsMap['LOP'];
                    if (Object.keys(deductionsMap).length === 0 && parseFloat(selectedPayslip.total_deductions || 0) > 0) {
                      deductionsMap['Statutory & Other Deductions'] = selectedPayslip.total_deductions;
                    }

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Earnings */}
                        <div className="p-4 rounded-xl bg-[var(--status-success)]/5 border border-[var(--status-success)]/20 space-y-3">
                          <div className="flex items-center justify-between border-b border-[var(--status-success)]/20 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--status-success)]">Earnings</span>
                            <span className="text-xs font-bold text-[var(--status-success)]">₹{parseFloat(selectedPayslip.gross_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="space-y-2 max-h-56 overflow-y-auto">
                            {Object.entries(earningsMap).length > 0 ? (
                              Object.entries(earningsMap).map(([k, v]) => (
                                <div key={k} className="flex justify-between items-center text-xs">
                                  <span className="text-[var(--text-secondary)] capitalize">{k.replace(/_/g, ' ')}</span>
                                  <span className="font-medium text-[var(--text-primary)]">₹{parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-[var(--text-muted)] italic">No earnings recorded</p>
                            )}
                          </div>
                        </div>

                        {/* Deductions with Detailed Reasons */}
                        <div className="p-4 rounded-xl bg-[var(--status-danger)]/5 border border-[var(--status-danger)]/20 space-y-3">
                          <div className="flex items-center justify-between border-b border-[var(--status-danger)]/20 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--status-danger)]">Deductions & Explanations</span>
                            <span className="text-xs font-bold text-[var(--status-danger)]">₹{parseFloat(selectedPayslip.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="space-y-2.5 max-h-56 overflow-y-auto">
                            {Object.entries(deductionsMap).length > 0 ? (
                              Object.entries(deductionsMap).map(([k, v]) => {
                                const amt = parseFloat(v || 0);
                                const rawReason = selectedPayslip.deduction_reasons?.[k];
                                let reason = typeof rawReason === 'object' && rawReason !== null ? (rawReason.reason || rawReason.amount) : rawReason;
                                if (!reason) {
                                  if (k.includes('PF') || k.includes('Provident')) reason = "Employee statutory 12% contribution on Basic salary";
                                  else if (k.includes('ESI')) reason = "Employee statutory 0.75% State Insurance contribution on gross";
                                  else if (k.includes('TDS') || k.includes('Tax')) reason = "Monthly income tax withholding deducted under Section 192";
                                  else if (k.includes('PT') || k.includes('Professional')) reason = "State statutory Professional Tax slab deduction";
                                  else if (k.includes('Advance')) reason = "Monthly installment deducted for active salary advance";
                                  else if (k.includes('Loan')) reason = "Monthly personal loan recovery installment";
                                  else if (k.includes('Loss of Pay') || k.includes('LOP')) reason = `${selectedPayslip.lop_days || 0} day(s) unpaid leave / absence docked from salary`;
                                }

                                return (
                                  <div key={k} className="p-2.5 rounded-lg bg-[var(--status-danger)]/5 border border-[var(--status-danger)]/15 space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-semibold text-[var(--status-danger)] capitalize">{k.replace(/_/g, ' ')}</span>
                                      <span className="font-semibold text-[var(--status-danger)]">₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {reason && (
                                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-primary)] p-1.5 rounded border border-[var(--border-subtle)]">
                                        💡 {reason}
                                      </p>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-[var(--text-muted)] italic">No deductions applied for this employee</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Employer Statutory Contributions */}
                  {(() => {
                    const empContribs = selectedPayslip.employer_contributions || {};
                    const hasContribs = Object.keys(empContribs).length > 0 || parseFloat(selectedPayslip.employer_total_contribution || 0) > 0;
                    if (!hasContribs) return null;

                    const contribEntries = Object.keys(empContribs).length > 0
                      ? Object.entries(empContribs)
                      : [
                          ['Employer EPF', selectedPayslip.employer_epf || selectedPayslip.employer_pf],
                          ['Employer EPS', selectedPayslip.employer_eps],
                          ['Employer ESI', selectedPayslip.employer_esi],
                        ].filter(([_, v]) => parseFloat(v || 0) > 0);

                    return (
                      <div className="p-4 rounded-xl bg-[var(--status-info)]/5 border border-[var(--status-info)]/20">
                        <h4 className="text-xs font-bold text-[var(--status-info)] uppercase tracking-wider mb-2">Employer Statutory Benefits (Non-docked)</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {contribEntries.map(([k, v]) => (
                            <div key={k} className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                              <p className="text-[var(--text-muted)] capitalize">{k.replace(/_/g, ' ')}</p>
                              <p className="font-semibold text-[var(--status-info)] mt-0.5">₹{parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Net Salary Summary Card */}
                  <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--status-success)]/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--status-success)] uppercase tracking-wider font-semibold">Net Take-Home Pay</p>
                      <p className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">₹{parseFloat(selectedPayslip.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30">
                      {payrollRun.status === 'paid' ? 'Paid to Bank' : 'Payable'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Pre-Approval Exceptions */}
        {activeTab === 'exceptions' && (
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {exceptions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="w-12 h-12 text-[var(--status-success)] mx-auto mb-2" />
                <p className="text-[var(--text-primary)] font-semibold">Clean Cycle! No Exceptions Found.</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">All employee PANs, bank accounts, and structures verified.</p>
              </div>
            ) : (
              exceptions.map(exc => (
                <div key={exc.id} className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  exc.severity === 'critical' ? 'bg-[var(--status-danger)]/10 border-[var(--status-danger)]/30 text-[var(--status-danger)]' : 'bg-[var(--status-warning)]/10 border-[var(--status-warning)]/30 text-[var(--status-warning)]'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                        {exc.severity}
                      </span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{exc.employee_name || 'System Exception'}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{exc.message}</p>
                    {exc.resolution_note && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 italic">Resolution: {exc.resolution_note}</p>
                    )}
                  </div>
                  {!exc.is_resolved ? (
                    <button
                      onClick={() => handleResolveException(exc.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] whitespace-nowrap transition"
                    >
                      Acknowledge & Resolve
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--status-success)] font-medium">Resolved</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
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
      .catch((err) => showErrorToast(err, 'Failed to load exceptions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && payrollRunId) fetchExceptions();
  }, [isOpen, payrollRunId]);

  const handleResolve = async (id) => {
    try {
      await hrApi.resolveException(id);
      showSuccessToast('Exception marked as resolved');
      fetchExceptions();
      if (onResolved) onResolved();
    } catch (err) {
      showErrorToast(err, 'Failed to resolve exception');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/30">
          <div className="flex items-center gap-2">
            <ShieldExclamationIcon className="w-6 h-6 text-[var(--status-warning)]" />
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Payroll Pre-Approval Exceptions</h2>
              <p className="text-xs text-[var(--text-muted)]">Critical exceptions block approval until resolved.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-96 overflow-y-auto space-y-3">
          {loading ? (
            <p className="text-center py-8 text-[var(--text-muted)] text-sm">Scanning exceptions...</p>
          ) : exceptions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-10 h-10 text-[var(--status-success)] mx-auto mb-2" />
              <p className="text-[var(--text-primary)] font-medium">Clean Run! No Exceptions Detected.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">All bank accounts, statutory PANs, leaves, and structures are verified.</p>
            </div>
          ) : (
            exceptions.map(exc => (
              <div key={exc.id} className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                exc.severity === 'critical' ? 'bg-[var(--status-danger)]/10 border-[var(--status-danger)]/30 text-[var(--status-danger)]' : 'bg-[var(--status-warning)]/10 border-[var(--status-warning)]/30 text-[var(--status-warning)]'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                      {exc.severity}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{exc.employee_name || 'System Exception'}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{exc.message}</p>
                </div>
                {!exc.is_resolved ? (
                  <button
                    onClick={() => handleResolve(exc.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] whitespace-nowrap transition"
                  >
                    Acknowledge & Resolve
                  </button>
                ) : (
                  <span className="text-xs text-[var(--status-success)] font-medium">Resolved</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Payment Disbursement Modal ───────────────────────────────────────────────
function PaymentModal({ isOpen, onClose, payrollRun, onSuccess }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [saving, setSaving] = useState(false);
  const [cashWarning, setCashWarning] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCashWarning('');
      getAccounts({ account_type: 'asset' })
        .then(res => {
          const list = (res.results || res || []).filter((a) => {
            const code = String(a.code || '');
            const name = String(a.name || '').toLowerCase();
            return code === '1001' || code === '1002' || name.includes('bank') || name === 'cash' || name.startsWith('cash ');
          });
          setAccounts(list);
          const bank = list.find((a) => String(a.code) === '1002');
          setSelectedAccount(bank ? bank.id : (list[0]?.id || ''));
        })
        .catch((err) => showErrorToast(err, 'Failed to load bank/cash accounts'));
    }
  }, [isOpen]);

  useEffect(() => {
    const acc = accounts.find((a) => String(a.id) === String(selectedAccount));
    const net = parseFloat(payrollRun?.total_net || 0);
    if (acc && String(acc.code) === '1001' && net > 10000) {
      setCashWarning('Section 40A(3): Cash disbursement exceeds ₹10,000. Prefer Bank (1002).');
    } else {
      setCashWarning('');
    }
  }, [selectedAccount, accounts, payrollRun]);

  const requiredNet = parseFloat(payrollRun?.total_net || 0);
  const selectedAccBal = parseFloat(
    accounts.find((a) => String(a.id) === String(selectedAccount))?.current_balance || 0
  );
  const insufficientBalance =
    !!selectedAccount && (selectedAccBal < 0 || selectedAccBal < requiredNet);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      showErrorToast('Please select a payment/bank account');
      return;
    }
    const acc = accounts.find((a) => String(a.id) === String(selectedAccount));
    const net = requiredNet;
    const bal = selectedAccBal;
    if (acc && (bal < 0 || bal < net)) {
      showErrorToast(`Insufficient balance in ${acc.name}. Available ₹${bal.toLocaleString('en-IN')}, required ₹${net.toLocaleString('en-IN')}.`);
      return;
    }
    setSaving(true);
    try {
      const res = await hrApi.payPayroll(payrollRun.id, { payment_account_id: selectedAccount });
      const warnings = res?.warnings || [];
      if (warnings.length) {
        showSuccessToast(`Disbursement recorded. Note: ${warnings[0]}`);
      } else {
        showSuccessToast('Disbursement recorded and ledger entries posted!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showErrorToast(err, 'Disbursement failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !payrollRun) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/30">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Record Salary Disbursement</h2>
            <p className="text-xs text-[var(--text-muted)]">Total Net Payable: ₹{parseFloat(payrollRun.total_net).toLocaleString('en-IN')}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Disbursement Bank / Cash Account *</label>
            <select required value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className={ic}>
              <option value="">Select Account</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.code}) - Bal: ₹{parseFloat(acc.current_balance || 0).toLocaleString('en-IN')}</option>
              ))}
            </select>
          </div>
          {insufficientBalance && (
            <p className="text-xs text-[var(--status-danger)]">
              Insufficient balance. Available ₹{selectedAccBal.toLocaleString('en-IN')}, required ₹{requiredNet.toLocaleString('en-IN')}.
            </p>
          )}
          {cashWarning ? (
            <p className="text-xs text-[var(--status-warning)]">{cashWarning}</p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Defaults to Bank (1002). Credits the chosen account and debits Salaries Payable.</p>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl hover:text-[var(--text-primary)] transition">Cancel</button>
            <button type="submit" disabled={saving || insufficientBalance} className="btn-primary px-5 py-2 text-sm font-semibold rounded-xl disabled:opacity-50">
              {saving ? 'Processing...' : 'Confirm Disbursement'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
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
      showErrorToast('Please enter a reason for reopening');
      return;
    }
    setSaving(true);
    try {
      await hrApi.reopenPayroll(payrollRun.id, { reason: reason.trim() });
      showSuccessToast('Payroll reopened and accounting accrual reversed');
      onSuccess();
      onClose();
    } catch (err) {
      showErrorToast(err, 'Failed to reopen payroll');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !payrollRun) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/30">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reopen Payroll Run</h2>
            <p className="text-xs text-[var(--text-muted)]">Reverts to draft status for recalculation</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Reason for Reopening *</label>
            <textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} className={ic + ' resize-none'} placeholder="e.g. Leave adjustments reported post approval" />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl hover:text-[var(--text-primary)] transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-[var(--status-warning)] rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-sm">
              {saving ? 'Reopening...' : 'Confirm Reopen'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
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
      showSuccessToast(`Payroll run initialized for ${MONTHS[form.month - 1]} ${form.year}`);
      onSuccess();
      onClose();
    } catch (err) {
      showErrorToast(err, "Failed to initialize payroll run");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/30">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Initialize Payroll Cycle</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Month *</label>
            <select required name="month" value={form.month} onChange={e => setForm(p => ({ ...p, month: Number(e.target.value) }))} className={ic}>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Year *</label>
            <input required type="number" min={2020} max={2099} value={form.year} onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))} className={ic} />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl hover:text-[var(--text-primary)] transition">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm font-semibold rounded-xl disabled:opacity-50">
              {saving ? 'Creating...' : 'Initialize'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
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
  const [selectedDetailsRun, setSelectedDetailsRun] = useState(null);

  const fetchRuns = async ({ soft = false } = {}) => {
    try {
      if (!soft) setLoading(true);
      const res = await hrApi.getPayrollRuns();
      const list = res.data?.results || res.data || [];
      setRuns(list);
      // Keep details modal in sync after reopen / recalculate
      setSelectedDetailsRun((prev) => {
        if (!prev?.id) return prev;
        const fresh = list.find((r) => String(r.id) === String(prev.id));
        return fresh || prev;
      });
    } catch (error) {
      showErrorToast(error, "Failed to load payroll cycles");
    } finally {
      if (!soft) setLoading(false);
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
      showSuccessToast("Bank payout CSV downloaded successfully");
    } catch (err) {
      showErrorToast(err, "Failed to export bank payout CSV");
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleCalculate = async (id) => {
    try {
      const res = await hrApi.calculatePayroll(id);
      const updated = res?.data || res;
      showSuccessToast("Payroll computed successfully!");
      if (updated && updated.id) {
        setRuns((prev) => prev.map((r) => (String(r.id) === String(updated.id) ? { ...r, ...updated } : r)));
        setSelectedDetailsRun((prev) => (
          prev && String(prev.id) === String(updated.id) ? { ...prev, ...updated } : prev
        ));
      }
      await fetchRuns({ soft: true });
    } catch (error) {
      showErrorToast(error, "Payroll calculation failed");
    }
  };

  const handleApprove = async (id) => {
    try {
      await hrApi.approvePayroll(id);
      showSuccessToast("Payroll cycle approved successfully! Financial accruals posted.");
      fetchRuns();
    } catch (error) {
      showErrorToast(error, "Payroll approval failed");
      const errData = error.response?.data;
      const errText = typeof errData === 'string' ? errData : (errData?.error || errData?.detail || (Array.isArray(errData) ? errData[0] : ''));
      if (errText && (errText.toLowerCase().includes('critical') || errText.toLowerCase().includes('exception'))) {
        setSelectedExceptionsRun(id);
      }
    }
  };

  const handleLock = async (id) => {
    if (!window.confirm('Lock this payroll cycle? Further changes will require an audited reopen.')) return;
    try {
      await hrApi.lockPayroll(id);
      showSuccessToast("Payroll cycle locked securely");
      fetchRuns();
    } catch (error) {
      showErrorToast(error, "Failed to lock payroll cycle");
    }
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-primary)] mb-2 font-semibold">Core HRMS</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <CalculatorIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Monthly Payroll Workflow
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                Draft → Calculate → Review & Exceptions → Accrual Approval → Disbursement → Lock. Click any cycle row to inspect employee payment registers and audit trails.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <PlayIcon className="h-4 w-4" />
              New Payroll Cycle
            </button>
          </div>
        </section>

        {/* Processing Table */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/30">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Payroll Cycles</h2>
            <button onClick={fetchRuns} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs inline-flex items-center gap-1 transition">
              <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
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
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-[var(--text-muted)]">Loading payroll runs...</td></tr>
                ) : runs.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-[var(--text-muted)]">No payroll cycles created yet. Click "New Payroll Cycle" to start.</td></tr>
                ) : (
                  runs.map((run) => (
                    <tr
                      key={run.id}
                      onClick={() => setSelectedDetailsRun(run)}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors"
                      title="Click to view details, employee breakdowns, and reopen audit history"
                    >
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                        <div>
                          <p className="text-base font-semibold">{MONTHS[run.month - 1]} {run.year}</p>
                          <p className="text-xs text-[var(--text-muted)]">{run.employee_count} employees</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            run.status === 'locked' ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30' :
                            run.status === 'paid' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' :
                            run.status === 'approved' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' :
                            run.status === 'calculated' ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30' :
                            'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                          }`}>
                            {run.status}
                          </span>

                          {run.critical_exceptions_count > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedExceptionsRun(run.id);
                              }}
                              className="block text-xs font-medium text-[var(--status-danger)] hover:underline"
                            >
                              ⚠️ {run.critical_exceptions_count} Critical Exceptions
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">₹{parseFloat(run.total_gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-[var(--status-danger)]">₹{parseFloat(run.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-[var(--status-success)] font-bold">₹{parseFloat(run.total_net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>

                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {/* Calculate / Recalculate */}
                        {['draft', 'calculated', 'review', 'completed'].includes(run.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCalculate(run.id);
                            }}
                            className="px-3 py-1 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 border border-[var(--accent-primary)]/30 text-xs font-semibold transition"
                          >
                            {run.status === 'draft' ? 'Calculate' : 'Recalculate'}
                          </button>
                        )}

                        {/* Details & Audit Hub */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDetailsRun(run);
                          }}
                          className="px-3 py-1 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold inline-flex items-center gap-1 transition"
                          title="View cycle audit trail, employee payments register & deductions"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> Details & Audit
                        </button>

                        {/* Export Bank CSV */}
                        {['calculated', 'review', 'completed', 'approved', 'paid', 'locked'].includes(run.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBankExport(run.id, run.month, run.year);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-medium inline-flex items-center gap-1 transition"
                            title="Download Bank Payout CSV"
                          >
                            <DocumentArrowDownIcon className="w-3.5 h-3.5" /> Bank CSV
                          </button>
                        )}

                        {/* View Exceptions */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExceptionsRun(run.id);
                          }}
                          className="px-3 py-1 rounded-xl bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-medium transition"
                        >
                          Exceptions
                        </button>

                        {/* Approve (Posts Accrual to Ledger) */}
                        {['calculated', 'review', 'completed'].includes(run.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(run.id);
                            }}
                            className="px-3 py-1 rounded-xl bg-[var(--status-success)]/15 text-[var(--status-success)] hover:bg-[var(--status-success)]/25 border border-[var(--status-success)]/30 text-xs font-semibold inline-flex items-center gap-1 transition"
                          >
                            <CheckBadgeIcon className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}

                        {/* Pay / Disburse */}
                        {run.status === 'approved' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPayRun(run);
                            }}
                            className="px-3 py-1 rounded-xl bg-[var(--status-info)]/15 text-[var(--status-info)] hover:bg-[var(--status-info)]/25 border border-[var(--status-info)]/30 text-xs font-semibold inline-flex items-center gap-1 transition"
                          >
                            <BanknotesIcon className="w-3.5 h-3.5" /> Disburse
                          </button>
                        )}

                        {/* Lock */}
                        {run.status === 'paid' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLock(run.id);
                            }}
                            className="px-3 py-1 rounded-xl bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold inline-flex items-center gap-1 transition"
                          >
                            <LockClosedIcon className="w-3.5 h-3.5" /> Lock
                          </button>
                        )}

                        {/* Reopen */}
                        {['approved', 'paid', 'locked'].includes(run.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReopenRun(run);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-[var(--status-warning)]/15 text-[var(--status-warning)] hover:bg-[var(--status-warning)]/25 border border-[var(--status-warning)]/30 text-xs font-medium inline-flex items-center gap-1 transition"
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

      <PayrollCycleDetailsModal
        isOpen={!!selectedDetailsRun}
        onClose={() => setSelectedDetailsRun(null)}
        payrollRun={selectedDetailsRun}
        onActionRefresh={fetchRuns}
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
