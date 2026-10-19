import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  DocumentTextIcon, ArrowDownTrayIcon, EyeIcon, XMarkIcon,
  MagnifyingGlassIcon, FunnelIcon, UserIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ─── Interactive Quick View Modal ─────────────────────────────────────────────
function PayslipQuickViewModal({ isOpen, onClose, payslip, onDownloadPdf }) {
  if (!isOpen || !payslip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)]">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Payslip Breakdown — {MONTHS[(payslip.month || 1) - 1]} {payslip.year}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {payslip.employee_name} ({payslip.employee_code}) • {payslip.designation_name || payslip.department_name || 'Staff'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Attendance & Leave Summary */}
          {(() => {
            const attendance = payslip.attendance_summary || {
              working_days: payslip.total_working_days ?? 26,
              present_days: payslip.present_days ?? '—',
              paid_leaves: payslip.paid_leave_days ?? 0,
              unpaid_leaves: payslip.lop_days ?? 0,
            };
            const unpaidDays = parseFloat(attendance.unpaid_leaves || 0);
            const lopAmt = parseFloat(payslip.lop_amount || 0);

            return (
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Attendance & Working Days</h4>
                  <span className="text-xs text-[var(--text-muted)]">Monthly Standard: <span className="text-[var(--text-primary)] font-semibold">{attendance.working_days} Days</span></span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <p className="text-[11px] text-[var(--text-muted)]">Working Days</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{attendance.working_days ?? '—'}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--status-success)]/10 border border-[var(--status-success)]/30">
                    <p className="text-[11px] text-[var(--status-success)]">Present Days</p>
                    <p className="text-sm font-semibold text-[var(--status-success)] mt-0.5">{attendance.present_days ?? '—'}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--status-info)]/10 border border-[var(--status-info)]/30">
                    <p className="text-[11px] text-[var(--status-info)]">Paid Leaves</p>
                    <p className="text-sm font-semibold text-[var(--status-info)] mt-0.5">{attendance.paid_leaves ?? 0}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${unpaidDays > 0 ? 'bg-[var(--status-danger)]/10 border-[var(--status-danger)]/30' : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)]'}`}>
                    <p className={`text-[11px] ${unpaidDays > 0 ? 'text-[var(--status-danger)] font-semibold' : 'text-[var(--text-muted)]'}`}>Loss of Pay (LOP)</p>
                    <p className={`text-sm font-semibold mt-0.5 ${unpaidDays > 0 ? 'text-[var(--status-danger)]' : 'text-[var(--text-muted)]'}`}>{unpaidDays} days</p>
                  </div>
                </div>

                {unpaidDays > 0 && (
                  <div className="p-2.5 rounded-lg bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 text-xs text-[var(--status-danger)] space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Loss of Pay (LOP) Applied: {unpaidDays} Day(s)</span>
                      {lopAmt > 0 && <span>Amount Docked: ₹{lopAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>}
                    </div>
                    <p className="text-[11px] text-[var(--status-danger)]/80 leading-relaxed">
                      Salary prorated based on attendance. Unpaid leaves or absences are docked from gross compensation.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Earnings & Deductions Grid */}
          {(() => {
            const earningsMap = payslip.earnings_breakdown
              && Object.keys(payslip.earnings_breakdown).length > 0
                ? payslip.earnings_breakdown
                : (payslip.earnings && Object.keys(payslip.earnings).length > 0
                    ? payslip.earnings
                    : (parseFloat(payslip.gross_salary || 0) > 0 ? { 'Gross Base Salary': payslip.gross_salary } : {}));

            const rawDeductions = payslip.deductions_breakdown
              && Object.keys(payslip.deductions_breakdown).length > 0
                ? payslip.deductions_breakdown
                : (payslip.deductions || {});

            const deductionsMap = { ...rawDeductions };

            if (parseFloat(payslip.employee_pf || 0) > 0 && !deductionsMap['PF'] && !deductionsMap['Provident Fund (PF)']) {
              deductionsMap['Provident Fund (PF)'] = payslip.employee_pf;
            }
            if (parseFloat(payslip.employee_esi || 0) > 0 && !deductionsMap['ESI']) {
              deductionsMap['State Insurance (ESI)'] = payslip.employee_esi;
            }
            if (parseFloat(payslip.tds || 0) > 0 && !deductionsMap['TDS'] && !deductionsMap['Income Tax (TDS)']) {
              deductionsMap['Income Tax (TDS)'] = payslip.tds;
            }
            if (parseFloat(payslip.professional_tax || 0) > 0 && !deductionsMap['PT'] && !deductionsMap['Professional Tax (PT)']) {
              deductionsMap['Professional Tax (PT)'] = payslip.professional_tax;
            }
            if (parseFloat(payslip.advance_recovery || 0) > 0 && !deductionsMap['Salary Advance Recovery']) {
              deductionsMap['Salary Advance Recovery'] = payslip.advance_recovery;
            }
            if (parseFloat(payslip.loan_recovery || 0) > 0 && !deductionsMap['Loan Recovery']) {
              deductionsMap['Loan Recovery'] = payslip.loan_recovery;
            }
            delete deductionsMap['Loss of Pay (LOP)'];
            delete deductionsMap['LOP'];
            if (Object.keys(deductionsMap).length === 0 && parseFloat(payslip.total_deductions || 0) > 0) {
              deductionsMap['Statutory & Other Deductions'] = payslip.total_deductions;
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="p-4 rounded-xl bg-[var(--status-success)]/5 border border-[var(--status-success)]/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--status-success)]/20 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--status-success)]">Earnings</span>
                    <span className="text-xs font-bold text-[var(--status-success)]">₹{parseFloat(payslip.gross_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                      <p className="text-xs text-[var(--text-muted)]">No earnings recorded</p>
                    )}
                  </div>
                </div>

                {/* Deductions with Detailed Explanations */}
                <div className="p-4 rounded-xl bg-[var(--status-danger)]/5 border border-[var(--status-danger)]/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--status-danger)]/20 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--status-danger)]">Deductions & Explanations</span>
                    <span className="text-xs font-bold text-[var(--status-danger)]">₹{parseFloat(payslip.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {Object.entries(deductionsMap).length > 0 ? (
                      Object.entries(deductionsMap).map(([k, v]) => {
                        const amt = parseFloat(v || 0);
                        const rawReason = payslip.deduction_reasons?.[k];
                        let reason = typeof rawReason === 'object' && rawReason !== null ? (rawReason.reason || rawReason.amount) : rawReason;
                        if (!reason) {
                          if (k.includes('PF') || k.includes('Provident')) reason = "Employee statutory 12% contribution on Basic salary";
                          else if (k.includes('ESI')) reason = "Employee statutory 0.75% contribution on gross";
                          else if (k.includes('TDS') || k.includes('Tax')) reason = "Monthly income tax withholding deducted under Section 192";
                          else if (k.includes('PT') || k.includes('Professional')) reason = "State statutory Professional Tax slab deduction";
                          else if (k.includes('Advance')) reason = "Monthly installment deducted for active salary advance";
                          else if (k.includes('Loan')) reason = "Monthly personal loan recovery installment";
                          else if (k.includes('Loss of Pay') || k.includes('LOP')) reason = `${payslip.lop_days || 0} day(s) unpaid leave / absence docked from salary`;
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
                      <p className="text-xs text-[var(--text-muted)]">No deductions applied for this employee</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Employer Statutory Benefits */}
          {payslip.employer_contributions && Object.keys(payslip.employer_contributions).length > 0 && (
            <div className="p-4 rounded-xl bg-[var(--status-info)]/5 border border-[var(--status-info)]/20">
              <h4 className="text-xs font-bold text-[var(--status-info)] uppercase tracking-wider mb-2">
                Employer Statutory Benefits (Non-docked)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(payslip.employer_contributions).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                    <p className="text-[var(--text-muted)] capitalize">{k.replace(/_/g, ' ')}</p>
                    <p className="font-semibold text-[var(--status-info)] mt-0.5">₹{parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Net Salary Summary */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--status-success)]/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--status-success)] uppercase tracking-wider font-semibold">Net Take-Home Pay</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">₹{parseFloat(payslip.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <button
              onClick={() => onDownloadPdf(payslip)}
              className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Payslips View ───────────────────────────────────────────────────────
export default function Payslips() {
  const [payslips, setPayslips] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Quick View Modal
  const [quickViewPayslip, setQuickViewPayslip] = useState(null);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getPayslips();
      setPayslips(res.data?.results || res.data || []);
    } catch (error) {
      toast.error("Failed to load payslips");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepts = async () => {
    try {
      const res = await hrApi.getDepartments();
      setDepartments(res.data?.results || res.data || []);
    } catch (e) {
      // Non-critical
    }
  };

  useEffect(() => {
    fetchPayslips();
    fetchDepts();
  }, []);

  const handleDownload = async (ps) => {
    try {
      const response = await hrApi.downloadPayslipPdf(ps.id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${ps.employee_code || ps.employee}_${ps.month}_${ps.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Payslip PDF downloaded");
    } catch (error) {
      toast.error("Failed to download payslip PDF");
    }
  };

  // Filtered list
  const filteredPayslips = payslips.filter(ps => {
    const q = searchTerm.toLowerCase();
    const name = (ps.employee_name || '').toLowerCase();
    const code = (ps.employee_code || '').toLowerCase();
    const dept = (ps.department_name || '').toLowerCase();

    const matchesSearch = !q || name.includes(q) || code.includes(q) || dept.includes(q);
    const matchesMonth = !selectedMonth || String(ps.month) === String(selectedMonth);
    const matchesYear = !selectedYear || String(ps.year) === String(selectedYear);
    const matchesDept = !selectedDept || String(ps.department_name) === String(selectedDept);

    return matchesSearch && matchesMonth && matchesYear && matchesDept;
  });

  const availableYears = Array.from(new Set(payslips.map(p => p.year).filter(Boolean))).sort((a, b) => b - a);
  if (availableYears.length === 0) availableYears.push(new Date().getFullYear());

  const selectCls = "px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]";

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-primary)] mb-2 font-semibold">Payroll Operations</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <DocumentTextIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Employee Payslips
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                Inspect salary computations, transparent deduction reasons, and download or dispatch payslips.
              </p>
            </div>
            <button
              onClick={fetchPayslips}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] px-3.5 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              <ArrowPathIcon className="w-4 h-4" /> Refresh
            </button>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlassIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by employee name, code, dept..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className={selectCls}
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className={selectCls}
            >
              <option value="">All Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>

            {/* Department Filter */}
            {departments.length > 0 && (
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className={selectCls}
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            )}

            {(searchTerm || selectedMonth || selectedYear || selectedDept) && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedMonth(''); setSelectedYear(''); setSelectedDept(''); }}
                className="text-xs text-[var(--accent-primary)] hover:underline font-medium px-2 py-1 transition"
              >
                Reset
              </button>
            )}
          </div>
        </section>

        {/* Payslips Table */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/30">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Payslips ({filteredPayslips.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Gross Earnings</th>
                  <th className="px-6 py-4">Deductions</th>
                  <th className="px-6 py-4">Net Salary</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-[var(--text-muted)]">Loading payslips...</td></tr>
                ) : filteredPayslips.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-[var(--text-muted)]">No payslips match your filter criteria</td></tr>
                ) : (
                  filteredPayslips.map(ps => (
                    <tr key={ps.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{ps.employee_name || ps.employee}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {ps.employee_code} • {ps.designation_name || ps.department_name || 'Staff'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          {MONTHS[(ps.month || 1) - 1]} {ps.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                        ₹{parseFloat(ps.gross_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-[var(--status-danger)] font-medium">
                        ₹{parseFloat(ps.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-[var(--status-success)] font-bold">
                        ₹{parseFloat(ps.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {/* Quick View */}
                        <button
                          onClick={() => setQuickViewPayslip(ps)}
                          className="px-2.5 py-1.5 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 border border-[var(--accent-primary)]/30 transition text-xs font-semibold inline-flex items-center gap-1"
                          title="Quick View Breakdown & Reasons"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> View
                        </button>

                        {/* Download PDF */}
                        <button 
                          onClick={() => handleDownload(ps)}
                          className="p-1.5 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition inline-flex items-center"
                          title="Download PDF"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>

                        {/* Email */}
                        <button 
                          onClick={async () => {
                            try {
                              await hrApi.sendPayslipEmail(ps.id);
                              toast.success(`Payslip emailed to ${ps.employee_name}`);
                            } catch (e) {
                              toast.error('Failed to send email');
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition text-xs font-medium"
                          title="Send Email"
                        >
                          ✉️
                        </button>

                        {/* WhatsApp */}
                        <button 
                          onClick={async () => {
                            try {
                              await hrApi.sendPayslipWhatsApp(ps.id);
                              toast.success(`WhatsApp queued for ${ps.employee_name}`);
                            } catch (e) {
                              toast.error('Failed to send WhatsApp');
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[var(--status-success)]/15 text-[var(--status-success)] hover:bg-[var(--status-success)]/25 border border-[var(--status-success)]/30 transition text-xs font-medium"
                          title="Send WhatsApp"
                        >
                          💬
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

      {/* Quick View Modal */}
      <PayslipQuickViewModal
        isOpen={!!quickViewPayslip}
        onClose={() => setQuickViewPayslip(null)}
        payslip={quickViewPayslip}
        onDownloadPdf={handleDownload}
      />
    </>
  );
}
