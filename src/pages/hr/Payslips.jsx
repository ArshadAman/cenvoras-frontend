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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Payslip Breakdown — {MONTHS[(payslip.month || 1) - 1]} {payslip.year}
              </h2>
              <p className="text-xs text-gray-400">
                {payslip.employee_name} ({payslip.employee_code}) • {payslip.designation_name || payslip.department_name || 'Staff'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
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
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance & Working Days</h4>
                  <span className="text-xs text-gray-400">Monthly Standard: <span className="text-white font-semibold">{attendance.working_days} Days</span></span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[11px] text-gray-400">Working Days</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{attendance.working_days ?? '—'}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[11px] text-emerald-400">Present Days</p>
                    <p className="text-sm font-semibold text-emerald-300 mt-0.5">{attendance.present_days ?? '—'}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[11px] text-blue-400">Paid Leaves</p>
                    <p className="text-sm font-semibold text-blue-300 mt-0.5">{attendance.paid_leaves ?? 0}</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${unpaidDays > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
                    <p className={`text-[11px] ${unpaidDays > 0 ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>Loss of Pay (LOP)</p>
                    <p className={`text-sm font-semibold mt-0.5 ${unpaidDays > 0 ? 'text-red-300' : 'text-gray-400'}`}>{unpaidDays} days</p>
                  </div>
                </div>

                {unpaidDays > 0 && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Loss of Pay (LOP) Applied: {unpaidDays} Day(s)</span>
                      {lopAmt > 0 && <span>Amount Docked: ₹{lopAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>}
                    </div>
                    <p className="text-[11px] text-red-300/80 leading-relaxed">
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
            if (parseFloat(payslip.lop_amount || 0) > 0 && !deductionsMap['Loss of Pay (LOP)']) {
              deductionsMap['Loss of Pay (LOP)'] = payslip.lop_amount;
            }
            if (Object.keys(deductionsMap).length === 0 && parseFloat(payslip.total_deductions || 0) > 0) {
              deductionsMap['Statutory & Other Deductions'] = payslip.total_deductions;
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Earnings</span>
                    <span className="text-xs font-bold text-emerald-400">₹{parseFloat(payslip.gross_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {Object.entries(earningsMap).length > 0 ? (
                      Object.entries(earningsMap).map(([k, v]) => (
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

                {/* Deductions with Detailed Explanations */}
                <div className="p-4 rounded-xl bg-red-500/[0.03] border border-red-500/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400">Deductions & Explanations</span>
                    <span className="text-xs font-bold text-red-400">₹{parseFloat(payslip.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                          <div key={k} className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-red-300 capitalize">{k.replace(/_/g, ' ')}</span>
                              <span className="font-semibold text-red-400">₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {reason && (
                              <p className="text-[11px] text-gray-300 leading-relaxed italic bg-black/40 p-1.5 rounded border border-white/5">
                                💡 {reason}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-500">No deductions applied for this employee</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Employer Statutory Benefits */}
          {payslip.employer_contributions && Object.keys(payslip.employer_contributions).length > 0 && (
            <div className="p-4 rounded-xl bg-purple-500/[0.03] border border-purple-500/20">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                Employer Statutory Benefits (Non-docked)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(payslip.employer_contributions).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-white/5 border border-white/5 text-xs">
                    <p className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}</p>
                    <p className="font-semibold text-purple-300 mt-0.5">₹{parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Net Salary Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-black/40 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Net Take-Home Pay</p>
              <p className="text-2xl font-bold text-white mt-0.5">₹{parseFloat(payslip.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <button
              onClick={() => onDownloadPdf(payslip)}
              className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
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

  const selectCls = "px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500";

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Payroll Operations</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <DocumentTextIcon className="w-9 h-9 text-indigo-300" />
                Employee Payslips
              </h1>
              <p className="text-white/65 text-sm mt-2">
                Inspect salary computations, transparent deduction reasons, and download or dispatch payslips.
              </p>
            </div>
            <button
              onClick={fetchPayslips}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 text-xs font-medium text-gray-300 hover:text-white transition"
            >
              <ArrowPathIcon className="w-4 h-4" /> Refresh
            </button>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="p-4 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by employee name, code, dept..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
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
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </section>

        {/* Payslips Table */}
        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Payslips ({filteredPayslips.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
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
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">Loading payslips...</td></tr>
                ) : filteredPayslips.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No payslips match your filter criteria</td></tr>
                ) : (
                  filteredPayslips.map(ps => (
                    <tr key={ps.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">
                        <div>
                          <p className="font-semibold text-white">{ps.employee_name || ps.employee}</p>
                          <p className="text-xs text-gray-400">
                            {ps.employee_code} • {ps.designation_name || ps.department_name || 'Staff'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-gray-300">
                          {MONTHS[(ps.month || 1) - 1]} {ps.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        ₹{parseFloat(ps.gross_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-red-400 font-medium">
                        ₹{parseFloat(ps.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-bold">
                        ₹{parseFloat(ps.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {/* Quick View */}
                        <button
                          onClick={() => setQuickViewPayslip(ps)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition text-xs font-semibold inline-flex items-center gap-1"
                          title="Quick View Breakdown & Reasons"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> View
                        </button>

                        {/* Download PDF */}
                        <button 
                          onClick={() => handleDownload(ps)}
                          className="p-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 transition inline-flex items-center"
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
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition text-xs font-medium"
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
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition text-xs font-medium"
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
