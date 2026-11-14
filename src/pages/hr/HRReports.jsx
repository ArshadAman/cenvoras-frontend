import React, { useState, useEffect, useRef } from "react";
import { hrApi } from "../../api/hr";
import {
  BookOpenIcon, ArrowDownTrayIcon, ArrowPathIcon, EyeIcon, InformationCircleIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import EmployeeDetailedReportModal from "../../components/hr/EmployeeDetailedReportModal";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const QUARTERS = [
  { id: 'Q1', label: 'Q1 (Apr - Jun)' },
  { id: 'Q2', label: 'Q2 (Jul - Sep)' },
  { id: 'Q3', label: 'Q3 (Oct - Dec)' },
  { id: 'Q4', label: 'Q4 (Jan - Mar)' },
];

export default function HRReports() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Determine current FY (e.g. 2026-27)
  const defaultFy = currentMonth >= 4
    ? `${currentYear}-${String(currentYear + 1).slice(-2)}`
    : `${currentYear - 1}-${String(currentYear).slice(-2)}`;

  const [reportType, setReportType] = useState('payroll_register');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [quarter, setQuarter] = useState('Q3');
  const [financialYear, setFinancialYear] = useState(defaultFy);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const fetchSeqRef = useRef(0);

  const isMonthlyReport = ['payroll_register', 'department_expenses', 'statutory_summary', 'pt_register', 'pf_ecr', 'esi_return'].includes(reportType);
  const isQuarterlyReport = reportType === 'tds_24q';
  const isAnnualReport = reportType === 'form_16';

  useEffect(() => {
    const seq = ++fetchSeqRef.current;
    let cancelled = false;

    const fetchReport = async () => {
      setLoading(true);
      setReportData(null);
      try {
        const params = {
          type: reportType,
          year,
          month,
          quarter,
          financial_year: financialYear,
        };
        const res = await hrApi.getHRReports(params);
        if (cancelled || seq !== fetchSeqRef.current) return;
        const data = res.data;

        // Ignore out-of-order responses for monthly reports
        if (
          isMonthlyReport &&
          data &&
          data.year != null &&
          data.month != null &&
          (Number(data.year) !== Number(year) || Number(data.month) !== Number(month))
        ) {
          return;
        }
        setReportData(data);
      } catch (err) {
        if (cancelled || seq !== fetchSeqRef.current) return;
        setReportData(null);
        toast.error(err.response?.data?.detail || err.response?.data?.error || "Failed to generate HR report");
      } finally {
        if (!cancelled && seq === fetchSeqRef.current) {
          setLoading(false);
        }
      }
    };

    fetchReport();
    return () => {
      cancelled = true;
    };
  }, [reportType, year, month, quarter, financialYear]);

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
    } else if (reportType === 'pt_register' && reportData.lines) {
      const headers = ["Code", "Employee", "Work State", "Gross Salary", "Professional Tax"];
      const rows = reportData.lines.map(r => [
        r.employee_code,
        `"${r.employee_name}"`,
        `"${r.work_state}"`,
        r.gross_salary,
        r.professional_tax
      ]);
      csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    } else if (reportType === 'pf_ecr' && reportData.records) {
      const headers = ["UAN", "Member Name", "Gross Wages", "EPF Wages", "EPS Wages", "EDLI Wages", "EE Share 12%", "EPS Share 8.33%", "ER Share 3.67%", "NCP (LOP) Days", "Refund Advances", "Arrear EPF Wages", "Arrear EE Share", "Arrear ER Share", "Arrear EPS Share"];
      const rows = reportData.records.map(r => [
        r.uan,
        `"${r.member_name}"`,
        r.gross_wages,
        r.epf_wages,
        r.eps_wages,
        r.edli_wages,
        r.ee_share,
        r.eps_share,
        r.er_share,
        r.ncp_days,
        r.refund_of_advances,
        r.arrear_epf_wages,
        r.arrear_ee_share,
        r.arrear_er_share,
        r.arrear_eps_share
      ]);
      csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    } else if (reportType === 'esi_return' && reportData.records) {
      const headers = ["IP Number", "IP Name", "Employee Code", "Days Worked", "Total Monthly Wages", "Employee ESI (0.75%)", "Employer ESI (3.25%)", "Total Contribution", "Reason Code"];
      const rows = reportData.records.map(r => [
        r.ip_number,
        `"${r.ip_name}"`,
        r.employee_code,
        r.no_of_days_worked,
        r.total_monthly_wages,
        r.ip_contribution,
        r.employer_contribution,
        r.total_contribution,
        `"${r.reason_code}"`
      ]);
      csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    } else if (reportType === 'tds_24q' && reportData.records) {
      const headers = ["Employee Code", "Employee Name", "PAN", "Section", "Payment Date", "Gross Amount", "TDS Deducted", "Income Tax", "Cess (4%)", "Total Tax Deposited", "Challan/BSR"];
      const rows = reportData.records.map(r => [
        r.employee_code,
        `"${r.employee_name}"`,
        r.pan,
        r.section,
        r.payment_date,
        r.gross_amount,
        r.tds_deducted,
        r.income_tax,
        r.cess_4_pct,
        r.total_tax_deposited,
        `"${r.challan_bsr}"`
      ]);
      csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    } else if (reportType === 'form_16' && reportData.records) {
      const headers = ["Employee Code", "Employee Name", "PAN", "Regime", "Gross Salary (17(1))", "Standard Deduction", "Professional Tax", "Taxable Salary", "Chapter VI-A", "Total Taxable Income", "Tax on Income", "Rebate 87A", "Cess (4%)", "Net Tax Liability", "Total TDS Deducted", "Tax Payable / Refund"];
      const rows = reportData.records.map(r => [
        r.employee_code,
        `"${r.employee_name}"`,
        r.pan,
        r.tax_regime,
        r.gross_salary,
        r.standard_deduction,
        r.professional_tax,
        r.income_chargeable_salaries,
        r.chapter_vi_a,
        r.total_taxable_income,
        r.tax_on_total_income,
        r.rebate_87a,
        r.cess_4_pct,
        r.net_tax_liability,
        r.total_tds_deducted,
        r.tax_payable_or_refund
      ]);
      csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const filenameSuffix = isQuarterlyReport ? `${quarter}_${financialYear}` : isAnnualReport ? `${financialYear}` : `${month}_${year}`;
      link.setAttribute("download", `${reportType}_${filenameSuffix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportEcrTxt = () => {
    if (!reportData?.ecr_text) {
      toast.info("No ECR text available for this cycle.");
      return;
    }
    const blob = new Blob([reportData.ecr_text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ECR_${month}_${year}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              HR & Statutory Reports
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-2">
              Generate audit-ready payroll registers, department expense breakdowns, and statutory returns (PF ECR, ESI Return, 24Q, Form 16).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {reportType === 'pf_ecr' && (
              <button
                onClick={exportEcrTxt}
                className="btn-secondary"
                title="Download official EPFO #~# formatted ECR text file for portal upload"
              >
                <DocumentTextIcon className="w-4 h-4 text-[var(--accent-primary)]" /> Export EPFO Text
              </button>
            )}
            <button
              onClick={exportCSV}
              className="btn-secondary"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </section>

      {/* Report Tabs */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'payroll_register', label: 'Payroll Register' },
            { id: 'department_expenses', label: 'Department Expenses' },
            { id: 'statutory_summary', label: 'Statutory Summary' },
            { id: 'pt_register', label: 'PT Register' },
            { id: 'pf_ecr', label: 'PF ECR (Monthly)' },
            { id: 'esi_return', label: 'ESI Return (Monthly)' },
            { id: 'tds_24q', label: 'TDS Form 24Q (Quarterly)' },
            { id: 'form_16', label: 'Form 16 Part B (Annual)' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setReportType(t.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                reportType === t.id
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)] font-medium">
            {isMonthlyReport ? 'Monthly Cycle Filters:' : isQuarterlyReport ? 'Quarterly Filters:' : 'Annual Financial Year Filter:'}
          </div>

          <div className="flex items-center gap-3">
            {isMonthlyReport && (
              <>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs font-medium">
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs font-medium"
                />
              </>
            )}

            {isQuarterlyReport && (
              <>
                <select value={quarter} onChange={e => setQuarter(e.target.value)} className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs font-medium">
                  {QUARTERS.map(q => (
                    <option key={q.id} value={q.id}>{q.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={financialYear}
                  placeholder="2026-27"
                  onChange={e => setFinancialYear(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs font-medium font-mono"
                  title="Financial Year (e.g. 2026-27)"
                />
              </>
            )}

            {isAnnualReport && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">FY:</span>
                <input
                  type="text"
                  value={financialYear}
                  placeholder="2026-27"
                  onChange={e => setFinancialYear(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs font-medium font-mono"
                  title="Financial Year (e.g. 2026-27)"
                />
              </div>
            )}
          </div>
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
        ) : reportType === 'pt_register' ? (
          <div className="overflow-x-auto">
            <div className="px-5 py-3 bg-[var(--accent-primary)]/10 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-primary)]">
              <span>
                Cycle: <strong>{MONTHS[(Number(reportData.month ?? month) || 1) - 1]} {reportData.year ?? year}</strong>
                {' · '}
                Total PT payable this cycle: <strong>₹{parseFloat(reportData.total_pt_payable || 0).toLocaleString('en-IN')}</strong>
              </span>
              {reportData.by_state && Object.keys(reportData.by_state).length > 0 && (
                <span className="text-[var(--text-muted)]">
                  By state: {Object.entries(reportData.by_state).map(([st, amt]) => `${st}: ₹${parseFloat(amt).toLocaleString('en-IN')}`).join(' · ')}
                </span>
              )}
            </div>
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/70 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Work State</th>
                  <th className="px-5 py-4">Gross Salary</th>
                  <th className="px-5 py-4">Professional Tax</th>
                </tr>
              </thead>
              <tbody>
                {(!reportData.lines || reportData.lines.length === 0) ? (
                  <tr><td colSpan="4" className="px-5 py-10 text-center text-[var(--text-muted)]">No PT deductions for this cycle.</td></tr>
                ) : (
                  reportData.lines.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-5 py-4 font-medium text-[var(--text-primary)]">
                        <p className="font-semibold">{r.employee_name}</p>
                        <span className="text-xs text-[var(--text-muted)] font-mono">{r.employee_code}</span>
                      </td>
                      <td className="px-5 py-4 text-[var(--text-primary)]">{r.work_state}</td>
                      <td className="px-5 py-4 text-[var(--text-primary)]">₹{parseFloat(r.gross_salary || 0).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 font-bold text-[var(--text-primary)]">₹{parseFloat(r.professional_tax || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : reportType === 'pf_ecr' ? (
          <div className="overflow-x-auto">
            <div className="px-5 py-3 bg-[var(--accent-primary)]/10 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-primary)]">
              <span>
                EPFO Cycle: <strong>{MONTHS[month - 1]} {year}</strong> · Total Remittance: <strong>₹{parseFloat(reportData.totals?.total_remittance || 0).toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-[var(--text-muted)]">
                EE 12%: ₹{parseFloat(reportData.totals?.ee_share || 0).toLocaleString('en-IN')} | EPS 8.33%: ₹{parseFloat(reportData.totals?.eps_share || 0).toLocaleString('en-IN')} | ER 3.67%: ₹{parseFloat(reportData.totals?.er_share || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <table className="w-full text-xs text-left text-[var(--text-secondary)]">
              <thead className="uppercase bg-[var(--bg-primary)]/70 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-3">UAN</th>
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">EPF Wages</th>
                  <th className="px-4 py-3">EPS Wages</th>
                  <th className="px-4 py-3">EE Share (12%)</th>
                  <th className="px-4 py-3">EPS (8.33%)</th>
                  <th className="px-4 py-3">ER (3.67%)</th>
                  <th className="px-4 py-3 text-center">NCP (LOP)</th>
                </tr>
              </thead>
              <tbody>
                {(!reportData.records || reportData.records.length === 0) ? (
                  <tr><td colSpan="9" className="px-5 py-10 text-center text-[var(--text-muted)]">No PF-covered employees in this cycle.</td></tr>
                ) : (
                  reportData.records.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] font-mono">
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{r.uan || '—'}</td>
                      <td className="px-4 py-3 font-sans font-medium text-[var(--text-primary)]">{r.member_name}</td>
                      <td className="px-4 py-3">₹{parseFloat(r.gross_wages).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">₹{parseFloat(r.epf_wages).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">₹{parseFloat(r.eps_wages).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-[var(--status-danger)]">₹{parseFloat(r.ee_share).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-[var(--accent-primary)]">₹{parseFloat(r.eps_share).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-[var(--accent-primary)]">₹{parseFloat(r.er_share).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-center">{r.ncp_days}d</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : reportType === 'esi_return' ? (
          <div className="overflow-x-auto">
            <div className="px-5 py-3 bg-[var(--accent-primary)]/10 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-primary)]">
              <span>
                ESIC Period: <strong>{MONTHS[month - 1]} {year}</strong> · Total ESI Liability: <strong>₹{parseFloat(reportData.totals?.total_esi_liability || 0).toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-[var(--text-muted)]">
                Employee (0.75%): ₹{parseFloat(reportData.totals?.employee_contribution || 0).toLocaleString('en-IN')} | Employer (3.25%): ₹{parseFloat(reportData.totals?.employer_contribution || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <table className="w-full text-xs text-left text-[var(--text-secondary)]">
              <thead className="uppercase bg-[var(--bg-primary)]/70 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-3">IP Number</th>
                  <th className="px-4 py-3">Insured Person</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Days Worked</th>
                  <th className="px-4 py-3">Monthly Wages</th>
                  <th className="px-4 py-3">IP Contrib. (0.75%)</th>
                  <th className="px-4 py-3">Employer (3.25%)</th>
                  <th className="px-4 py-3">Total Remittance</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {(!reportData.records || reportData.records.length === 0) ? (
                  <tr><td colSpan="9" className="px-5 py-10 text-center text-[var(--text-muted)]">No ESI-covered employees in this cycle.</td></tr>
                ) : (
                  reportData.records.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] font-mono">
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{r.ip_number || '—'}</td>
                      <td className="px-4 py-3 font-sans font-medium text-[var(--text-primary)]">{r.ip_name}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{r.employee_code}</td>
                      <td className="px-4 py-3">{r.no_of_days_worked}d</td>
                      <td className="px-4 py-3">₹{parseFloat(r.total_monthly_wages).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-[var(--status-danger)]">₹{parseFloat(r.ip_contribution).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-[var(--accent-primary)]">₹{parseFloat(r.employer_contribution).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-[var(--status-success)]">₹{parseFloat(r.total_contribution).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-sans text-[var(--text-muted)]">{r.reason_code}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : reportType === 'tds_24q' ? (
          <div className="overflow-x-auto">
            <div className="px-5 py-3 bg-[var(--accent-primary)]/10 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-primary)]">
              <span>
                Form 24Q ({reportData.quarter}): FY <strong>{reportData.financial_year}</strong> · Total Tax Deposited: <strong>₹{parseFloat(reportData.totals?.total_tax_deposited || 0).toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-[var(--text-muted)]">
                Total Salary Paid: ₹{parseFloat(reportData.totals?.gross_paid || 0).toLocaleString('en-IN')} | TDS Deducted: ₹{parseFloat(reportData.totals?.tds_deducted || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <table className="w-full text-xs text-left text-[var(--text-secondary)]">
              <thead className="uppercase bg-[var(--bg-primary)]/70 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-3">PAN</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3">Gross Wages</th>
                  <th className="px-4 py-3">TDS Deducted</th>
                  <th className="px-4 py-3">Cess (4%)</th>
                  <th className="px-4 py-3">Total Tax Paid</th>
                  <th className="px-4 py-3">Challan / BSR</th>
                </tr>
              </thead>
              <tbody>
                {(!reportData.records || reportData.records.length === 0) ? (
                  <tr><td colSpan="9" className="px-5 py-10 text-center text-[var(--text-muted)]">No TDS records found for {quarter} {financialYear}.</td></tr>
                ) : (
                  reportData.records.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] font-mono">
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{r.pan}</td>
                      <td className="px-4 py-3 font-sans font-medium text-[var(--text-primary)]">{r.employee_name} ({r.employee_code})</td>
                      <td className="px-4 py-3">{r.section}</td>
                      <td className="px-4 py-3">{r.payment_date}</td>
                      <td className="px-4 py-3">₹{parseFloat(r.gross_amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-[var(--status-danger)]">₹{parseFloat(r.tds_deducted).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">₹{parseFloat(r.cess_4_pct).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-[var(--status-success)]">₹{parseFloat(r.total_tax_deposited).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{r.challan_bsr}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : reportType === 'form_16' ? (
          <div className="overflow-x-auto">
            <div className="px-5 py-3 bg-[var(--accent-primary)]/10 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-primary)]">
              <span>
                Form 16 Part B Summary · Financial Year <strong>{reportData.financial_year}</strong> · Headcount: <strong>{reportData.count || 0}</strong>
              </span>
              <span className="text-[var(--text-muted)]">Annual Taxable Salary, Deductions (16 & VI-A), and TDS Deposited</span>
            </div>
            <table className="w-full text-xs text-left text-[var(--text-secondary)]">
              <thead className="uppercase bg-[var(--bg-primary)]/70 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">PAN / Regime</th>
                  <th className="px-4 py-3">Gross Salary (17(1))</th>
                  <th className="px-4 py-3">Std. Deduction (16(ia))</th>
                  <th className="px-4 py-3">PT (16(iii))</th>
                  <th className="px-4 py-3">Total Taxable Income</th>
                  <th className="px-4 py-3">Net Tax Liability</th>
                  <th className="px-4 py-3">TDS Deducted</th>
                  <th className="px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {(!reportData.records || reportData.records.length === 0) ? (
                  <tr><td colSpan="9" className="px-5 py-10 text-center text-[var(--text-muted)]">No payroll runs found for Financial Year {financialYear}.</td></tr>
                ) : (
                  reportData.records.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--text-primary)]">{r.employee_name}</p>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">{r.employee_code}</span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <p className="text-[var(--text-primary)]">{r.pan}</p>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)]">{r.tax_regime}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-[var(--text-primary)]">₹{parseFloat(r.gross_salary).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-[var(--status-danger)]">₹{parseFloat(r.standard_deduction).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-[var(--status-danger)]">₹{parseFloat(r.professional_tax).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)]">₹{parseFloat(r.total_taxable_income).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-[var(--status-danger)]">₹{parseFloat(r.net_tax_liability).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[var(--status-success)]">₹{parseFloat(r.total_tds_deducted).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${parseFloat(r.tax_payable_or_refund) > 0 ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)]' : 'bg-[var(--status-success)]/15 text-[var(--status-success)]'}`}>
                          {parseFloat(r.tax_payable_or_refund) > 0 ? `Pay ₹${parseFloat(r.tax_payable_or_refund).toLocaleString('en-IN')}` : parseFloat(r.tax_payable_or_refund) < 0 ? `Refund ₹${Math.abs(parseFloat(r.tax_payable_or_refund)).toLocaleString('en-IN')}` : 'Nil'}
                        </span>
                      </td>
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
