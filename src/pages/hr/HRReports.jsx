import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  BookOpenIcon, ArrowDownTrayIcon, ArrowPathIcon, EyeIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import EmployeeDetailedReportModal from "../../components/hr/EmployeeDetailedReportModal";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function HRReports() {
  const now = new Date();
  const [reportType, setReportType] = useState('payroll_register');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getHRReports({ type: reportType, year, month });
      setReportData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || "Failed to generate HR report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, year, month]);

  const exportCSV = () => {
    if (!reportData) return;
    let csvContent = "";

    if (reportType === 'payroll_register' && reportData.records) {
      const headers = ["Code", "Employee", "Department", "Branch", "Bank Account", "IFSC", "PAN", "Working Days", "LOP Days", "Gross Salary", "Deductions", "Net Salary", "Employer Contribution"];
      const rows = reportData.records.map(r => [
        r.employee_code,
        `"${r.employee_name}"`,
        `"${r.department}"`,
        `"${r.branch}"`,
        r.bank_account,
        r.ifsc,
        r.pan,
        r.working_days,
        r.lop_days,
        r.gross_salary,
        r.total_deductions,
        r.net_salary,
        r.employer_contribution
      ]);
      csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    } else if (reportType === 'department_expenses' && reportData.results) {
      const headers = ["Department", "Headcount", "Gross Salary", "Net Salary", "Deductions", "Employer Contribution"];
      const rows = reportData.results.map(r => [
        `"${r.department}"`,
        r.headcount,
        r.gross,
        r.net,
        r.deductions,
        r.employer_contribution
      ]);
      csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${reportType}_${month}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
      {/* Header */}
      <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)] mb-2 font-semibold">Analytics & Compliance</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
              <BookOpenIcon className="w-9 h-9 text-[var(--accent-primary)]" />
              HR & Payroll Reports
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-2">
              Generate audit-ready payroll registers, department expense breakdowns, and statutory liability summaries.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="btn-secondary"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </section>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl shadow-sm">
        <div className="flex gap-2">
          {[
            { id: 'payroll_register', label: 'Payroll Register' },
            { id: 'department_expenses', label: 'Department Expenses' },
            { id: 'statutory_summary', label: 'Statutory Summary (PF/ESI/PT)' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setReportType(t.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                reportType === t.id
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-sm'
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs">
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="w-20 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs"
          />
        </div>
      </div>

      {/* Report Tables */}
      <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-[var(--text-muted)] text-sm">Generating report...</div>
        ) : !reportData ? (
          <div className="p-16 text-center text-[var(--text-muted)] text-sm">No report data generated.</div>
        ) : reportType === 'payroll_register' ? (
          <div className="overflow-x-auto">
            <div className="px-5 py-3 bg-[var(--accent-primary)]/10 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
                <span>Click on any employee to view their full itemized payroll audit report with attendance proration, tax rationales, and banking details.</span>
              </div>
            </div>

            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/70 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Department / Branch</th>
                  <th className="px-5 py-4">Bank / IFSC</th>
                  <th className="px-5 py-4">Days (Work/LOP)</th>
                  <th className="px-5 py-4">Gross Salary</th>
                  <th className="px-5 py-4">Deductions</th>
                  <th className="px-5 py-4">Net Salary</th>
                  <th className="px-5 py-4">Employer Contr.</th>
                  <th className="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(!reportData.records || reportData.records.length === 0) ? (
                  <tr><td colSpan="9" className="px-5 py-10 text-center text-[var(--text-muted)]">No payslips found for this cycle.</td></tr>
                ) : (
                  reportData.records.map((r, i) => (
                    <tr
                      key={i}
                      onClick={() => setSelectedRecord(r)}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4 font-medium text-[var(--text-primary)]">
                        <p className="group-hover:text-[var(--accent-primary)] transition-colors font-semibold">{r.employee_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-[var(--text-muted)] font-mono">{r.employee_code}</span>
                          {r.tax_regime && (
                            <span className="text-xs px-1 py-0.2 rounded bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)] uppercase font-mono">
                              {r.tax_regime}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[var(--text-primary)]">{r.department}</p>
                        <p className="text-xs text-[var(--accent-primary)]">{r.branch}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono">
                        <p className="text-[var(--text-primary)]">{r.bank_account}</p>
                        <p className="text-[var(--text-muted)]">{r.ifsc}</p>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="text-[var(--status-success)] font-medium">{r.working_days}d</span> / <span className="text-[var(--status-danger)] font-medium">{r.lop_days}d</span>
                      </td>
                      <td className="px-5 py-4 font-medium text-[var(--text-primary)]">₹{parseFloat(r.gross_salary).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-[var(--status-danger)] font-medium">₹{parseFloat(r.total_deductions).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 font-bold text-[var(--status-success)]">₹{parseFloat(r.net_salary).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-xs text-[var(--accent-primary)]">₹{parseFloat(r.employer_contribution).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(r);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 border border-[var(--accent-primary)]/30 transition"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : reportType === 'department_expenses' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/70 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Headcount</th>
                  <th className="px-6 py-4">Gross Payout</th>
                  <th className="px-6 py-4">Total Deductions</th>
                  <th className="px-6 py-4">Net Salary Paid</th>
                  <th className="px-6 py-4">Employer Liability</th>
                </tr>
              </thead>
              <tbody>
                {(!reportData.results || reportData.results.length === 0) ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-[var(--text-muted)]">No departmental data for this cycle.</td></tr>
                ) : (
                  reportData.results.map((d, i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{d.department}</td>
                      <td className="px-6 py-4">{d.headcount}</td>
                      <td className="px-6 py-4 text-[var(--text-primary)]">₹{parseFloat(d.gross).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-[var(--status-danger)]">₹{parseFloat(d.deductions).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-bold text-[var(--status-success)]">₹{parseFloat(d.net).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-[var(--accent-primary)]">₹{parseFloat(d.employer_contribution).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Provident Fund (EPFO)</h3>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Employee Contribution (12%):</span>
                <span className="font-semibold text-[var(--text-primary)]">₹{parseFloat(reportData.employee_pf || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Employer Contribution (12%):</span>
                <span className="font-semibold text-[var(--text-primary)]">₹{parseFloat(reportData.employer_pf || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-[var(--border-subtle)] pt-2 font-bold text-[var(--status-success)]">
                <span>Total PF Remittance Liability:</span>
                <span>₹{parseFloat(reportData.total_pf_liability || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Employee State Insurance (ESIC)</h3>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Employee Contribution (0.75%):</span>
                <span className="font-semibold text-[var(--text-primary)]">₹{parseFloat(reportData.employee_esi || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Employer Contribution (3.25%):</span>
                <span className="font-semibold text-[var(--text-primary)]">₹{parseFloat(reportData.employer_esi || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-[var(--border-subtle)] pt-2 font-bold text-[var(--status-success)]">
                <span>Total ESI Remittance Liability:</span>
                <span>₹{parseFloat(reportData.total_esi_liability || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Professional Tax (PT)</h3>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Total State PT Deducted:</span>
                <span className="font-bold text-[var(--text-primary)]">₹{parseFloat(reportData.professional_tax || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Tax Deducted at Source (TDS)</h3>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Total TDS Payable (Income Tax):</span>
                <span className="font-bold text-[var(--text-primary)]">₹{parseFloat(reportData.tds_payable || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Employee Detailed Audit Report Modal */}
      <EmployeeDetailedReportModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        monthName={MONTHS[month - 1]}
        year={year}
      />
    </div>
  );
}
