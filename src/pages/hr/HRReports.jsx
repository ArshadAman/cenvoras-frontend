import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  BookOpenIcon, ArrowDownTrayIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

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

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getHRReports({ type: reportType, year, month });
      setReportData(res.data);
    } catch (err) {
      toast.error("Failed to generate HR report");
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
      <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Analytics & Compliance</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
              <BookOpenIcon className="w-9 h-9 text-indigo-300" />
              HR & Payroll Reports
            </h1>
            <p className="text-white/65 text-sm mt-2">
              Generate audit-ready payroll registers, department expense breakdowns, and statutory liability summaries.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </section>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-black/25 border border-white/10 p-4 rounded-2xl">
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
                reportType === t.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs">
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs"
          />
        </div>
      </div>

      {/* Report Tables */}
      <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="p-16 text-center text-gray-400 text-sm">Generating report...</div>
        ) : !reportData ? (
          <div className="p-16 text-center text-gray-400 text-sm">No report data generated.</div>
        ) : reportType === 'payroll_register' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Department / Branch</th>
                  <th className="px-5 py-4">Bank / IFSC</th>
                  <th className="px-5 py-4">Days (Work/LOP)</th>
                  <th className="px-5 py-4">Gross Salary</th>
                  <th className="px-5 py-4">Deductions</th>
                  <th className="px-5 py-4">Net Salary</th>
                  <th className="px-5 py-4">Employer Contr.</th>
                </tr>
              </thead>
              <tbody>
                {(!reportData.records || reportData.records.length === 0) ? (
                  <tr><td colSpan="8" className="px-5 py-10 text-center text-gray-400">No payslips found for this cycle.</td></tr>
                ) : (
                  reportData.records.map((r, i) => (
                    <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-5 py-4 font-medium text-white">
                        <p>{r.employee_name}</p>
                        <p className="text-xs text-gray-400">{r.employee_code}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white">{r.department}</p>
                        <p className="text-xs text-indigo-300">{r.branch}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono">
                        <p>{r.bank_account}</p>
                        <p className="text-gray-400">{r.ifsc}</p>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="text-emerald-400">{r.working_days}d</span> / <span className="text-red-400">{r.lop_days}d</span>
                      </td>
                      <td className="px-5 py-4 font-medium text-white">₹{parseFloat(r.gross_salary).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-red-400">₹{parseFloat(r.total_deductions).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 font-bold text-emerald-400">₹{parseFloat(r.net_salary).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-xs text-indigo-300">₹{parseFloat(r.employer_contribution).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : reportType === 'department_expenses' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
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
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No departmental data for this cycle.</td></tr>
                ) : (
                  reportData.results.map((d, i) => (
                    <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-semibold text-white">{d.department}</td>
                      <td className="px-6 py-4">{d.headcount}</td>
                      <td className="px-6 py-4">₹{parseFloat(d.gross).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-red-400">₹{parseFloat(d.deductions).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">₹{parseFloat(d.net).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-indigo-300">₹{parseFloat(d.employer_contribution).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Provident Fund (EPFO)</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Employee Contribution (12%):</span>
                <span className="font-semibold text-white">₹{parseFloat(reportData.employee_pf || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Employer Contribution (12%):</span>
                <span className="font-semibold text-white">₹{parseFloat(reportData.employer_pf || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-2 font-bold text-emerald-400">
                <span>Total PF Remittance Liability:</span>
                <span>₹{parseFloat(reportData.total_pf_liability || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Employee State Insurance (ESIC)</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Employee Contribution (0.75%):</span>
                <span className="font-semibold text-white">₹{parseFloat(reportData.employee_esi || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Employer Contribution (3.25%):</span>
                <span className="font-semibold text-white">₹{parseFloat(reportData.employer_esi || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-2 font-bold text-emerald-400">
                <span>Total ESI Remittance Liability:</span>
                <span>₹{parseFloat(reportData.total_esi_liability || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Professional Tax (PT)</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total State PT Deducted:</span>
                <span className="font-bold text-white">₹{parseFloat(reportData.professional_tax || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Tax Deducted at Source (TDS)</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total TDS Payable (Income Tax):</span>
                <span className="font-bold text-white">₹{parseFloat(reportData.tds_payable || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
